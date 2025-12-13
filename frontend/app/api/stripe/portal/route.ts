/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Customer Portal session for managing subscriptions.
 * Allows users to:
 * - Update payment method
 * - View invoices
 * - Cancel subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/infra/stripe/server';
import { getAdminAuth, getAdminDb } from '@/infra/firebase/admin';

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

    // Get user's Stripe customer ID from Firestore
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const customerId = userData?.subscription?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { error: 'No subscription found. Please subscribe first.' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Get the origin for redirect URL
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating portal session:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
