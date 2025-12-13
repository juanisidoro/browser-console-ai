/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for subscription purchase.
 * Requires authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe, getPriceId } from '@/infra/stripe/server';
import { getAdminAuth, getAdminDb } from '@/infra/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('[Checkout] Starting checkout session creation...');

    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[Checkout] No auth header found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authHeader.slice(7);
    console.log('[Checkout] Verifying Firebase token...');
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    console.log('[Checkout] User verified:', { uid, email });

    if (!email) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const plan = body.plan || 'pro_early'; // Default to early access pricing
    const locale = body.locale || 'en'; // Get locale from request
    console.log('[Checkout] Plan:', plan, 'Locale:', locale);

    // Get price ID
    const priceId = getPriceId(plan);
    console.log('[Checkout] Price ID:', priceId || 'NOT FOUND');
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan or price not configured. Check STRIPE_PRICE_PRO_EARLY env var.' },
        { status: 400 }
      );
    }

    console.log('[Checkout] Initializing Stripe...');
    const stripe = getStripe();
    const db = getAdminDb();

    // Check if user already has a Stripe customer ID
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    let customerId = userData?.subscription?.stripeCustomerId;

    // Check if user already has an active subscription
    const currentPlan = userData?.subscription?.status;
    if (currentPlan && currentPlan !== 'free') {
      console.log('[Checkout] User already has active subscription:', currentPlan);
      return NextResponse.json(
        { error: 'You already have an active subscription. Manage it from the dashboard.' },
        { status: 400 }
      );
    }

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          firebaseUid: uid,
        },
      });
      customerId = customer.id;

      // Save customer ID to Firestore
      await db.collection('users').doc(uid).update({
        'subscription.stripeCustomerId': customerId,
      });
    }

    // Get the origin for redirect URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    console.log('[Checkout] Creating session with origin:', origin);

    // Create checkout session
    console.log('[Checkout] Creating Stripe checkout session...');
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/${locale}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/pricing?checkout=canceled`,
      subscription_data: {
        metadata: {
          firebaseUid: uid,
        },
      },
      metadata: {
        firebaseUid: uid,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
