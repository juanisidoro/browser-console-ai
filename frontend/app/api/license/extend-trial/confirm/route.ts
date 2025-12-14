/**
 * Extend Trial Confirm API Route
 *
 * POST /api/license/extend-trial/confirm
 *
 * Validates a magic link token and extends the trial.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/infra/firebase/admin';
import { signTrialToken } from '@/infra/licensing/jwt-service';
import {
  calculateExtendedExpiry,
  getDaysRemainingAfterExtension,
  TRIAL_EXTENSION_DAYS,
} from '../../../../../../shared/core';
import type { TrialLicense } from '../../../../../../shared/core';
import { v4 as uuidv4 } from 'uuid';

// Generate a short one-time code (6 alphanumeric characters)
function generateOneTimeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like 0/O, 1/I/L
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// One-time code expiry (15 minutes)
const ONE_TIME_CODE_EXPIRY_MS = 15 * 60 * 1000;

interface MagicLinkData {
  email: string;
  installationId: string;
  expiresAt: number;
  used: boolean;
  createdAt: number;
}

/**
 * POST /api/license/extend-trial/confirm
 *
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({
        success: false,
        message: 'Invalid magic link.',
      });
    }

    const db = getAdminDb();

    // Get magic link data
    const magicLinkRef = db.collection('magic_links').doc(token);
    const magicLinkDoc = await magicLinkRef.get();

    if (!magicLinkDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'Magic link not found or invalid.',
      });
    }

    const magicLinkData = magicLinkDoc.data() as MagicLinkData;

    // Check if already used
    if (magicLinkData.used) {
      return NextResponse.json({
        success: false,
        message: 'This magic link has already been used.',
      });
    }

    // Check if expired
    if (Date.now() > magicLinkData.expiresAt) {
      return NextResponse.json({
        success: false,
        message: 'Magic link has expired. Please request a new one.',
      });
    }

    const { email, installationId } = magicLinkData;

    // Get the trial for this installation
    const trialRef = db.collection('trials').doc(installationId);
    const trialDoc = await trialRef.get();

    if (!trialDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'No trial found for this installation.',
      });
    }

    const trialData = trialDoc.data() as TrialLicense;

    // Check if already extended
    if (trialData.extended) {
      return NextResponse.json({
        success: false,
        message: 'Trial has already been extended.',
      });
    }

    // Calculate new expiration
    const newExpiresAt = calculateExtendedExpiry(trialData.expiresAt);
    const newTokenId = uuidv4();

    // Update trial record
    await trialRef.update({
      extended: true,
      extendedAt: Date.now(),
      email: email.toLowerCase(),
      expiresAt: newExpiresAt,
      tokenId: newTokenId,
    });

    // Mark magic link as used
    await magicLinkRef.update({
      used: true,
      usedAt: Date.now(),
    });

    // Generate new license token for the extension
    const licenseToken = await signTrialToken(
      installationId,
      newTokenId,
      newExpiresAt,
      { email }
    );

    // Store the new token for the extension to pick up
    await db.collection('pending_tokens').doc(installationId).set({
      token: licenseToken,
      createdAt: Date.now(),
      expiresAt: newExpiresAt,
    });

    // Generate a one-time code for extension to link the account
    const oneTimeCode = generateOneTimeCode();
    const codeExpiresAt = Date.now() + ONE_TIME_CODE_EXPIRY_MS;

    // Store the one-time code in Firestore
    await db.collection('confirm_codes').doc(oneTimeCode).set({
      installationId,
      email: email.toLowerCase(),
      expiresAt: codeExpiresAt,
      used: false,
      createdAt: Date.now(),
      licenseToken, // Include the license token for the extension to retrieve
      trialExpiresAt: newExpiresAt,
    });

    const daysRemaining = getDaysRemainingAfterExtension(newExpiresAt);

    return NextResponse.json({
      success: true,
      message: `Trial extended by ${TRIAL_EXTENSION_DAYS} days! You now have ${daysRemaining} days remaining.`,
      daysRemaining,
      expiresAt: new Date(newExpiresAt).toISOString(),
      // Include the one-time code for the extension to use
      oneTimeCode,
      codeExpiresAt: new Date(codeExpiresAt).toISOString(),
    });

  } catch (error) {
    console.error('Error confirming trial extension:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred. Please try again.',
    }, { status: 500 });
  }
}
