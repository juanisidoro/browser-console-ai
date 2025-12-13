/**
 * JWT Service for License Tokens
 *
 * This service handles signing and verifying JWT tokens for the extension.
 * Uses the jose library for JWT operations.
 *
 * Token structure (payload):
 * - sub: Firebase user ID
 * - email: User email
 * - plan: 'free' | 'pro' | 'pro_early'
 * - tokenId: Unique token identifier (for revocation)
 * - iat: Issued at timestamp
 * - exp: Expiration timestamp (7 days from issue)
 */

import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { generateLicensePayload, verifyLicensePayload } from '../../../../shared/core';
import type { Plan, LicensePayload } from '../../../../shared/core';

// Secret key for signing JWTs - must be at least 32 characters
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  return new TextEncoder().encode(secret);
}

/**
 * Generate a signed JWT license token
 */
export async function signLicenseToken(
  userId: string,
  email: string,
  plan: Plan
): Promise<string> {
  // Use shared core to generate payload structure
  const payload = generateLicensePayload({
    userId,
    email,
    plan,
  });

  const secret = getJwtSecret();

  // Sign the token
  const token = await new SignJWT({
    sub: payload.sub,
    email: payload.email,
    plan: payload.plan,
    tokenId: payload.tokenId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Math.floor(payload.iat / 1000))
    .setExpirationTime(Math.floor(payload.exp / 1000))
    .sign(secret);

  return token;
}

/**
 * Generate a signed JWT trial token (no email required)
 */
export async function signTrialToken(
  installationId: string,
  tokenId: string,
  expiresAt: number
): Promise<string> {
  const secret = getJwtSecret();
  const now = Date.now();

  const token = await new SignJWT({
    sub: installationId, // Use installationId as subject
    plan: 'trial' as Plan,
    tokenId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Math.floor(now / 1000))
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .sign(secret);

  return token;
}

/**
 * Verify a JWT license token
 */
export async function verifyLicenseToken(token: string): Promise<{
  valid: boolean;
  payload?: LicensePayload;
  reason?: string;
}> {
  try {
    const secret = getJwtSecret();

    const { payload } = await jwtVerify(token, secret);

    // Convert JWT payload to LicensePayload format
    const licensePayload: LicensePayload = {
      sub: payload.sub as string,
      email: payload.email as string,
      plan: payload.plan as Plan,
      tokenId: payload.tokenId as string,
      iat: (payload.iat || 0) * 1000, // Convert to ms
      exp: (payload.exp || 0) * 1000, // Convert to ms
    };

    // Use shared core to verify payload fields
    const coreVerification = verifyLicensePayload(licensePayload);

    if (!coreVerification.valid) {
      return {
        valid: false,
        reason: coreVerification.reason,
      };
    }

    return {
      valid: true,
      payload: licensePayload,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return { valid: false, reason: 'expired' };
      }
      if (error.message.includes('signature')) {
        return { valid: false, reason: 'invalid_signature' };
      }
    }

    return { valid: false, reason: 'invalid_token' };
  }
}

/**
 * Decode a JWT without verifying (for display purposes)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    );

    return payload;
  } catch {
    return null;
  }
}
