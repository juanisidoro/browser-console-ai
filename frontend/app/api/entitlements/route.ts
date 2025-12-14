/**
 * Entitlements API Route
 *
 * GET /api/entitlements
 *
 * Returns the current plan and feature limits for a user/device.
 * This separates entitlements (what you can do) from authentication (who you are).
 *
 * Input:
 *   - ?installationId=xxx (for extension)
 *   - ?browserId=xxx (for web anonymous)
 *   - Authorization: Bearer <Firebase ID Token> (optional, for logged-in users)
 *
 * Output:
 *   {
 *     plan: 'free' | 'trial' | 'pro' | 'pro_early',
 *     planEndsAt: number | null,     // null for free, currentPeriodEnd for pro subscription
 *     daysRemaining: number | null,  // null for free/pro, days left for trial
 *     limits: Entitlements,
 *     canExtendTrial: boolean,       // true if trial not yet extended with email
 *     requiresAuth: boolean          // true if user needs to link account for features
 *   }
 *
 * Priority rules:
 *   1. PRO by userId (active Stripe subscription) -> highest priority
 *   2. TRIAL by userId (6 days from web or +3 extended) -> takes precedence
 *   3. TRIAL by installationId (3 days base) -> fallback
 *   4. FREE -> default
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/infra/firebase/admin';
import { getEntitlements, type Plan, type TrialLicense } from '../../../../shared/core';

interface UserSubscription {
  status: string;
  currentPeriodEnd?: { toMillis?: () => number } | null;
  cancelAtPeriodEnd?: boolean;
}

interface UserData {
  subscription?: UserSubscription;
  // Trial started from web (user-level trial, not device-level)
  userTrial?: {
    startedAt: number;
    expiresAt: number;
    extended?: boolean;
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const installationId = url.searchParams.get('installationId');
    const browserId = url.searchParams.get('browserId');

    const db = getAdminDb();
    let userId: string | null = null;

    // Try to get userId from Bearer token (Firebase ID Token)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.slice(7);
        const adminAuth = getAdminAuth();
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        userId = decodedToken.uid;
      } catch {
        // Token invalid or expired - continue without userId
        // Don't return 401 here, just treat as anonymous
      }
    }

    // ================================================================
    // PRIORITY 1: Check PRO subscription by userId
    // ================================================================
    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data() as UserData;
        const subscription = userData?.subscription;

        if (subscription && ['pro', 'pro_early'].includes(subscription.status)) {
          const plan = subscription.status as Plan;

          // Get currentPeriodEnd (Firestore Timestamp -> ms)
          let planEndsAt: number | null = null;
          if (subscription.currentPeriodEnd) {
            if (typeof subscription.currentPeriodEnd.toMillis === 'function') {
              planEndsAt = subscription.currentPeriodEnd.toMillis();
            }
          }

          return NextResponse.json({
            plan,
            planEndsAt,
            daysRemaining: null, // PRO doesn't have "days remaining" in trial sense
            limits: getEntitlements(plan),
            canExtendTrial: false,
            requiresAuth: false,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
          });
        }
      }
    }

    // ================================================================
    // PRIORITY 2: Check TRIAL by userId (web trial or extended)
    // ================================================================
    if (userId) {
      // Check if there's a trial linked to this userId
      const userTrialsSnapshot = await db
        .collection('trials')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!userTrialsSnapshot.empty) {
        const trialDoc = userTrialsSnapshot.docs[0];
        const trialData = trialDoc.data() as TrialLicense;

        if (trialData.expiresAt > Date.now()) {
          const daysRemaining = Math.ceil(
            (trialData.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)
          );

          return NextResponse.json({
            plan: 'trial' as Plan,
            planEndsAt: trialData.expiresAt,
            daysRemaining,
            limits: getEntitlements('trial'),
            canExtendTrial: !trialData.extended, // Can extend if not already extended
            requiresAuth: false,
          });
        }
      }

      // Check user-level trial (started from web dashboard)
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data() as UserData;
        if (userData?.userTrial && userData.userTrial.expiresAt > Date.now()) {
          const daysRemaining = Math.ceil(
            (userData.userTrial.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)
          );

          return NextResponse.json({
            plan: 'trial' as Plan,
            planEndsAt: userData.userTrial.expiresAt,
            daysRemaining,
            limits: getEntitlements('trial'),
            canExtendTrial: !userData.userTrial.extended,
            requiresAuth: false,
          });
        }
      }
    }

    // ================================================================
    // PRIORITY 3: Check TRIAL by installationId (extension-only)
    // ================================================================
    if (installationId) {
      const trialRef = db.collection('trials').doc(installationId);
      const trialDoc = await trialRef.get();

      if (trialDoc.exists) {
        const trialData = trialDoc.data() as TrialLicense;

        if (trialData.expiresAt > Date.now()) {
          const daysRemaining = Math.ceil(
            (trialData.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)
          );

          return NextResponse.json({
            plan: 'trial' as Plan,
            planEndsAt: trialData.expiresAt,
            daysRemaining,
            limits: getEntitlements('trial'),
            canExtendTrial: !trialData.extended,
            requiresAuth: !trialData.extended, // Suggest linking account if not extended
            trialLinkedToUser: !!trialData.userId,
          });
        } else {
          // Trial expired
          return NextResponse.json({
            plan: 'free' as Plan,
            planEndsAt: null,
            daysRemaining: null,
            limits: getEntitlements('free'),
            canExtendTrial: false,
            requiresAuth: true,
            trialExpired: true,
            trialExpiredAt: trialData.expiresAt,
          });
        }
      }

      // No trial exists for this installationId - can activate one
      return NextResponse.json({
        plan: 'free' as Plan,
        planEndsAt: null,
        daysRemaining: null,
        limits: getEntitlements('free'),
        canExtendTrial: false,
        canActivateTrial: true,
        requiresAuth: false,
      });
    }

    // ================================================================
    // PRIORITY 4: Default to FREE (web anonymous with browserId)
    // ================================================================
    return NextResponse.json({
      plan: 'free' as Plan,
      planEndsAt: null,
      daysRemaining: null,
      limits: getEntitlements('free'),
      canExtendTrial: false,
      requiresAuth: true, // Encourage account creation
      browserId: browserId || null,
    });
  } catch (error) {
    console.error('Error getting entitlements:', error);
    return NextResponse.json(
      { error: 'Failed to get entitlements' },
      { status: 500 }
    );
  }
}
