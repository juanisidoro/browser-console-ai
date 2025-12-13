/**
 * Activate Trial Use Case
 *
 * Creates a trial license for a device fingerprint.
 * No registration required - uses device fingerprint to prevent abuse.
 */

import type { DeviceFingerprint, TrialLicense } from '../entities';
import { PLAN_CONFIGS } from '../entities';

export interface ActivateTrialInput {
  fingerprint: DeviceFingerprint;
  ip?: string;
  country?: string;
}

export interface ActivateTrialResult {
  success: boolean;
  error?: 'already_used' | 'invalid_fingerprint' | 'rate_limited';
  trial?: TrialLicense;
}

/**
 * Validate device fingerprint
 */
export function validateFingerprint(fingerprint: DeviceFingerprint): boolean {
  if (!fingerprint.installationId || fingerprint.installationId.length < 10) {
    return false;
  }
  if (!fingerprint.browser || !fingerprint.os) {
    return false;
  }
  return true;
}

/**
 * Generate a unique fingerprint hash for comparison
 * Uses installationId + browser + os + timezone as primary identifiers
 */
export function generateFingerprintHash(fingerprint: DeviceFingerprint): string {
  const parts = [
    fingerprint.installationId,
    fingerprint.browser,
    fingerprint.os,
    fingerprint.timezone,
  ];
  return parts.join('::').toLowerCase();
}

/**
 * Create trial license record
 */
export function createTrialLicense(
  input: ActivateTrialInput,
  tokenId: string
): TrialLicense {
  const now = Date.now();
  const config = PLAN_CONFIGS.trial;
  const expiresAt = now + config.duration * 24 * 60 * 60 * 1000; // days to ms

  return {
    installationId: input.fingerprint.installationId,
    deviceFingerprint: input.fingerprint,
    tokenId,
    createdAt: now,
    expiresAt,
    ip: input.ip,
    country: input.country,
  };
}

/**
 * Check if trial is still valid
 */
export function isTrialValid(trial: TrialLicense): boolean {
  return trial.expiresAt > Date.now();
}

/**
 * Get remaining trial days
 */
export function getTrialDaysRemaining(trial: TrialLicense): number {
  const remaining = trial.expiresAt - Date.now();
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / (24 * 60 * 60 * 1000));
}
