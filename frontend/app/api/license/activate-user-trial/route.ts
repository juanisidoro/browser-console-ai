/**
 * Activate User Trial API Route
 *
 * POST /api/license/activate-user-trial
 *
 * Activates a 6-day trial for authenticated users (web signup).
 * Unlike extension trial (3 days), this gives full 6 days since user already has email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/infra/firebase/admin';
import { signTrialToken } from '@/infra/licensing/jwt-service';
import { FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// 6 days for web users (they already provided email)
const WEB_TRIAL_DURATION_DAYS = 6;

/**
 * POST /api/license/activate-user-trial
 *
 * Activates a trial for an authenticated user.
 * Returns a license token that can be used in the extension.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authHeader.slice(7);
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required to activate trial' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Check if user already has an active subscription
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (userData?.subscriptionStatus === 'active' || userData?.subscriptionStatus === 'trialing') {
      return NextResponse.json({
        success: false,
        error: 'already_subscribed',
        message: 'You already have an active subscription.',
      });
    }

    // Check if user already used their web trial
    const existingTrialQuery = await db.collection('user_trials')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existingTrialQuery.empty) {
      const existingTrial = existingTrialQuery.docs[0].data();

      // If trial is still valid, return existing token
      if (existingTrial.expiresAt > Date.now()) {
        return NextResponse.json({
          success: true,
          token: existingTrial.token,
          expiresAt: new Date(existingTrial.expiresAt).toISOString(),
          daysRemaining: Math.ceil((existingTrial.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)),
          reactivated: true,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'trial_expired',
          message: 'Your trial has expired. Upgrade to PRO to continue.',
        });
      }
    }

    // Also check if email was used for extension trial
    const emailTrialQuery = await db.collection('trials')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (!emailTrialQuery.empty) {
      const existingTrial = emailTrialQuery.docs[0].data();

      if (existingTrial.expiresAt > Date.now()) {
        // Return existing extension trial info
        return NextResponse.json({
          success: false,
          error: 'trial_exists_extension',
          message: 'You have an active trial via the extension. Use that token.',
          expiresAt: new Date(existingTrial.expiresAt).toISOString(),
        });
      }
    }

    // Create new trial for web user
    const tokenId = uuidv4();
    const expiresAt = Date.now() + (WEB_TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

    // Generate license token
    const token = await signTrialToken(
      userId,  // installationId (userId for web users)
      tokenId,
      expiresAt,  // in milliseconds
      { email, userId }
    );

    // Store trial record
    await db.collection('user_trials').add({
      userId,
      email: email.toLowerCase(),
      tokenId,
      token,
      expiresAt,
      createdAt: FieldValue.serverTimestamp(),
      source: 'web_dashboard',
    });

    // Update user record
    await db.collection('users').doc(userId).update({
      trialActivatedAt: FieldValue.serverTimestamp(),
      trialExpiresAt: expiresAt,
      hasActiveTrial: true,
    });

    // Track analytics event
    try {
      await db.collection('analytics_events').add({
        event: 'trial_activated',
        userId,
        installationId: 'web',
        timestamp: Date.now(),
        data: {
          source: 'web_dashboard',
          durationDays: WEB_TRIAL_DURATION_DAYS,
        },
        metadata: {},
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.error('Failed to track trial activation:', e);
    }

    return NextResponse.json({
      success: true,
      token,
      expiresAt: new Date(expiresAt).toISOString(),
      daysRemaining: WEB_TRIAL_DURATION_DAYS,
    });
  } catch (error) {
    console.error('Error activating user trial:', error);
    return NextResponse.json(
      { error: 'Failed to activate trial' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/license/activate-user-trial
 *
 * Check trial status for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authHeader.slice(7);
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const db = getAdminDb();

    // Check user trial
    const trialQuery = await db.collection('user_trials')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (trialQuery.empty) {
      return NextResponse.json({
        hasTrialed: false,
        canActivate: true,
      });
    }

    const trialData = trialQuery.docs[0].data();
    const isValid = trialData.expiresAt > Date.now();

    return NextResponse.json({
      hasTrialed: true,
      canActivate: false,
      isValid,
      token: isValid ? trialData.token : null,
      expiresAt: isValid ? new Date(trialData.expiresAt).toISOString() : null,
      daysRemaining: isValid
        ? Math.ceil((trialData.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
        : 0,
    });
  } catch (error) {
    console.error('Error checking user trial:', error);
    return NextResponse.json(
      { error: 'Failed to check trial status' },
      { status: 500 }
    );
  }
}
