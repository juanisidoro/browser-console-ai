/**
 * Check Limits Use Case
 *
 * Validates if user is within their plan limits.
 * Used by extension to enforce FREE limits.
 */

import type { Plan } from '../../licensing/entities';
import { getLimitsForPlan } from '../../billing/constants';

export type LimitType = 'log' | 'recording';

export interface LimitResult {
  allowed: boolean;
  reason?: 'log_limit' | 'recording_limit';
  current: number;
  limit: number;
  remaining: number;
}

/**
 * Check if adding a log is within limits
 *
 * @param plan - User's current plan
 * @param currentLogCount - Number of logs in current recording
 * @returns LimitResult with status and details
 */
export function checkLogLimit(plan: Plan, currentLogCount: number): LimitResult {
  const limits = getLimitsForPlan(plan);
  const remaining = Math.max(0, limits.maxLogs - currentLogCount);

  if (currentLogCount >= limits.maxLogs) {
    return {
      allowed: false,
      reason: 'log_limit',
      current: currentLogCount,
      limit: limits.maxLogs,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    current: currentLogCount,
    limit: limits.maxLogs,
    remaining,
  };
}

/**
 * Check if creating a recording is within limits
 *
 * @param plan - User's current plan
 * @param currentRecordingCount - Number of recordings in session
 * @returns LimitResult with status and details
 */
export function checkRecordingLimit(plan: Plan, currentRecordingCount: number): LimitResult {
  const limits = getLimitsForPlan(plan);
  const remaining = Math.max(0, limits.maxRecordings - currentRecordingCount);

  if (currentRecordingCount >= limits.maxRecordings) {
    return {
      allowed: false,
      reason: 'recording_limit',
      current: currentRecordingCount,
      limit: limits.maxRecordings,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    current: currentRecordingCount,
    limit: limits.maxRecordings,
    remaining,
  };
}

/**
 * Combined check for both limits
 *
 * @param plan - User's current plan
 * @param logCount - Number of logs in current recording
 * @param recordingCount - Number of recordings in session
 * @returns Object with both limit checks
 */
export function checkLimits(
  plan: Plan,
  logCount: number,
  recordingCount: number
): { logs: LimitResult; recordings: LimitResult } {
  return {
    logs: checkLogLimit(plan, logCount),
    recordings: checkRecordingLimit(plan, recordingCount),
  };
}
