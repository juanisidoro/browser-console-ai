/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events to sync subscription status with Firestore.
 *
 * Events handled:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.updated: Subscription changed (upgrade/downgrade/renewal)
 * - customer.subscription.deleted: Subscription canceled
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/infra/stripe/server';
import { getAdminDb, getAdminAuth } from '@/infra/firebase/admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { signLicenseToken } from '@/infra/licensing/jwt-service';
import type Stripe from 'stripe';

// Helper to track analytics events from webhook
async function trackWebhookEvent(
  db: FirebaseFirestore.Firestore,
  eventName: string,
  userId: string,
  data?: Record<string, unknown>
) {
  try {
    const eventId = `${eventName}-${userId}-${Date.now()}`;
    await db.collection('analytics_events').doc(eventId).set({
      event: eventName,
      userId,
      installationId: null, // Server-side event, no installationId
      timestamp: Date.now(),
      data: data || {},
      metadata: { source: 'stripe_webhook' },
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`[Analytics] Tracked ${eventName} for user ${userId}`);
  } catch (error) {
    console.error(`[Analytics] Failed to track ${eventName}:`, error);
  }
}

// Disable body parsing - we need the raw body for webhook signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const db = getAdminDb();

  // Get the webhook secret
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // Get the signature from headers
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  // Get raw body
  const body = await request.text();

  let event: Stripe.Event;

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log(`Processing Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(db, stripe, session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(db, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(db, subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(db, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout - activate subscription
 */
async function handleCheckoutCompleted(
  db: FirebaseFirestore.Firestore,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  console.log('[Webhook] handleCheckoutCompleted started');
  console.log('[Webhook] Session metadata:', session.metadata);

  const firebaseUid = session.metadata?.firebaseUid;
  if (!firebaseUid) {
    console.error('[Webhook] No firebaseUid in checkout session metadata');
    throw new Error('No firebaseUid in checkout session metadata');
  }

  // Get subscription details
  const subscriptionId = session.subscription as string;
  console.log('[Webhook] Retrieving subscription:', subscriptionId);
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Cancel any previous subscriptions for this user (prevent duplicates)
  const userDoc = await db.collection('users').doc(firebaseUid).get();
  const userData = userDoc.data();
  const previousSubId = userData?.subscription?.stripeSubscriptionId;

  if (previousSubId && previousSubId !== subscriptionId) {
    console.log('[Webhook] Canceling previous subscription:', previousSubId);
    try {
      await stripe.subscriptions.cancel(previousSubId);
      console.log('[Webhook] Previous subscription canceled successfully');
    } catch (err) {
      // Subscription might already be canceled or not exist
      console.log('[Webhook] Could not cancel previous subscription (may already be canceled):', err);
    }
  }

  // Determine plan type based on price
  const priceId = subscription.items.data[0]?.price.id;
  const plan = determinePlan(priceId);
  console.log('[Webhook] Plan determined:', plan, 'from priceId:', priceId);

  // Update Firestore using set with merge (works even if doc doesn't exist)
  const userRef = db.collection('users').doc(firebaseUid);
  console.log('[Webhook] Updating Firestore for user:', firebaseUid);

  // Convert Unix timestamp to Firestore Timestamp
  const periodEnd = subscription.current_period_end
    ? Timestamp.fromMillis(subscription.current_period_end * 1000)
    : null;

  // Get user email for token generation
  let userEmail = session.customer_email || session.customer_details?.email || '';
  if (!userEmail) {
    try {
      const adminAuth = getAdminAuth();
      const userRecord = await adminAuth.getUser(firebaseUid);
      userEmail = userRecord.email || '';
    } catch (e) {
      console.log('[Webhook] Could not get user email from Auth:', e);
    }
  }

  // Generate license token for auto-sync to extension
  let licenseToken: string | null = null;
  if (userEmail) {
    try {
      licenseToken = await signLicenseToken(firebaseUid, userEmail, plan);
      console.log('[Webhook] Generated license token for user:', firebaseUid);
    } catch (e) {
      console.error('[Webhook] Failed to generate license token:', e);
    }
  }

  await userRef.set({
    subscription: {
      status: plan,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: session.customer as string,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      licenseToken: licenseToken, // Store token for auto-sync
      tokenGeneratedAt: licenseToken ? FieldValue.serverTimestamp() : null,
    }
  }, { merge: true });

  console.log(`[Webhook] User ${firebaseUid} upgraded to ${plan}`);

  // Track subscription_created event
  await trackWebhookEvent(db, 'subscription_created', firebaseUid, {
    plan,
    priceId: subscription.items.data[0]?.price.id,
  });
}

/**
 * Handle subscription updates (renewals, plan changes)
 */
async function handleSubscriptionUpdated(
  db: FirebaseFirestore.Firestore,
  subscription: Stripe.Subscription
) {
  const firebaseUid = subscription.metadata?.firebaseUid;
  if (!firebaseUid) {
    // Try to find user by customer ID
    const customerId = subscription.customer as string;
    const usersSnapshot = await db
      .collection('users')
      .where('subscription.stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error('No user found for subscription:', subscription.id);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    await updateUserSubscription(db, userDoc.id, subscription);
  } else {
    await updateUserSubscription(db, firebaseUid, subscription);
  }
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(
  db: FirebaseFirestore.Firestore,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;

  // Find user by customer ID
  const usersSnapshot = await db
    .collection('users')
    .where('subscription.stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.error('No user found for canceled subscription:', subscription.id);
    return;
  }

  const userDoc = usersSnapshot.docs[0];

  // Downgrade to free
  await db.collection('users').doc(userDoc.id).update({
    'subscription.status': 'free',
    'subscription.stripeSubscriptionId': null,
    'subscription.currentPeriodEnd': null,
    'subscription.cancelAtPeriodEnd': false,
  });

  console.log(`User ${userDoc.id} downgraded to free`);

  // Track subscription_cancelled event
  await trackWebhookEvent(db, 'subscription_cancelled', userDoc.id, {
    reason: subscription.cancellation_details?.reason || 'unknown',
  });
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(
  db: FirebaseFirestore.Firestore,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;

  const usersSnapshot = await db
    .collection('users')
    .where('subscription.stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (!usersSnapshot.empty) {
    const userDoc = usersSnapshot.docs[0];
    console.log(`Payment failed for user ${userDoc.id}`);
    // Optionally: Send notification, update status, etc.
  }
}

/**
 * Update user subscription in Firestore
 */
async function updateUserSubscription(
  db: FirebaseFirestore.Firestore,
  uid: string,
  subscription: Stripe.Subscription
) {
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price.id;
  const plan = status === 'active' ? determinePlan(priceId) : 'free';

  const periodEnd = subscription.current_period_end
    ? Timestamp.fromMillis(subscription.current_period_end * 1000)
    : null;

  await db.collection('users').doc(uid).set({
    subscription: {
      status: plan,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    }
  }, { merge: true });

  console.log(`Updated subscription for user ${uid}: ${plan}`);
}

/**
 * Determine plan type from Stripe price ID
 */
function determinePlan(priceId: string): 'pro' | 'pro_early' | 'free' {
  const earlyPriceId = process.env.STRIPE_PRICE_PRO_EARLY;
  const proPriceId = process.env.STRIPE_PRICE_PRO_MONTHLY;

  if (priceId === earlyPriceId) {
    return 'pro_early';
  }
  if (priceId === proPriceId) {
    return 'pro';
  }

  // Default to pro for any paid subscription
  return 'pro';
}
