/**
 * Licensing Domain - Permissions and entitlements (WHAT you can do)
 *
 * This domain handles license tokens, plans, and feature gating.
 * Crypto operations (JWT signing/verification) belong in INFRA.
 */

export type Plan = 'free' | 'pro' | 'pro_early';

export interface LicensePayload {
  sub: string;         // userId (Firebase UID)
  plan: Plan;
  exp: number;         // Expiry timestamp (Unix ms)
  iat: number;         // Issued at timestamp (Unix ms)
  tokenId: string;     // UUID for invalidation
  email: string;       // For display in extension
}

export interface VerifyResult {
  valid: boolean;
  reason?: 'expired' | 'invalid_plan' | 'missing_fields' | 'not_yet_valid';
  payload?: LicensePayload;
}

export interface Entitlements {
  maxLogs: number;
  maxRecordings: number;
  formats: OutputFormat[];
  mcpDirect: boolean;
  export: boolean;
  advancedPatterns: boolean;
}

export type OutputFormat = 'plain' | 'toon' | 'json';

/**
 * Get entitlements for a given plan
 */
export function getEntitlements(plan: Plan): Entitlements {
  switch (plan) {
    case 'free':
      return {
        maxLogs: 100,
        maxRecordings: 5,
        formats: ['plain'],
        mcpDirect: false,
        export: false,
        advancedPatterns: false,
      };
    case 'pro':
    case 'pro_early':
      return {
        maxLogs: Infinity,
        maxRecordings: Infinity,
        formats: ['plain', 'toon', 'json'],
        mcpDirect: true,
        export: true,
        advancedPatterns: true,
      };
  }
}
