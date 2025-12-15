/**
 * GET /api/auth/session
 *
 * Verifies the current session and returns user data.
 * Used by the extension to validate tokens and get user info.
 *
 * Headers:
 * - Authorization: Bearer <idToken> (required)
 * - X-Installation-Id: <installationId> (optional, for onboarding migration)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/infra/firebase/admin';

interface OnboardingProgress {
  extensionInstalled: boolean;
  trialActivated: boolean;
  firstRecording: boolean;
  mcpConnected: boolean;
}

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
    const installationId = request.headers.get('X-Installation-Id');

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

    // Get onboarding progress from user document
    const userOnboarding: OnboardingProgress = {
      extensionInstalled: userData?.onboarding?.extensionInstalled || false,
      trialActivated: userData?.onboarding?.trialActivated || false,
      firstRecording: userData?.onboarding?.firstRecording || false,
      mcpConnected: userData?.onboarding?.mcpConnected || false,
    };

    // If installationId provided, merge with installation-based progress
    let installationOnboarding: Partial<OnboardingProgress> = {};
    if (installationId) {
      const installationDoc = await db
        .collection('onboarding_progress')
        .doc(installationId)
        .get();

      if (installationDoc.exists) {
        const data = installationDoc.data();
        installationOnboarding = {
          extensionInstalled: data?.extensionInstalled || false,
          trialActivated: data?.trialActivated || false,
          firstRecording: data?.firstRecording || false,
          mcpConnected: data?.mcpConnected || false,
        };
      }
    }

    // Merge onboarding progress (OR logic - if true in either, it's true)
    const mergedOnboarding: OnboardingProgress = {
      extensionInstalled: userOnboarding.extensionInstalled || installationOnboarding.extensionInstalled || false,
      trialActivated: userOnboarding.trialActivated || installationOnboarding.trialActivated || false,
      firstRecording: userOnboarding.firstRecording || installationOnboarding.firstRecording || false,
      mcpConnected: userOnboarding.mcpConnected || installationOnboarding.mcpConnected || false,
    };

    // Also check if user has active trial/pro (counts as trial activated)
    const subscription = userData?.subscription;
    if (subscription?.status && ['trial', 'pro', 'pro_early'].includes(subscription.status)) {
      mergedOnboarding.trialActivated = true;
    }

    // If merged progress differs from user's stored progress, update the user document
    const needsUpdate =
      mergedOnboarding.extensionInstalled !== userOnboarding.extensionInstalled ||
      mergedOnboarding.trialActivated !== userOnboarding.trialActivated ||
      mergedOnboarding.firstRecording !== userOnboarding.firstRecording ||
      mergedOnboarding.mcpConnected !== userOnboarding.mcpConnected;

    if (needsUpdate) {
      await db.collection('users').doc(uid).set(
        { onboarding: mergedOnboarding },
        { merge: true }
      );
      console.log(`[Session] Merged onboarding progress for user ${uid} from installation ${installationId}`);
    }

    // Link installationId to userId for future reference
    if (installationId) {
      await db.collection('onboarding_progress').doc(installationId).set(
        { linkedUserId: uid, linkedAt: Date.now() },
        { merge: true }
      );
    }

    return NextResponse.json({
      user: {
        id: uid,
        email: userData?.email,
        displayName: userData?.displayName,
        photoURL: userData?.photoURL,
      },
      subscription: subscription || { status: 'free' },
      onboarding: mergedOnboarding,
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
