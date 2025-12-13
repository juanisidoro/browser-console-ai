/**
 * License API Routes
 *
 * GET /api/license - Get current license token (generates if needed)
 * POST /api/license - Verify a license token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/infra/firebase/admin';
import { signLicenseToken, verifyLicenseToken } from '@/infra/licensing/jwt-service';
import type { Plan } from '../../../../shared/core';

/**
 * GET /api/license
 *
 * Generates a new license token for the authenticated user.
 * Returns existing token if still valid and not close to expiry.
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
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Get user's subscription status from Firestore
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    // Determine plan from subscription status
    const subscriptionStatus = userData?.subscription?.status || 'free';
    const plan: Plan = ['pro', 'pro_early'].includes(subscriptionStatus)
      ? (subscriptionStatus as Plan)
      : 'free';

    // Check if user has a stored token that's still valid
    const storedToken = userData?.licenseToken;
    if (storedToken) {
      const verification = await verifyLicenseToken(storedToken);
      if (verification.valid && verification.payload) {
        // Check if token needs refresh (less than 24h remaining)
        const timeRemaining = verification.payload.exp - Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (timeRemaining > twentyFourHours) {
          // Token is still good, return it
          return NextResponse.json({
            token: storedToken,
            plan,
            expiresAt: new Date(verification.payload.exp).toISOString(),
          });
        }
      }
    }

    // Generate new token
    const newToken = await signLicenseToken(uid, email, plan);

    // Store token in Firestore
    await db.collection('users').doc(uid).update({
      licenseToken: newToken,
      licenseTokenUpdatedAt: new Date(),
    });

    // Decode to get expiry
    const verification = await verifyLicenseToken(newToken);

    return NextResponse.json({
      token: newToken,
      plan,
      expiresAt: verification.payload
        ? new Date(verification.payload.exp).toISOString()
        : null,
    });
  } catch (error) {
    console.error('Error generating license:', error);

    return NextResponse.json(
      { error: 'Failed to generate license' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/license
 *
 * Verifies a license token. Used by extension/MCP server.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const verification = await verifyLicenseToken(token);

    if (!verification.valid) {
      return NextResponse.json({
        valid: false,
        reason: verification.reason,
      });
    }

    // Optionally check if token is revoked in Firestore
    if (verification.payload) {
      const db = getAdminDb();
      const userDoc = await db.collection('users').doc(verification.payload.sub).get();
      const userData = userDoc.data();

      // Check if this specific token has been revoked
      const revokedTokens = userData?.revokedTokens || [];
      if (revokedTokens.includes(verification.payload.tokenId)) {
        return NextResponse.json({
          valid: false,
          reason: 'revoked',
        });
      }
    }

    return NextResponse.json({
      valid: true,
      payload: {
        userId: verification.payload?.sub,
        email: verification.payload?.email,
        plan: verification.payload?.plan,
        expiresAt: verification.payload
          ? new Date(verification.payload.exp).toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error('Error verifying license:', error);

    return NextResponse.json(
      { error: 'Failed to verify license' },
      { status: 500 }
    );
  }
}
