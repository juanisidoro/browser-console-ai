// Background Service Worker
// Recording mode for console logs

// Import license manager
importScripts('../utils/license.js');

const SERVER_URL = 'http://localhost:9876';

// License state (cached)
let currentLicense = null;

// Recording state
let isRecording = false;
let recordingLogs = [];
let recordingsHistory = [];
let captureEnabled = true; // Global capture toggle
let logLimitNotified = false; // Track if we've shown the log limit warning

let settings = {
  compactMode: false,
  includePatterns: '',
  excludePatterns: '',
  filterLog: true,
  filterInfo: true,
  filterWarn: true,
  filterError: true,
  filterDebug: true
};

// Generate short hash for recording ID
function generateRecordingId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let hash = '';
  for (let i = 0; i < 6; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return `REC-${hash}`;
}

// Load settings
async function loadSettings() {
  // Load capture enabled state (persistent)
  const captureResult = await chrome.storage.local.get('captureEnabled');
  captureEnabled = captureResult.captureEnabled !== false; // Default ON

  // Settings persist across sessions (local)
  const settingsResult = await chrome.storage.local.get('settings');
  if (settingsResult.settings) settings = { ...settings, ...settingsResult.settings };

  // Recordings history is session-only (lost on browser close)
  const historyResult = await chrome.storage.session.get('recordingsHistory');
  if (historyResult.recordingsHistory) recordingsHistory = historyResult.recordingsHistory;
}

// Save recordings history (session storage - cleared on browser close)
// Limited based on plan (FREE: 5, PRO: unlimited but capped at 50 for storage)
async function saveRecordingsHistory() {
  const license = await self.LicenseManager.getLicenseInfo();
  const maxRecordings = license.limits.maxRecordings === Infinity ? 50 : license.limits.maxRecordings;

  // Keep only the last N recordings based on plan
  if (recordingsHistory.length > maxRecordings) {
    recordingsHistory = recordingsHistory.slice(-maxRecordings);
  }
  await chrome.storage.session.set({ recordingsHistory });
}

// Refresh license info
async function refreshLicense() {
  currentLicense = await self.LicenseManager.getLicenseInfo();
  return currentLicense;
}

// Check if can create new recording
async function canCreateRecording() {
  const license = await refreshLicense();
  if (license.limits.maxRecordings === Infinity) return { allowed: true };

  return {
    allowed: recordingsHistory.length < license.limits.maxRecordings,
    current: recordingsHistory.length,
    max: license.limits.maxRecordings,
    plan: license.plan
  };
}

// Check if can add more logs to current recording (SYNC version for fast log capture)
function canAddLogSync() {
  // Use cached license, default to FREE limits if not cached
  const limits = currentLicense?.limits || { maxLogsPerRecording: 100 };
  if (limits.maxLogsPerRecording === Infinity) return { allowed: true };

  return {
    allowed: recordingLogs.length < limits.maxLogsPerRecording,
    current: recordingLogs.length,
    max: limits.maxLogsPerRecording
  };
}

// Check if log passes filters
function passesFilters(log) {
  // Check log type filter first
  const typeFilters = {
    log: settings.filterLog !== false,
    info: settings.filterInfo !== false,
    warn: settings.filterWarn !== false,
    error: settings.filterError !== false,
    debug: settings.filterDebug !== false
  };

  // If this log type is not enabled, reject it
  if (!typeFilters[log.type]) {
    return false;
  }

  const text = log.args.join(' ').toLowerCase();

  // Check include patterns (if set, must match at least one)
  if (settings.includePatterns) {
    const includeList = settings.includePatterns.toLowerCase().split(',').map(p => p.trim()).filter(p => p);
    if (includeList.length > 0) {
      const matchesInclude = includeList.some(pattern => text.includes(pattern));
      if (!matchesInclude) return false;
    }
  }

  // Check exclude patterns
  if (settings.excludePatterns) {
    const excludeList = settings.excludePatterns.toLowerCase().split(',').map(p => p.trim()).filter(p => p);
    if (excludeList.some(pattern => text.includes(pattern))) {
      return false;
    }
  }

  return true;
}

// Compact log args
function compactArgs(args) {
  if (!settings.compactMode) return args;

  return args.map(arg => {
    try {
      const parsed = JSON.parse(arg);
      return JSON.stringify(parsed);
    } catch {
      return arg.replace(/\s+/g, ' ').trim();
    }
  });
}

// Send logs to server (only for PRO users with MCP access)
async function sendLogsToServer(logs, recordingId) {
  if (logs.length === 0) return { success: false, reason: 'no_logs' };

  // Check if user has MCP access
  const license = await self.LicenseManager.getLicenseInfo();
  if (!license.limits.canUseMCP) {
    console.debug('MCP access not available on FREE plan');
    return { success: false, reason: 'mcp_not_available', plan: license.plan };
  }

  const processedLogs = logs.map(log => ({
    ...log,
    recordingId,
    args: compactArgs(log.args)
  }));

  try {
    const response = await fetch(`${SERVER_URL}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: processedLogs, recordingId })
    });

    return { success: response.ok };
  } catch (error) {
    console.debug('Could not send logs:', error.message);
    return { success: false, reason: 'connection_error' };
  }
}

// Check server health
async function checkServerHealth() {
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    const data = await response.json();
    return { connected: true, ...data };
  } catch {
    return { connected: false };
  }
}

// Clear all logs on server (called on browser startup)
async function clearServerLogs() {
  try {
    const response = await fetch(`${SERVER_URL}/logs/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true })
    });
    if (response.ok) {
      console.log('Server logs cleared on startup');
    }
  } catch (e) {
    console.debug('Could not clear server logs:', e.message);
  }
}

// Inject console capture into tab
async function injectIntoTab(tabId) {
  // Don't inject if capture is disabled
  if (!captureEnabled) {
    console.debug('Capture disabled, skipping injection');
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/injected.js'],
      world: 'MAIN'
    });
    console.debug('Injected into tab:', tabId);
  } catch (e) {
    console.debug('Could not inject:', e.message);
  }
}

// Notify sidepanel of recording update
function notifyRecordingUpdate() {
  chrome.runtime.sendMessage({
    action: 'RECORDING_UPDATE',
    logs: recordingLogs
  }).catch(() => {});
}

// Notify sidepanel that limit was reached
function notifyLimitReached(type, max) {
  chrome.runtime.sendMessage({
    action: 'LIMIT_REACHED',
    type: type,
    max: max
  }).catch(() => {});
}

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Content script ready - inject main world script (only if capture enabled)
  if (message.action === 'CONTENT_READY') {
    if (sender.tab?.id && captureEnabled) {
      injectIntoTab(sender.tab.id);
    }
    return;
  }

  // Log captured from page
  if (message.action === 'LOG_CAPTURED') {
    // Ignore if capture is disabled
    if (!captureEnabled) return;

    const log = {
      ...message.log,
      sessionId: sender.tab?.id ? `tab-${sender.tab.id}` : 'unknown',
      tabId: sender.tab?.id,
      timestamp: message.log.timestamp || Date.now()
    };

    // Only capture if recording
    if (isRecording) {
      if (passesFilters(log)) {
        // Check log limit based on plan (SYNC to handle rapid logs)
        const check = canAddLogSync();
        if (check.allowed) {
          recordingLogs.push(log);
          notifyRecordingUpdate();
        } else if (!logLimitNotified) {
          // Notify that limit reached (only once per recording)
          logLimitNotified = true;
          notifyLimitReached('logs', check.max);
        }
      }
    }
    return;
  }

  // Set capture enabled state
  if (message.action === 'SET_CAPTURE_ENABLED') {
    captureEnabled = message.enabled;
    chrome.storage.local.set({ captureEnabled: message.enabled });

    // If re-enabled, inject into all existing tabs
    if (captureEnabled) {
      injectIntoAllTabs();
    }

    sendResponse({ updated: true, captureEnabled });
    return;
  }

  // Get status
  if (message.action === 'GET_STATUS') {
    checkServerHealth().then(health => {
      sendResponse({
        ...health,
        isRecording,
        recordingLogs,
        captureEnabled
      });
    });
    return true;
  }

  // Start recording
  if (message.action === 'START_RECORDING') {
    canCreateRecording().then(check => {
      if (check.allowed) {
        isRecording = true;
        recordingLogs = [];
        logLimitNotified = false; // Reset limit notification flag
        refreshLicense(); // Refresh license at start of recording
        sendResponse({ started: true });
      } else {
        sendResponse({
          started: false,
          error: 'recording_limit',
          current: check.current,
          max: check.max,
          plan: check.plan
        });
      }
    });
    return true; // Async response
  }

  // Stop recording and send
  if (message.action === 'STOP_RECORDING') {
    isRecording = false;
    const hash = generateRecordingId();

    sendLogsToServer(recordingLogs, hash).then(result => {
      // Always save to history (local recordings work for all users)
      recordingsHistory.push({
        id: hash,
        count: recordingLogs.length,
        timestamp: Date.now(),
        sentToMcp: result.success
      });
      saveRecordingsHistory();

      sendResponse({
        hash,
        count: recordingLogs.length,
        success: result.success,
        mcpAvailable: result.reason !== 'mcp_not_available',
        reason: result.reason
      });
    });

    return true;
  }

  // Get recordings history (max 10, newest first)
  if (message.action === 'GET_RECORDINGS_HISTORY') {
    sendResponse({ recordings: [...recordingsHistory].reverse() });
    return;
  }

  // Stop only (don't send to server)
  if (message.action === 'STOP_ONLY') {
    isRecording = false;
    recordingLogs = [];
    sendResponse({ stopped: true });
    return;
  }

  // Delete recording from history
  if (message.action === 'DELETE_RECORDING') {
    const { recordingId } = message;
    recordingsHistory = recordingsHistory.filter(rec => rec.id !== recordingId);
    saveRecordingsHistory();
    sendResponse({ deleted: true });
    return;
  }

  // Settings updated
  if (message.action === 'SETTINGS_UPDATED') {
    settings = { ...settings, ...message.settings };
    sendResponse({ updated: true });
    return;
  }

  // Get license info
  if (message.action === 'GET_LICENSE') {
    self.LicenseManager.getLicenseInfo().then(license => {
      self.LicenseManager.getRemainingQuota(
        recordingLogs.length,
        recordingsHistory.length
      ).then(quota => {
        sendResponse({ license, quota });
      });
    });
    return true;
  }

  // Set license token
  if (message.action === 'SET_LICENSE_TOKEN') {
    self.LicenseManager.saveLicenseToken(message.token).then(result => {
      currentLicense = null; // Clear cache to force refresh
      sendResponse({ success: true, ...result });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  // Remove license token
  if (message.action === 'REMOVE_LICENSE_TOKEN') {
    self.LicenseManager.removeLicenseToken().then(() => {
      currentLicense = null;
      sendResponse({ success: true });
    });
    return true;
  }
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Re-inject into existing tabs when extension loads
async function injectIntoAllTabs() {
  // Don't inject if capture is disabled
  if (!captureEnabled) {
    console.debug('Capture disabled, skipping tab injection');
    return;
  }

  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        try {
          // First inject content script
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/console-capture.js']
          });
          // Then inject main world script
          await injectIntoTab(tab.id);
        } catch (e) {
          // Ignore errors for tabs we can't inject into
        }
      }
    }
  } catch (e) {
    console.debug('Error injecting into tabs:', e);
  }
}

// Initialize
async function initialize() {
  await loadSettings();

  // Check if this is a new browser session (session storage is empty on new session)
  const sessionCheck = await chrome.storage.session.get('sessionInitialized');
  if (!sessionCheck.sessionInitialized) {
    // New browser session - clear server logs
    await clearServerLogs();
    await chrome.storage.session.set({ sessionInitialized: true });
    console.log('Browser Console AI - New session, server cleared');
  }

  if (captureEnabled) {
    injectIntoAllTabs();
  }
  console.log('Browser Console AI - Capture:', captureEnabled ? 'ON' : 'OFF');
}

initialize();
