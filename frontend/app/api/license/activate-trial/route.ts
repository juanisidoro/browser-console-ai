/**
 * Activate Trial API Route
 *
 * POST /api/license/activate-trial - Activate a trial license for a device
 *
 * No authentication required - uses device fingerprint to prevent abuse.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/infra/firebase/admin';
import { signTrialToken } from '@/infra/licensing/jwt-service';
import { FieldValue } from 'firebase-admin/firestore';
import {
  validateFingerprint,
  generateFingerprintHash,
  createTrialLicense,
  PLAN_CONFIGS,
} from '../../../../../shared/core';
import type { DeviceFingerprint, TrialLicense } from '../../../../../shared/core';
import { v4 as uuidv4 } from 'uuid';

// Rate limiting: max trial activations per IP per day
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // attempts per day
const RATE_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Get IP from request
function getIpFromRequest(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

// Get country from request
function getCountryFromRequest(request: NextRequest): string {
  return request.headers.get('x-vercel-ip-country') ||
         request.geo?.country ||
         'XX';
}

/**
 * POST /api/license/activate-trial
 *
 * Activates a trial license for a device fingerprint.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getIpFromRequest(request);
    const country = getCountryFromRequest(request);

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many trial activations. Please try again tomorrow.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const fingerprint = body.fingerprint as DeviceFingerprint;

    // Validate fingerprint
    if (!fingerprint || !validateFingerprint(fingerprint)) {
      return NextResponse.json(
        { error: 'Invalid device fingerprint' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const installationId = fingerprint.installationId;

    // Check if this installation already has a trial
    const existingTrialRef = db.collection('trials').doc(installationId);
    const existingTrial = await existingTrialRef.get();

    if (existingTrial.exists) {
      const trialData = existingTrial.data() as TrialLicense;

      // Check if trial is still valid
      if (trialData.expiresAt > Date.now()) {
        // Return existing valid trial token
        const token = await signTrialToken(
          installationId,
          trialData.tokenId,
          trialData.expiresAt
        );

        return NextResponse.json({
          success: true,
          token,
          expiresAt: new Date(trialData.expiresAt).toISOString(),
          daysRemaining: Math.ceil((trialData.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)),
          reactivated: true,
        });
      } else {
        // Trial expired - reject
        return NextResponse.json({
          success: false,
          error: 'trial_expired',
          message: 'Your trial has expired. Upgrade to PRO to continue using all features.',
        });
      }
    }

    // Check fingerprint hash to detect device reuse
    const fingerprintHash = generateFingerprintHash(fingerprint);
    const duplicateCheck = await db.collection('trial_fingerprints')
      .where('hash', '==', fingerprintHash)
      .limit(1)
      .get();

    if (!duplicateCheck.empty) {
      return NextResponse.json({
        success: false,
        error: 'trial_already_used',
        message: 'A trial has already been used on this device.',
      });
    }

    // Create new trial
    const tokenId = uuidv4();
    const trialLicense = createTrialLicense(
      { fingerprint, ip, country },
      tokenId
    );

    // Store trial record
    await existingTrialRef.set({
      ...trialLicense,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Store fingerprint hash
    await db.collection('trial_fingerprints').add({
      hash: fingerprintHash,
      installationId,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Generate trial token
    const token = await signTrialToken(
      installationId,
      tokenId,
      trialLicense.expiresAt
    );

    return NextResponse.json({
      success: true,
      token,
      expiresAt: new Date(trialLicense.expiresAt).toISOString(),
      daysRemaining: PLAN_CONFIGS.trial.duration,
    });
  } catch (error) {
    console.error('Error activating trial:', error);
    return NextResponse.json(
      { error: 'Failed to activate trial' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/license/activate-trial
 *
 * Check trial status for an installation
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const installationId = url.searchParams.get('installationId');

    if (!installationId) {
      return NextResponse.json(
        { error: 'installationId is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const trialRef = db.collection('trials').doc(installationId);
    const trialDoc = await trialRef.get();

    if (!trialDoc.exists) {
      return NextResponse.json({
        hasTrialed: false,
        canActivate: true,
      });
    }

    const trialData = trialDoc.data() as TrialLicense;
    const isValid = trialData.expiresAt > Date.now();

    return NextResponse.json({
      hasTrialed: true,
      canActivate: false,
      isValid,
      expiresAt: isValid ? new Date(trialData.expiresAt).toISOString() : null,
      daysRemaining: isValid
        ? Math.ceil((trialData.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
        : 0,
    });
  } catch (error) {
    console.error('Error checking trial status:', error);
    return NextResponse.json(
      { error: 'Failed to check trial status' },
      { status: 500 }
    );
  }
}
