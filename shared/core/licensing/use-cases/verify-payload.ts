/**
 * Verify License Payload
 *
 * Validates a license payload's fields and expiry. Does NOT verify signature.
 * Crypto verification (jose) belongs in INFRA.
 */

import type { LicensePayload, VerifyResult, Plan } from '../entities';

const VALID_PLANS: Plan[] = ['free', 'pro', 'pro_early'];

/**
 * Verify a license payload (after INFRA has verified the JWT signature)
 *
 * @param payload - The decoded payload from JWT
 * @returns VerifyResult with validity status
 */
export function verifyLicensePayload(payload: Partial<LicensePayload>): VerifyResult {
  // Check required fields
  if (!payload.sub || !payload.plan || !payload.exp || !payload.iat) {
    return {
      valid: false,
      reason: 'missing_fields',
    };
  }

  // Validate plan
  if (!VALID_PLANS.includes(payload.plan)) {
    return {
      valid: false,
      reason: 'invalid_plan',
    };
  }

  const now = Date.now();

  // Check not yet valid (iat in future)
  if (payload.iat > now + 60000) { // 1 minute tolerance
    return {
      valid: false,
      reason: 'not_yet_valid',
    };
  }

  // Check expiry
  if (payload.exp < now) {
    return {
      valid: false,
      reason: 'expired',
    };
  }

  return {
    valid: true,
    payload: payload as LicensePayload,
  };
}

/**
 * Check if a token needs refresh (expires within threshold)
 *
 * @param payload - The license payload
 * @param thresholdMs - Time before expiry to trigger refresh (default 24h)
 * @returns true if token should be refreshed
 */
export function shouldRefreshToken(
  payload: LicensePayload,
  thresholdMs: number = 24 * 60 * 60 * 1000
): boolean {
  const now = Date.now();
  const timeUntilExpiry = payload.exp - now;
  return timeUntilExpiry > 0 && timeUntilExpiry < thresholdMs;
}
