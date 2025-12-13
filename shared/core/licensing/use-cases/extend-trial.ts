/**
 * Extend Trial Use Case
 *
 * Extends a trial license by 3 more days when user registers.
 * Total trial = 6 days (3 anonymous + 3 registered)
 */

import type { TrialLicense } from '../entities';
import { TRIAL_EXTENSION_DAYS } from '../entities';

export interface ExtendTrialInput {
  installationId: string;
  userId: string;
  email: string;
}

export interface ExtendTrialResult {
  success: boolean;
  error?: 'no_trial' | 'already_extended' | 'trial_expired' | 'invalid_user';
  message?: string;
  newExpiresAt?: number;
  daysRemaining?: number;
}

/**
 * Calculate new expiration date when extending trial
 */
export function calculateExtendedExpiry(currentExpiresAt: number): number {
  const extensionMs = TRIAL_EXTENSION_DAYS * 24 * 60 * 60 * 1000;
  return currentExpiresAt + extensionMs;
}

/**
 * Validate if trial can be extended
 */
export function canExtendTrial(trial: TrialLicense | null): ExtendTrialResult {
  if (!trial) {
    return {
      success: false,
      error: 'no_trial',
      message: 'No active trial found for this installation.',
    };
  }

  if (trial.extended) {
    return {
      success: false,
      error: 'already_extended',
      message: 'Trial has already been extended. Upgrade to PRO to continue.',
    };
  }

  // Trial can be extended even if expired (grace period)
  // This allows users who forgot to register to still extend
  const now = Date.now();
  const gracePeriodMs = 7 * 24 * 60 * 60 * 1000; // 7 days grace

  if (trial.expiresAt + gracePeriodMs < now) {
    return {
      success: false,
      error: 'trial_expired',
      message: 'Trial expired too long ago. Please upgrade to PRO.',
    };
  }

  return { success: true };
}

/**
 * Get days remaining after extension
 */
export function getDaysRemainingAfterExtension(newExpiresAt: number): number {
  const remaining = newExpiresAt - Date.now();
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / (24 * 60 * 60 * 1000));
}
