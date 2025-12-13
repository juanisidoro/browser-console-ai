/**
 * Browser Console AI - Shared Core
 *
 * Business logic shared across all runtimes (Extension, MCP Server, Next.js).
 * This module contains NO external dependencies - only pure TypeScript.
 */

// Auth domain (identity)
export type { User, Session } from './auth/entities';

// Licensing domain (permissions)
export type {
  Plan,
  LicensePayload,
  VerifyResult,
  Entitlements,
  OutputFormat,
} from './licensing/entities';
export { getEntitlements } from './licensing/entities';
export * from './licensing/errors';
export { generateLicensePayload } from './licensing/use-cases/generate-payload';
export { verifyLicensePayload, shouldRefreshToken } from './licensing/use-cases/verify-payload';

// Billing domain (subscriptions, limits)
export type {
  SubscriptionStatus,
  BillingPeriod,
  Subscription,
  Price,
} from './billing/entities';
export {
  FREE_LIMITS,
  PRO_LIMITS,
  PRICING,
  OFFLINE_GRACE_PERIOD_MS,
  TOKEN_EXPIRY_MS,
  TOKEN_REFRESH_THRESHOLD_MS,
  getLimitsForPlan,
} from './billing/constants';
export type { PlanLimits } from './billing/constants';

// Logs domain
export type {
  LogType,
  ConsoleLog,
  Recording,
  LogsStats,
} from './logs/entities';
// Note: OutputFormat is exported from licensing/entities
export {
  checkLogLimit,
  checkRecordingLimit,
  checkLimits,
} from './logs/use-cases/check-limits';
export type { LimitResult, LimitType } from './logs/use-cases/check-limits';
export {
  formatLogs,
  formatLogsPlain,
  formatLogsJson,
} from './logs/use-cases/format-logs';
export type { FormatOptions } from './logs/use-cases/format-logs';
