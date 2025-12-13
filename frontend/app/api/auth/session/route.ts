/**
 * GET /api/auth/session
 *
 * Verifies the current session and returns user data.
 * Used by the extension to validate tokens and get user info.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/infra/firebase/admin';

export async function GET(request: NextRequest) {
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

    // Get user document from Firestore
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    return NextResponse.json({
      user: {
        id: uid,
        email: userData?.email,
        displayName: userData?.displayName,
        photoURL: userData?.photoURL,
      },
      subscription: userData?.subscription || { status: 'free' },
    });
  } catch (error) {
    console.error('Error in /api/auth/session:', error);

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
