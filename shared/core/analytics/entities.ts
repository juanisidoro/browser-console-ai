/**
 * Analytics Domain Entities
 *
 * Defines the structure for tracking events and metrics.
 */

// Event types that can be tracked
export type AnalyticsEventType =
  // Acquisition
  | 'extension_installed'
  | 'extension_updated'
  | 'website_visit'
  // Activation
  | 'first_recording'
  | 'trial_activated'
  | 'trial_extended'
  | 'trial_extension_email_sent'
  | 'user_registered'
  // Engagement
  | 'recording_started'
  | 'recording_completed'
  | 'sidepanel_opened'
  | 'mcp_connected'
  | 'copy_recording'
  | 'export_recording'
  // Revenue
  | 'upgrade_clicked'
  | 'extend_trial_clicked'
  | 'extend_trial_email_sent'
  | 'checkout_started'
  | 'subscription_created'
  | 'subscription_cancelled'
  // Auth events
  | 'auth_anonymous_signin'
  | 'auth_google_signin'
  | 'auth_google_linked'
  | 'auth_google_signin_existing'
  | 'auth_email_link_sent'
  | 'auth_email_link_completed'
  | 'auth_signout'
  // Other
  | 'license_verified'
  | 'error_occurred'
  | 'analytics_consent_changed';

// Event payload structure
export interface AnalyticsEvent {
  event: AnalyticsEventType;
  installationId: string;
  userId?: string;
  timestamp: number;
  data?: Record<string, unknown>;
  metadata: EventMetadata;
}

// Device/browser metadata
export interface EventMetadata {
  version?: string;        // Extension version
  browser?: string;        // Chrome, Firefox, etc.
  browserVersion?: string;
  os?: string;             // Windows, macOS, Linux
  osVersion?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  screenClass?: 'small' | 'medium' | 'large' | 'xlarge';
  timezone?: string;
  language?: string;
  country?: string;        // Detected from IP
  ip?: string;             // For rate limiting, not stored
}

// Daily aggregated metrics
export interface DailyMetrics {
  date: string;  // YYYY-MM-DD

  // Acquisition
  installs: number;
  updates: number;
  installsByCountry: Record<string, number>;

  // Activation
  firstRecordings: number;
  trialsActivated: number;
  registrations: number;

  // Engagement
  activeUsers: number;
  activeInstallations: number;
  totalRecordings: number;
  totalLogs: number;
  mcpConnections: number;
  sidepanelOpens: number;
  copyActions: number;

  // Revenue
  upgradeClicks: number;
  checkoutsStarted: number;
  conversions: number;
  newSubscriptions: number;
  cancellations: number;
  revenue: number;

  // Errors
  errors: number;
}

// Overall totals
export interface TotalMetrics {
  // Counts
  totalInstalls: number;
  totalUsers: number;
  totalTrials: number;
  totalTrialsExpired: number;
  totalPaidUsers: number;
  totalCancelled: number;

  // Active
  activeTrials: number;
  activeSubscriptions: number;

  // Revenue
  mrr: number;  // Monthly Recurring Revenue
  totalRevenue: number;

  // Ratios (calculated)
  installToTrialRate: number;
  trialToConversionRate: number;

  // Timestamps
  updatedAt: number;
  lastEventAt: number;
}

// Admin user for access control
export interface AdminUser {
  email: string;
  role: 'super_admin' | 'admin' | 'viewer';
}

// Default admin emails (can be extended via Firestore)
export const DEFAULT_ADMIN_EMAILS = [
  'juan.isidoro.gc@gmail.com'  // Add your email
];

// Check if email is admin
export function isAdminEmail(email: string, additionalAdmins: string[] = []): boolean {
  const allAdmins = [...DEFAULT_ADMIN_EMAILS, ...additionalAdmins];
  return allAdmins.includes(email.toLowerCase());
}
