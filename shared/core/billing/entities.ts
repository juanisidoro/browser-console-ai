/**
 * Billing Domain - Subscription and pricing entities
 */

export type SubscriptionStatus =
  | 'free'
  | 'pro'
  | 'pro_early'
  | 'canceled'
  | 'past_due';

export type BillingPeriod = 'monthly' | 'yearly';

export interface Subscription {
  status: SubscriptionStatus;
  plan?: BillingPeriod;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: number;  // Unix timestamp
  currentPeriodEnd?: number;    // Unix timestamp
  cancelAtPeriodEnd?: boolean;
}

export interface Price {
  id: string;
  name: string;
  amount: number;      // In cents
  currency: string;
  interval: BillingPeriod;
  metadata?: {
    isEarlyAccess?: boolean;
  };
}
