/**
 * Process Analytics Event
 *
 * Validates and prepares an analytics event for storage.
 */

import type { AnalyticsEvent, AnalyticsEventType, EventMetadata } from '../entities';

const VALID_EVENTS: AnalyticsEventType[] = [
  'extension_installed',
  'extension_updated',
  'website_visit',
  'first_recording',
  'trial_activated',
  'trial_extended',
  'user_registered',
  'recording_started',
  'recording_completed',
  'sidepanel_opened',
  'mcp_connected',
  'copy_recording',
  'export_recording',
  'upgrade_clicked',
  'extend_trial_clicked',
  'extend_trial_email_sent',
  'trial_extension_email_sent',
  'checkout_started',
  'subscription_created',
  'subscription_cancelled',
  'license_verified',
  'error_occurred',
  'analytics_consent_changed',
];

export interface ProcessEventInput {
  event: string;
  installationId?: string;
  userId?: string;
  timestamp?: number;
  data?: Record<string, unknown>;
  metadata?: Partial<EventMetadata>;
}

export interface ProcessEventResult {
  valid: boolean;
  event?: AnalyticsEvent;
  error?: string;
}

/**
 * Validate and process an incoming analytics event
 */
export function processAnalyticsEvent(input: ProcessEventInput): ProcessEventResult {
  // Validate event type
  if (!input.event || !VALID_EVENTS.includes(input.event as AnalyticsEventType)) {
    return {
      valid: false,
      error: `Invalid event type: ${input.event}`,
    };
  }

  // Require installationId for extension events
  const extensionEvents: AnalyticsEventType[] = [
    'extension_installed',
    'extension_updated',
    'recording_started',
    'recording_completed',
    'sidepanel_opened',
    'mcp_connected',
    'copy_recording',
    'export_recording',
    'trial_activated',
    'first_recording',
    'license_verified',
  ];

  if (extensionEvents.includes(input.event as AnalyticsEventType) && !input.installationId) {
    return {
      valid: false,
      error: 'installationId is required for extension events',
    };
  }

  // Build the event
  const event: AnalyticsEvent = {
    event: input.event as AnalyticsEventType,
    installationId: input.installationId || 'web',
    userId: input.userId,
    timestamp: input.timestamp || Date.now(),
    data: sanitizeData(input.data),
    metadata: sanitizeMetadata(input.metadata || {}),
  };

  return {
    valid: true,
    event,
  };
}

/**
 * Sanitize event data - remove sensitive info
 */
function sanitizeData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!data) return undefined;

  const sanitized: Record<string, unknown> = {};
  const allowedKeys = [
    'logCount',
    'recordingDuration',
    'format',
    'plan',
    'provider',
    'reason',
    'amount',
    'errorCode',
    'errorMessage',
    'source',
  ];

  for (const key of allowedKeys) {
    if (key in data) {
      sanitized[key] = data[key];
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

/**
 * Sanitize metadata - keep only what we need
 */
function sanitizeMetadata(meta: Partial<EventMetadata>): EventMetadata {
  return {
    version: meta.version?.slice(0, 20),
    browser: meta.browser?.slice(0, 30),
    browserVersion: meta.browserVersion?.slice(0, 20),
    os: meta.os?.slice(0, 30),
    osVersion: meta.osVersion?.slice(0, 20),
    deviceType: meta.deviceType,
    screenClass: meta.screenClass,
    timezone: meta.timezone?.slice(0, 50),
    language: meta.language?.slice(0, 10),
    country: meta.country?.slice(0, 2)?.toUpperCase(),
    // IP is processed but not stored in final event
  };
}

/**
 * Get the date string for an event (for daily aggregation)
 */
export function getEventDateString(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}
