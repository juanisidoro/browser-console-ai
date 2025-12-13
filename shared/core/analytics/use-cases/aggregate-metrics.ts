/**
 * Aggregate Metrics
 *
 * Functions to update daily and total metrics based on events.
 */

import type { AnalyticsEvent, DailyMetrics, TotalMetrics } from '../entities';

/**
 * Create empty daily metrics for a new day
 */
export function createEmptyDailyMetrics(date: string): DailyMetrics {
  return {
    date,
    // Acquisition
    installs: 0,
    updates: 0,
    installsByCountry: {},
    // Activation
    firstRecordings: 0,
    trialsActivated: 0,
    registrations: 0,
    // Engagement
    activeUsers: 0,
    activeInstallations: 0,
    totalRecordings: 0,
    totalLogs: 0,
    mcpConnections: 0,
    sidepanelOpens: 0,
    copyActions: 0,
    // Revenue
    upgradeClicks: 0,
    checkoutsStarted: 0,
    conversions: 0,
    newSubscriptions: 0,
    cancellations: 0,
    revenue: 0,
    // Errors
    errors: 0,
  };
}

/**
 * Create empty total metrics
 */
export function createEmptyTotalMetrics(): TotalMetrics {
  return {
    totalInstalls: 0,
    totalUsers: 0,
    totalTrials: 0,
    totalTrialsExpired: 0,
    totalPaidUsers: 0,
    totalCancelled: 0,
    activeTrials: 0,
    activeSubscriptions: 0,
    mrr: 0,
    totalRevenue: 0,
    installToTrialRate: 0,
    trialToConversionRate: 0,
    updatedAt: Date.now(),
    lastEventAt: Date.now(),
  };
}

/**
 * Get the increments for daily metrics based on an event
 */
export function getDailyIncrements(event: AnalyticsEvent): Partial<DailyMetrics> {
  const increments: Partial<DailyMetrics> = {};

  switch (event.event) {
    case 'extension_installed':
      increments.installs = 1;
      if (event.metadata.country) {
        increments.installsByCountry = { [event.metadata.country]: 1 };
      }
      break;

    case 'extension_updated':
      increments.updates = 1;
      break;

    case 'first_recording':
      increments.firstRecordings = 1;
      break;

    case 'trial_activated':
      increments.trialsActivated = 1;
      break;

    case 'user_registered':
      increments.registrations = 1;
      break;

    case 'recording_started':
      increments.totalRecordings = 1;
      break;

    case 'recording_completed':
      const logCount = (event.data?.logCount as number) || 0;
      increments.totalLogs = logCount;
      break;

    case 'sidepanel_opened':
      increments.sidepanelOpens = 1;
      break;

    case 'mcp_connected':
      increments.mcpConnections = 1;
      break;

    case 'copy_recording':
    case 'export_recording':
      increments.copyActions = 1;
      break;

    case 'upgrade_clicked':
      increments.upgradeClicks = 1;
      break;

    case 'checkout_started':
      increments.checkoutsStarted = 1;
      break;

    case 'subscription_created':
      increments.newSubscriptions = 1;
      increments.conversions = 1;
      const amount = (event.data?.amount as number) || 0;
      increments.revenue = amount;
      break;

    case 'subscription_cancelled':
      increments.cancellations = 1;
      break;

    case 'error_occurred':
      increments.errors = 1;
      break;
  }

  return increments;
}

/**
 * Get the increments for total metrics based on an event
 */
export function getTotalIncrements(event: AnalyticsEvent): Partial<TotalMetrics> {
  const increments: Partial<TotalMetrics> = {
    lastEventAt: event.timestamp,
  };

  switch (event.event) {
    case 'extension_installed':
      increments.totalInstalls = 1;
      break;

    case 'user_registered':
      increments.totalUsers = 1;
      break;

    case 'trial_activated':
      increments.totalTrials = 1;
      increments.activeTrials = 1;
      break;

    case 'subscription_created':
      increments.totalPaidUsers = 1;
      increments.activeSubscriptions = 1;
      const amount = (event.data?.amount as number) || 9; // Default PRO_EARLY price
      increments.mrr = amount;
      increments.totalRevenue = amount;
      // If converting from trial, decrement active trials
      if (event.data?.fromTrial) {
        increments.activeTrials = -1;
      }
      break;

    case 'subscription_cancelled':
      increments.totalCancelled = 1;
      increments.activeSubscriptions = -1;
      const cancelledAmount = (event.data?.amount as number) || 9;
      increments.mrr = -cancelledAmount;
      break;
  }

  return increments;
}

/**
 * Calculate conversion rates
 */
export function calculateRates(totals: TotalMetrics): Pick<TotalMetrics, 'installToTrialRate' | 'trialToConversionRate'> {
  return {
    installToTrialRate: totals.totalInstalls > 0
      ? Math.round((totals.totalTrials / totals.totalInstalls) * 100) / 100
      : 0,
    trialToConversionRate: totals.totalTrials > 0
      ? Math.round((totals.totalPaidUsers / totals.totalTrials) * 100) / 100
      : 0,
  };
}
