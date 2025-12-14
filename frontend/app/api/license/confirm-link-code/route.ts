/**
 * Confirm Link Code API Route
 *
 * POST /api/license/confirm-link-code
 *
 * Validates a one-time code from the trial extension flow
 * and returns the license token to the extension.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/infra/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// Rate limiting: max attempts per installation per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // attempts per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(installationId: string): boolean {
  const now = Date.now();
  const key = installationId;
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

interface ConfirmCodeData {
  installationId: string;
  email: string;
  expiresAt: number;
  used: boolean;
  createdAt: number;
  licenseToken: string;
  trialExpiresAt: number;
}

/**
 * POST /api/license/confirm-link-code
 *
 * Body: { code: string, installationId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, installationId } = body;

    // Validate input
    if (!code || typeof code !== 'string') {
      return NextResponse.json({
        success: false,
        message: 'Invalid code.',
      }, { status: 400 });
    }

    if (!installationId || typeof installationId !== 'string') {
      return NextResponse.json({
        success: false,
        message: 'Installation ID is required.',
      }, { status: 400 });
    }

    // Rate limiting to prevent brute force
    if (!checkRateLimit(installationId)) {
      return NextResponse.json({
        success: false,
        message: 'Too many attempts. Please try again later.',
      }, { status: 429 });
    }

    // Normalize code (uppercase, no spaces)
    const normalizedCode = code.toUpperCase().replace(/\s/g, '');

    const db = getAdminDb();

    // Get the code document
    const codeRef = db.collection('confirm_codes').doc(normalizedCode);
    const codeDoc = await codeRef.get();

    if (!codeDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'Invalid code. Please check and try again.',
      }, { status: 400 });
    }

    const codeData = codeDoc.data() as ConfirmCodeData;

    // Check if already used
    if (codeData.used) {
      return NextResponse.json({
        success: false,
        message: 'This code has already been used.',
      }, { status: 400 });
    }

    // Check if expired
    if (Date.now() > codeData.expiresAt) {
      return NextResponse.json({
        success: false,
        message: 'Code has expired. Please request a new trial extension.',
      }, { status: 400 });
    }

    // Verify installationId matches
    if (codeData.installationId !== installationId) {
      return NextResponse.json({
        success: false,
        message: 'This code was generated for a different installation.',
      }, { status: 400 });
    }

    // Mark code as used
    await codeRef.update({
      used: true,
      usedAt: Date.now(),
    });

    // Track the event
    const eventId = `trial_extended-${installationId}-${Date.now()}`;
    await db.collection('analytics_events').doc(eventId).set({
      event: 'trial_extended',
      installationId,
      userId: null, // Will be linked later when auth is connected
      timestamp: Date.now(),
      data: {
        source: 'one_time_code',
        email: codeData.email,
      },
      metadata: { source: 'confirm_link_code' },
      createdAt: FieldValue.serverTimestamp(),
    });

    // Return success with the license token
    return NextResponse.json({
      success: true,
      message: 'Code confirmed successfully!',
      licenseToken: codeData.licenseToken,
      email: codeData.email,
      expiresAt: new Date(codeData.trialExpiresAt).toISOString(),
    });

  } catch (error) {
    console.error('Error confirming link code:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred. Please try again.',
    }, { status: 500 });
  }
}
