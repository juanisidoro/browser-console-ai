/**
 * POST /api/license/rotate
 *
 * Rotates (revokes old + generates new) the user's license token.
 * Use when user suspects token compromise or wants to log out other devices.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/infra/firebase/admin';
import { signLicenseToken, verifyLicenseToken } from '@/infra/licensing/jwt-service';
import { FieldValue } from 'firebase-admin/firestore';
import type { Plan } from '../../../../../shared/core';

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
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Get current token to revoke
    const oldToken = userData?.licenseToken;
    if (oldToken) {
      const oldVerification = await verifyLicenseToken(oldToken);
      if (oldVerification.payload?.tokenId) {
        // Add old token ID to revoked list
        await userRef.update({
          revokedTokens: FieldValue.arrayUnion(oldVerification.payload.tokenId),
        });
      }
    }

    // Determine plan from subscription status
    const subscriptionStatus = userData?.subscription?.status || 'free';
    const plan: Plan = ['pro', 'pro_early'].includes(subscriptionStatus)
      ? (subscriptionStatus as Plan)
      : 'free';

    // Generate new token
    const newToken = await signLicenseToken(uid, email, plan);

    // Store new token
    await userRef.update({
      licenseToken: newToken,
      licenseTokenUpdatedAt: new Date(),
    });

    // Get expiry info
    const verification = await verifyLicenseToken(newToken);

    return NextResponse.json({
      success: true,
      token: newToken,
      plan,
      expiresAt: verification.payload
        ? new Date(verification.payload.exp).toISOString()
        : null,
      message: 'Token rotated successfully. Previous token has been revoked.',
    });
  } catch (error) {
    console.error('Error rotating license:', error);

    return NextResponse.json(
      { error: 'Failed to rotate license' },
      { status: 500 }
    );
  }
}
