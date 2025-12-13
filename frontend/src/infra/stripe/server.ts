/**
 * Stripe Server SDK Configuration
 *
 * This file initializes Stripe for server-side use (API routes).
 * IMPORTANT: Never import this file in client components!
 */

import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    console.log('[Stripe] Initializing with key:', secretKey.substring(0, 12) + '...');

    stripe = new Stripe(secretKey, {
      typescript: true,
    });
  }

  return stripe;
}

/**
 * Stripe Price IDs - Configure these in your Stripe Dashboard
 *
 * Create products in Stripe Dashboard:
 * 1. "Pro Monthly" - $12/month (or $9/month for early access)
 * 2. "Pro Yearly" - $99/year (optional)
 */
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
  PRO_MONTHLY_EARLY: process.env.STRIPE_PRICE_PRO_EARLY || '',
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY || '',
} as const;

/**
 * Get the appropriate price ID based on the plan
 */
export function getPriceId(plan: 'pro' | 'pro_early' | 'pro_yearly'): string {
  switch (plan) {
    case 'pro':
      return STRIPE_PRICES.PRO_MONTHLY;
    case 'pro_early':
      return STRIPE_PRICES.PRO_MONTHLY_EARLY || STRIPE_PRICES.PRO_MONTHLY;
    case 'pro_yearly':
      return STRIPE_PRICES.PRO_YEARLY;
    default:
      throw new Error(`Unknown plan: ${plan}`);
  }
}
