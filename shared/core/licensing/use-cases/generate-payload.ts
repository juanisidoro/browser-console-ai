/**
 * Generate License Payload
 *
 * Creates a license payload object. Does NOT sign it - that's INFRA's job.
 * This is pure business logic: what data goes into a license.
 */

import type { Plan, LicensePayload } from '../entities';

interface GeneratePayloadInput {
  userId: string;
  email: string;
  plan: Plan;
  tokenId?: string;
  expiresInMs?: number;
}

const DEFAULT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generate a license payload for JWT signing
 *
 * @param input - User info and plan
 * @returns LicensePayload ready for signing by INFRA
 */
export function generateLicensePayload(input: GeneratePayloadInput): LicensePayload {
  const now = Date.now();
  const expiresInMs = input.expiresInMs ?? DEFAULT_EXPIRY_MS;

  return {
    sub: input.userId,
    email: input.email,
    plan: input.plan,
    iat: now,
    exp: now + expiresInMs,
    tokenId: input.tokenId ?? generateTokenId(),
  };
}

/**
 * Generate a simple token ID (UUID-like)
 * In production, INFRA would use crypto.randomUUID()
 */
function generateTokenId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}
