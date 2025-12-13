/**
 * Licensing Domain - Permissions and entitlements (WHAT you can do)
 *
 * This domain handles license tokens, plans, and feature gating.
 * Crypto operations (JWT signing/verification) belong in INFRA.
 */

export type Plan = 'free' | 'trial' | 'pro' | 'pro_early';

export interface LicensePayload {
  sub: string;         // userId (Firebase UID) or installationId for trial
  plan: Plan;
  exp: number;         // Expiry timestamp (Unix ms)
  iat: number;         // Issued at timestamp (Unix ms)
  tokenId: string;     // UUID for invalidation
  email?: string;      // For display in extension (optional for trial)
}

/**
 * Device fingerprint for trial licenses
 */
export interface DeviceFingerprint {
  installationId: string;  // UUID from extension
  browser: string;         // Chrome, Firefox, etc.
  browserVersion: string;
  os: string;              // Windows, macOS, Linux
  osVersion: string;
  timezone: string;
  language: string;
  screenClass: string;     // small, medium, large, xlarge
}

/**
 * Trial license record stored in Firestore
 */
export interface TrialLicense {
  installationId: string;
  deviceFingerprint: DeviceFingerprint;
  tokenId: string;
  createdAt: number;
  expiresAt: number;
  ip?: string;
  country?: string;
}

/**
 * Device registration for paid plans
 */
export interface DeviceRegistration {
  installationId: string;
  fingerprint: DeviceFingerprint;
  userId: string;
  activatedAt: number;
  lastSeenAt: number;
}

/**
 * Plan configuration with limits
 */
export interface PlanConfig {
  duration: number;      // Duration in days
  maxDevices: number;    // Max devices per license
  price?: number;        // Monthly price in USD (optional for free/trial)
}

export const PLAN_CONFIGS: Record<Plan, PlanConfig> = {
  free: {
    duration: Infinity,
    maxDevices: Infinity,
  },
  trial: {
    duration: 3,         // 3 days
    maxDevices: 1,
  },
  pro_early: {
    duration: 30,        // 30 days
    maxDevices: 3,
    price: 9,
  },
  pro: {
    duration: 30,        // 30 days
    maxDevices: 5,
    price: 12,
  },
};

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
    case 'trial':
      // Trial has same entitlements as PRO but limited duration
      return {
        maxLogs: Infinity,
        maxRecordings: Infinity,
        formats: ['plain', 'toon', 'json'],
        mcpDirect: true,
        export: true,
        advancedPatterns: true,
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
