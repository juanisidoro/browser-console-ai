/**
 * Extend Trial Request API Route
 *
 * POST /api/license/extend-trial-request
 *
 * Sends a magic link email to extend the trial by 3 more days.
 * No authentication required - uses installationId + email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/infra/firebase/admin';
import { getEmailServiceInstance } from '@/infra/email';
import { v4 as uuidv4 } from 'uuid';
import type { TrialLicense } from '../../../../../shared/core';
import { isDisposableEmail } from '../../../../../shared/core';

/**
 * Check if this email is new (never received welcome email)
 * and send welcome email if so
 */
async function sendWelcomeIfNewEmail(email: string): Promise<void> {
  try {
    const db = getAdminDb();
    const normalizedEmail = email.toLowerCase();

    // Check if we've already sent welcome email to this address
    const welcomeRef = db.collection('email_welcome_sent').doc(normalizedEmail);
    const welcomeDoc = await welcomeRef.get();

    if (welcomeDoc.exists) {
      // Already sent welcome email
      return;
    }

    // Also check if user exists with this email (registered via web)
    const usersQuery = await db.collection('users')
      .where('email', '==', normalizedEmail)
      .where('welcomeEmailSent', '==', true)
      .limit(1)
      .get();

    if (!usersQuery.empty) {
      // User exists and already received welcome email
      return;
    }

    // Send welcome email
    const emailService = getEmailServiceInstance();
    const result = await emailService.sendWelcomeEmail({
      email: normalizedEmail,
      name: 'Developer',
    });

    if (result.success) {
      // Mark as sent (for extension users without web account)
      await welcomeRef.set({
        email: normalizedEmail,
        sentAt: Date.now(),
        source: 'extension_trial_extend',
      });
      console.log(`[WelcomeEmail] Sent to new extension user: ${email}`);
    }
  } catch (error) {
    console.error('[WelcomeEmail] Error in sendWelcomeIfNewEmail:', error);
    // Don't throw - this is fire and forget
  }
}

// Magic link token expiry (1 hour)
const MAGIC_LINK_EXPIRY_MS = 60 * 60 * 1000;

// Rate limiting: max requests per email per day
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // emails per day
const RATE_WINDOW = 24 * 60 * 60 * 1000;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * POST /api/license/extend-trial-request
 *
 * Body: { email: string, installationId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, installationId } = body;

    // Validate inputs
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    if (!installationId || typeof installationId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Installation ID is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Block disposable/temporary emails
    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Temporary email addresses are not allowed. Please use a permanent email.' },
        { status: 400 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const db = getAdminDb();

    // Check if trial exists for this installation
    const trialRef = db.collection('trials').doc(installationId);
    const trialDoc = await trialRef.get();

    if (!trialDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'No trial found. Please start a free trial first.',
      });
    }

    const trialData = trialDoc.data() as TrialLicense;

    // Check if trial is already extended
    if (trialData.extended) {
      return NextResponse.json({
        success: false,
        message: 'Trial has already been extended. Upgrade to PRO for continued access.',
      });
    }

    // Check if email was already used to extend another trial
    const existingExtension = await db.collection('trials')
      .where('email', '==', email.toLowerCase())
      .where('extended', '==', true)
      .limit(1)
      .get();

    if (!existingExtension.empty) {
      return NextResponse.json({
        success: false,
        message: 'This email has already been used to extend a trial.',
      });
    }

    // Generate magic link token
    const magicToken = uuidv4();
    const expiresAt = Date.now() + MAGIC_LINK_EXPIRY_MS;

    // Store magic link token
    await db.collection('magic_links').doc(magicToken).set({
      email: email.toLowerCase(),
      installationId,
      expiresAt,
      used: false,
      createdAt: Date.now(),
    });

    // Generate magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://browserconsoleai.com';
    const magicLink = `${baseUrl}/en/extend-trial/confirm?token=${magicToken}`;

    // Send welcome email if this is a new email (fire and forget)
    sendWelcomeIfNewEmail(email);

    // Send extend trial email
    const emailService = getEmailServiceInstance();
    const result = await emailService.sendExtendTrialEmail(email, magicLink);

    if (!result.success) {
      console.error('Failed to send email:', result.error);
      return NextResponse.json({
        success: false,
        message: 'Failed to send email. Please try again.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent! Check your email.',
    });

  } catch (error) {
    console.error('Error in extend-trial-request:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
