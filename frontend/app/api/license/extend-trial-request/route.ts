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
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';
import type { TrialLicense } from '../../../../../shared/core';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: 'Browser Console AI <noreply@browserconsoleai.com>',
      to: email,
      subject: 'Extend your Browser Console AI trial (+3 days)',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #e5e5e5; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #2d2d44;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 24px; font-weight: 700; margin: 0; color: #ffffff;">🎁 Extend Your Trial</h1>
            </div>

            <p style="font-size: 16px; line-height: 1.6; color: #a0aec0; margin-bottom: 24px;">
              Click the button below to add <strong style="color: #8b5cf6;">3 more days</strong> to your Browser Console AI trial.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Extend My Trial
              </a>
            </div>

            <p style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">
              This link expires in 1 hour and can only be used once.
            </p>

            <p style="font-size: 13px; color: #6b7280;">
              If you didn't request this, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #2d2d44; margin: 32px 0;">

            <p style="font-size: 12px; color: #4b5563; text-align: center;">
              Browser Console AI - Capture browser logs for AI agents
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Failed to send email:', emailError);
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
