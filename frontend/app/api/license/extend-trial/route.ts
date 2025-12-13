/**
 * Extend Trial API Route
 *
 * POST /api/license/extend-trial - Extend a trial by 3 more days after registration
 *
 * Requires authentication - user must be registered.
 * Links their installationId to their account and extends the trial.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/infra/firebase/admin';
import { signTrialToken } from '@/infra/licensing/jwt-service';
import {
  calculateExtendedExpiry,
  canExtendTrial,
  getDaysRemainingAfterExtension,
  TRIAL_EXTENSION_DAYS,
} from '../../../../../shared/core';
import type { TrialLicense } from '../../../../../shared/core';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/license/extend-trial
 *
 * Extends a trial license for a registered user.
 * Body: { installationId: string }
 * Auth: Bearer token (Firebase ID token)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to extend your trial' },
        { status: 401 }
      );
    }

    const idToken = authHeader.slice(7);
    const adminAuth = getAdminAuth();

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required to extend trial' },
        { status: 400 }
      );
    }

    // Get installationId from body
    const body = await request.json();
    const { installationId } = body;

    if (!installationId) {
      return NextResponse.json(
        { error: 'installationId is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Check if user already extended a trial (one extension per account)
    const existingExtensionQuery = await db.collection('trials')
      .where('userId', '==', userId)
      .where('extended', '==', true)
      .limit(1)
      .get();

    if (!existingExtensionQuery.empty) {
      return NextResponse.json({
        success: false,
        error: 'already_extended',
        message: 'You have already extended a trial with this account. Upgrade to PRO to continue.',
      });
    }

    // Get the trial for this installation
    const trialRef = db.collection('trials').doc(installationId);
    const trialDoc = await trialRef.get();

    if (!trialDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'no_trial',
        message: 'No trial found for this installation. Start a free trial first.',
      });
    }

    const trialData = trialDoc.data() as TrialLicense;

    // Validate if trial can be extended
    const validation = canExtendTrial(trialData);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: validation.error,
        message: validation.message,
      });
    }

    // Calculate new expiration
    const newExpiresAt = calculateExtendedExpiry(trialData.expiresAt);
    const newTokenId = uuidv4();

    // Update trial record
    await trialRef.update({
      extended: true,
      extendedAt: Date.now(),
      userId,
      email,
      expiresAt: newExpiresAt,
      tokenId: newTokenId,
    });

    // Generate new token with extended expiry and user info
    const token = await signTrialToken(
      installationId,
      newTokenId,
      newExpiresAt,
      { email, userId }
    );

    const daysRemaining = getDaysRemainingAfterExtension(newExpiresAt);

    return NextResponse.json({
      success: true,
      token,
      expiresAt: new Date(newExpiresAt).toISOString(),
      daysRemaining,
      extended: true,
      message: `Trial extended by ${TRIAL_EXTENSION_DAYS} days! You now have ${daysRemaining} days remaining.`,
    });
  } catch (error) {
    console.error('Error extending trial:', error);
    return NextResponse.json(
      { error: 'Failed to extend trial' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/license/extend-trial
 *
 * Check if user can extend their trial
 * Query: installationId
 * Auth: Bearer token (Firebase ID token)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({
        canExtend: false,
        reason: 'not_authenticated',
        message: 'Log in to extend your trial',
      });
    }

    const idToken = authHeader.slice(7);
    const adminAuth = getAdminAuth();

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({
        canExtend: false,
        reason: 'invalid_session',
        message: 'Session expired. Please log in again.',
      });
    }

    const userId = decodedToken.uid;

    // Get installationId from query
    const url = new URL(request.url);
    const installationId = url.searchParams.get('installationId');

    if (!installationId) {
      return NextResponse.json(
        { error: 'installationId is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Check if user already extended a trial
    const existingExtensionQuery = await db.collection('trials')
      .where('userId', '==', userId)
      .where('extended', '==', true)
      .limit(1)
      .get();

    if (!existingExtensionQuery.empty) {
      return NextResponse.json({
        canExtend: false,
        reason: 'already_extended_account',
        message: 'You have already extended a trial with this account.',
      });
    }

    // Get the trial for this installation
    const trialRef = db.collection('trials').doc(installationId);
    const trialDoc = await trialRef.get();

    if (!trialDoc.exists) {
      return NextResponse.json({
        canExtend: false,
        reason: 'no_trial',
        message: 'No trial found. Start a free trial first.',
      });
    }

    const trialData = trialDoc.data() as TrialLicense;

    // Check if already extended
    if (trialData.extended) {
      return NextResponse.json({
        canExtend: false,
        reason: 'already_extended',
        message: 'This trial has already been extended.',
      });
    }

    // Validate if trial can be extended
    const validation = canExtendTrial(trialData);

    return NextResponse.json({
      canExtend: validation.success,
      reason: validation.error,
      message: validation.message,
      currentExpiresAt: new Date(trialData.expiresAt).toISOString(),
      daysRemaining: Math.ceil((trialData.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)),
    });
  } catch (error) {
    console.error('Error checking trial extension:', error);
    return NextResponse.json(
      { error: 'Failed to check trial extension status' },
      { status: 500 }
    );
  }
}
