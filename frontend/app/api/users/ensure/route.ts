/**
 * POST /api/users/ensure
 *
 * Ensures a user document exists in Firestore after authentication.
 * Creates the document if it doesn't exist, or updates lastLogin if it does.
 *
 * This is called automatically after successful login from the auth provider.
 * The user document stores subscription status and other account data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/infra/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    // Get the ID token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.slice(7);

    // Verify the ID token
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

    // Get or create user document
    const db = getAdminDb();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create new user document with free subscription
      await userRef.set({
        email,
        displayName: decodedToken.name || null,
        photoURL: decodedToken.picture || null,
        createdAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
        subscription: {
          status: 'free',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
        },
      });

      return NextResponse.json({
        success: true,
        created: true,
        message: 'User document created',
      });
    }

    // Update last login
    await userRef.update({
      lastLoginAt: FieldValue.serverTimestamp(),
      // Update these in case they changed in Firebase Auth
      displayName: decodedToken.name || null,
      photoURL: decodedToken.picture || null,
    });

    return NextResponse.json({
      success: true,
      created: false,
      message: 'User document updated',
    });
  } catch (error) {
    console.error('Error in /api/users/ensure:', error);

    // Handle specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes('auth/id-token-expired')) {
        return NextResponse.json(
          { error: 'Token expired' },
          { status: 401 }
        );
      }
      if (error.message.includes('auth/invalid-id-token')) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
