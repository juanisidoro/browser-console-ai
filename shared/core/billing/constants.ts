/**
 * Billing Domain - Constants
 *
 * Single source of truth for plan limits and pricing.
 */

import type { Plan } from '../licensing/entities';

export interface PlanLimits {
  maxLogs: number;
  maxRecordings: number;
}

/**
 * FREE plan limits
 * - 100 logs per recording
 * - 5 recordings (session only)
 */
export const FREE_LIMITS: PlanLimits = {
  maxLogs: 100,
  maxRecordings: 5,
};

/**
 * PRO plan limits (no limits)
 */
export const PRO_LIMITS: PlanLimits = {
  maxLogs: Infinity,
  maxRecordings: Infinity,
};

/**
 * Get limits for a given plan
 */
export function getLimitsForPlan(plan: Plan): PlanLimits {
  switch (plan) {
    case 'free':
      return FREE_LIMITS;
    case 'pro':
    case 'pro_early':
      return PRO_LIMITS;
  }
}

/**
 * Pricing configuration
 */
export const PRICING = {
  PRO_MONTHLY: {
    amount: 1200,      // $12.00
    currency: 'usd',
  },
  PRO_YEARLY: {
    amount: 9900,      // $99.00
    currency: 'usd',
  },
  EARLY_ACCESS_MONTHLY: {
    amount: 900,       // $9.00
    currency: 'usd',
  },
} as const;

/**
 * Grace period for offline validation (in ms)
 * User can use PRO features offline for this duration
 */
export const OFFLINE_GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

/**
 * Token expiry duration (in ms)
 */
export const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Token refresh threshold (in ms)
 * Refresh token when it expires within this duration
 */
export const TOKEN_REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
