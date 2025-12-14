// Side Panel Script - Recording Mode with Stats & Filters

const SERVER_URL = 'http://localhost:9876';

// Track analytics helper
function trackEvent(event, data = {}) {
  chrome.runtime.sendMessage({ action: 'TRACK_EVENT', event, data });
}

// DOM Elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const stateIdle = document.getElementById('stateIdle');
const stateRecording = document.getElementById('stateRecording');
const stateSent = document.getElementById('stateSent');
const btnStartRecord = document.getElementById('btnStartRecord');
const btnStopRecord = document.getElementById('btnStopRecord');
const btnStopOnly = document.getElementById('btnStopOnly');
const btnNewRecording = document.getElementById('btnNewRecording');
const btnCopy = document.getElementById('btnCopy');
const logsCount = document.getElementById('logsCount');
const recordingLogs = document.getElementById('recordingLogs');
const logsContainer = document.getElementById('logsContainer');
const showLogsToggle = document.getElementById('showLogsToggle');
const recordingLabel = document.getElementById('recordingLabel');
const hashValue = document.getElementById('hashValue');
const recordingsList = document.getElementById('recordingsList');
const container = document.querySelector('.container');
const disabledOverlay = document.getElementById('disabledOverlay');
const btnEnableCapture = document.getElementById('btnEnableCapture');

// Capture toggle elements
const captureEnabled = document.getElementById('captureEnabled');
const captureLabel = document.getElementById('captureLabel');

// Settings elements - Capture tab
const includePatterns = document.getElementById('includePatterns');
const excludePatterns = document.getElementById('excludePatterns');
const filterLog = document.getElementById('filterLog');
const filterInfo = document.getElementById('filterInfo');
const filterWarn = document.getElementById('filterWarn');
const filterError = document.getElementById('filterError');
const filterDebug = document.getElementById('filterDebug');

// Settings elements - MCP Output tab
const compactMode = document.getElementById('compactMode');
const compressObjects = document.getElementById('compressObjects');
const plainTextFormat = document.getElementById('plainTextFormat');
const showSourceInPlain = document.getElementById('showSourceInPlain');
const propId = document.getElementById('propId');
const propSessionId = document.getElementById('propSessionId');
const propRecordingId = document.getElementById('propRecordingId');
const propTimestamp = document.getElementById('propTimestamp');
const propUrl = document.getElementById('propUrl');
const outputPreview = document.getElementById('outputPreview');

// Settings tabs
const settingsTabs = document.querySelectorAll('.settings-tab');
const settingsPages = document.querySelectorAll('.settings-page');

// Stats elements
const statTotal = document.getElementById('statTotal');
const statLog = document.getElementById('statLog');
const statInfo = document.getElementById('statInfo');
const statWarn = document.getElementById('statWarn');
const statError = document.getElementById('statError');
const statDebug = document.getElementById('statDebug');

// Dialog elements
const dialogOverlay = document.getElementById('dialogOverlay');
const dialogMessage = document.getElementById('dialogMessage');
const dialogCancel = document.getElementById('dialogCancel');
const dialogConfirm = document.getElementById('dialogConfirm');

// License elements
const planBadge = document.getElementById('planBadge');
const limitBanner = document.getElementById('limitBanner');
const limitBannerText = document.getElementById('limitBannerText');
const licensePlanValue = document.getElementById('licensePlanValue');
const licenseEmailRow = document.getElementById('licenseEmailRow');
const licenseEmailValue = document.getElementById('licenseEmailValue');
const licenseExpiresRow = document.getElementById('licenseExpiresRow');
const licenseExpiresValue = document.getElementById('licenseExpiresValue');
const limitLogs = document.getElementById('limitLogs');
const limitRecordings = document.getElementById('limitRecordings');
const tokenInputSection = document.getElementById('tokenInputSection');
const licenseToken = document.getElementById('licenseToken');
const btnActivate = document.getElementById('btnActivate');
const tokenError = document.getElementById('tokenError');
const licenseActions = document.getElementById('licenseActions');
const btnRemoveLicense = document.getElementById('btnRemoveLicense');
const upgradeLink = document.getElementById('upgradeLink');

// Trial elements
const trialSection = document.getElementById('trialSection');
const trialActiveSection = document.getElementById('trialActiveSection');
const trialDaysRemaining = document.getElementById('trialDaysRemaining');
const btnStartTrial = document.getElementById('btnStartTrial');
const trialError = document.getElementById('trialError');
const extendTrialSection = document.getElementById('extendTrialSection');
const extendEmailForm = document.getElementById('extendEmailForm');
const extendEmail = document.getElementById('extendEmail');
const btnSendMagicLink = document.getElementById('btnSendMagicLink');
const extendError = document.getElementById('extendError');
const extendSending = document.getElementById('extendSending');
const extendSent = document.getElementById('extendSent');
const btnResendLink = document.getElementById('btnResendLink');
const btnRefreshTrial = document.getElementById('btnRefreshTrial');
const confirmCode = document.getElementById('confirmCode');
const btnConfirmCode = document.getElementById('btnConfirmCode');
const codeError = document.getElementById('codeError');
const codeConfirming = document.getElementById('codeConfirming');

// Privacy elements
const analyticsConsent = document.getElementById('analyticsConsent');

// Account/Auth elements
const accountSection = document.getElementById('accountSection');
const accountAnonymous = document.getElementById('accountAnonymous');
const accountSignedIn = document.getElementById('accountSignedIn');
const accountAvatar = document.getElementById('accountAvatar');
const accountName = document.getElementById('accountName');
const accountEmailDisplay = document.getElementById('accountEmailDisplay');
const btnGoogleSignIn = document.getElementById('btnGoogleSignIn');
const btnSignOut = document.getElementById('btnSignOut');

// State
let currentState = 'idle';
let currentLicense = null;
let currentHash = null;
let recordingNames = {};
let isEditingName = false;
let deleteCallback = null;
let isCaptureEnabled = true;

// Show specific state
function showState(state) {
  currentState = state;
  stateIdle.classList.toggle('hidden', state !== 'idle');
  stateRecording.classList.toggle('hidden', state !== 'recording');
  stateSent.classList.toggle('hidden', state !== 'sent');
}

// Update capture enabled UI
function updateCaptureUI(enabled) {
  isCaptureEnabled = enabled;
  captureEnabled.checked = enabled;
  captureLabel.textContent = enabled ? 'ON' : 'OFF';

  // Show/hide disabled overlay
  disabledOverlay.classList.toggle('hidden', enabled);
  container.classList.toggle('capture-disabled', !enabled);
}

// Update license UI
function updateLicenseUI(license, quota) {
  currentLicense = license;
  const isPro = ['pro', 'pro_early'].includes(license.plan) && license.isValid;
  const isTrial = license.plan === 'trial' && license.isValid;
  const isFree = license.plan === 'free' || !license.isValid;

  // Update plan badge
  if (isTrial) {
    planBadge.textContent = 'TRIAL';
    planBadge.className = 'plan-badge trial';
  } else {
    planBadge.textContent = license.plan.toUpperCase().replace('_', ' ');
    planBadge.className = 'plan-badge ' + (isPro ? 'pro' : 'free');
  }

  // Update license info section
  licensePlanValue.textContent = license.plan.toUpperCase().replace('_', ' ');
  licensePlanValue.className = 'license-plan-value ' + (isPro || isTrial ? 'pro' : 'free');

  if (license.email) {
    licenseEmailRow.classList.remove('hidden');
    licenseEmailValue.textContent = license.email;
  } else {
    licenseEmailRow.classList.add('hidden');
  }

  if (license.expiresAt) {
    licenseExpiresRow.classList.remove('hidden');
    const expDate = new Date(license.expiresAt);
    licenseExpiresValue.textContent = expDate.toLocaleDateString();
  } else {
    licenseExpiresRow.classList.add('hidden');
  }

  // Update limits display
  if (quota) {
    if (quota.logs.unlimited) {
      limitLogs.textContent = `${quota.logs.current} / Unlimited`;
    } else {
      limitLogs.textContent = `${quota.logs.current} / ${quota.logs.max}`;
    }

    if (quota.recordings.unlimited) {
      limitRecordings.textContent = `${quota.recordings.current} / Unlimited`;
    } else {
      limitRecordings.textContent = `${quota.recordings.current} / ${quota.recordings.max}`;
    }
  }

  // Handle trial-specific UI
  if (isTrial) {
    // Show trial active banner
    trialSection.classList.add('hidden');
    trialActiveSection.classList.remove('hidden');

    // Calculate days remaining - handle different date formats
    if (license.expiresAt) {
      let expiresAtMs;
      if (typeof license.expiresAt === 'string') {
        expiresAtMs = new Date(license.expiresAt).getTime();
      } else if (typeof license.expiresAt === 'number') {
        expiresAtMs = license.expiresAt;
      } else if (license.expiresAt instanceof Date) {
        expiresAtMs = license.expiresAt.getTime();
      } else {
        expiresAtMs = Date.now(); // fallback
      }
      const daysLeft = Math.ceil((expiresAtMs - Date.now()) / (24 * 60 * 60 * 1000));
      trialDaysRemaining.textContent = Math.max(0, daysLeft);
    } else {
      trialDaysRemaining.textContent = '-';
    }

    // Show "Extend Trial" section if not already extended (check if email exists)
    // Extended trials have email attached, anonymous ones don't
    const isExtended = license.email && license.email.length > 0;
    if (!isExtended) {
      extendTrialSection.classList.remove('hidden');
      // Set the extend trial link with installationId
      setupExtendTrialLink();
    } else {
      extendTrialSection.classList.add('hidden');
    }

    // Hide token input, hide remove button (can't revoke trial), show upgrade
    tokenInputSection.classList.add('hidden');
    licenseActions.classList.add('hidden');  // No remove option during trial
    upgradeLink.classList.remove('hidden');
  } else if (isPro) {
    // PRO plan - hide trial sections
    trialSection.classList.add('hidden');
    trialActiveSection.classList.add('hidden');
    extendTrialSection.classList.add('hidden');
    tokenInputSection.classList.add('hidden');
    licenseActions.classList.remove('hidden');
    upgradeLink.classList.add('hidden');
  } else {
    // FREE plan - check if can show trial option
    trialActiveSection.classList.add('hidden');
    extendTrialSection.classList.add('hidden');
    tokenInputSection.classList.remove('hidden');
    licenseActions.classList.add('hidden');
    upgradeLink.classList.remove('hidden');

    // Check if trial is available
    checkTrialAvailability();
  }
}

// Check if trial can be activated
async function checkTrialAvailability() {
  chrome.runtime.sendMessage({ action: 'CHECK_TRIAL_STATUS' }, (response) => {
    if (response) {
      if (response.canActivate && !response.hasTrialed) {
        trialSection.classList.remove('hidden');
      } else if (response.hasTrialed && response.isValid) {
        // Trial is active - refresh license to show it
        refreshLicense();
      } else {
        // Trial expired or already used
        trialSection.classList.add('hidden');
      }
    }
  });
}

// Setup magic link handlers for extending trial
let currentInstallationId = null;
let lastSentEmail = null;

async function setupExtendTrialLink() {
  try {
    // Get installation ID
    currentInstallationId = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'GET_INSTALLATION_ID' }, (response) => {
        resolve(response?.installationId || '');
      });
    });

    // Setup send button click handler
    if (btnSendMagicLink) {
      btnSendMagicLink.addEventListener('click', handleSendMagicLink);
    }

    // Setup resend button
    if (btnResendLink) {
      btnResendLink.addEventListener('click', handleSendMagicLink);
    }

    // Setup enter key on email input
    if (extendEmail) {
      extendEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleSendMagicLink();
        }
      });
    }

    // Setup refresh button
    if (btnRefreshTrial) {
      btnRefreshTrial.addEventListener('click', handleRefreshTrial);
    }

    // Setup code confirmation button
    if (btnConfirmCode) {
      btnConfirmCode.addEventListener('click', handleConfirmCode);
    }

    // Setup enter key on code input
    if (confirmCode) {
      confirmCode.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleConfirmCode();
        }
      });
      // Auto-uppercase as user types
      confirmCode.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      });
    }
  } catch (error) {
    console.error('[Sidepanel] Failed to setup extend trial:', error);
  }
}

// Handle refresh after clicking magic link
async function handleRefreshTrial() {
  if (!currentInstallationId) {
    showExtendError('Unable to refresh. Please reload the extension.');
    return;
  }

  btnRefreshTrial.disabled = true;
  btnRefreshTrial.textContent = 'Checking...';

  try {
    const response = await fetch(`https://browserconsoleai.com/api/license/get-extended-token?installationId=${encodeURIComponent(currentInstallationId)}`);
    const data = await response.json();

    if (data.success && data.extended && data.token) {
      // Save the new token
      chrome.runtime.sendMessage({
        action: 'SAVE_LICENSE_TOKEN',
        token: data.token
      }, (result) => {
        if (result?.success) {
          // Refresh the license display
          refreshLicense();
          // Hide extend section (trial is now extended)
          extendTrialSection.classList.add('hidden');
          trackEvent('trial_extended', { method: 'magic_link' });
        } else {
          showExtendState('sent');
          showExtendError('Failed to save token. Please try again.');
        }
      });
    } else {
      btnRefreshTrial.disabled = false;
      btnRefreshTrial.textContent = "I've clicked it - Refresh";

      if (data.extended === false) {
        showExtendError("Haven't clicked the link yet? Check your email.");
      } else {
        showExtendError(data.message || 'Unable to get token.');
      }
    }
  } catch (error) {
    console.error('[Sidepanel] Failed to refresh trial:', error);
    btnRefreshTrial.disabled = false;
    btnRefreshTrial.textContent = "I've clicked it - Refresh";
    showExtendError('Network error. Please try again.');
  }
}

// Handle sending magic link
async function handleSendMagicLink() {
  const email = extendEmail?.value?.trim() || lastSentEmail;

  if (!email) {
    showExtendError('Please enter your email');
    return;
  }

  if (!isValidEmail(email)) {
    showExtendError('Please enter a valid email');
    return;
  }

  if (!currentInstallationId) {
    showExtendError('Unable to identify installation. Please reload.');
    return;
  }

  // Show sending state
  showExtendState('sending');
  lastSentEmail = email;

  try {
    const response = await fetch('https://browserconsoleai.com/api/license/extend-trial-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        installationId: currentInstallationId,
      }),
    });

    const data = await response.json();

    if (data.success) {
      showExtendState('sent');
      trackEvent('extend_trial_email_sent', { email: email.split('@')[1] }); // Only domain for privacy
    } else {
      showExtendState('form');
      showExtendError(data.message || 'Failed to send magic link');
    }
  } catch (error) {
    console.error('[Sidepanel] Failed to send magic link:', error);
    showExtendState('form');
    showExtendError('Network error. Please try again.');
  }
}

// Handle confirming the one-time code from the web
async function handleConfirmCode() {
  const code = confirmCode?.value?.trim();

  if (!code) {
    showCodeError('Please enter the code from the website');
    return;
  }

  if (code.length !== 6) {
    showCodeError('Code must be 6 characters');
    return;
  }

  if (!currentInstallationId) {
    showCodeError('Unable to identify installation. Please reload.');
    return;
  }

  // Show confirming state
  showCodeConfirming(true);
  hideCodeError();

  try {
    const response = await fetch('https://browserconsoleai.com/api/license/confirm-link-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        installationId: currentInstallationId,
      }),
    });

    const data = await response.json();

    if (data.success && data.licenseToken) {
      // Save the new token
      chrome.runtime.sendMessage({
        action: 'SAVE_LICENSE_TOKEN',
        token: data.licenseToken
      }, (result) => {
        showCodeConfirming(false);

        if (result?.success) {
          // Refresh the license display
          refreshLicense();
          // Hide extend section (trial is now extended)
          extendTrialSection?.classList.add('hidden');
          // Clear the code input
          if (confirmCode) confirmCode.value = '';
          // Track event
          trackEvent('trial_extended', { method: 'one_time_code' });
        } else {
          showCodeError('Failed to save token. Please try again.');
        }
      });
    } else {
      showCodeConfirming(false);
      showCodeError(data.message || 'Invalid code. Please check and try again.');
    }
  } catch (error) {
    console.error('[Sidepanel] Failed to confirm code:', error);
    showCodeConfirming(false);
    showCodeError('Network error. Please try again.');
  }
}

// Show/hide code confirming state
function showCodeConfirming(show) {
  if (codeConfirming) {
    codeConfirming.classList.toggle('hidden', !show);
  }
  if (btnConfirmCode) {
    btnConfirmCode.disabled = show;
  }
  if (confirmCode) {
    confirmCode.disabled = show;
  }
}

// Show code error
function showCodeError(message) {
  if (codeError) {
    codeError.textContent = message;
    codeError.classList.remove('hidden');
  }
}

// Hide code error
function hideCodeError() {
  if (codeError) {
    codeError.classList.add('hidden');
  }
}

// Show extend trial state
function showExtendState(state) {
  extendEmailForm?.classList.toggle('hidden', state !== 'form');
  extendSending?.classList.toggle('hidden', state !== 'sending');
  extendSent?.classList.toggle('hidden', state !== 'sent');
  extendError?.classList.add('hidden');
}

// Show error in extend section
function showExtendError(message) {
  if (extendError) {
    extendError.textContent = message;
    extendError.classList.remove('hidden');
  }
}

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Show limit warning
function showLimitWarning(type, max) {
  let message = '';
  if (type === 'logs') {
    message = `Log limit reached (${max}). Upgrade for unlimited.`;
  } else if (type === 'recordings') {
    message = `Recording limit reached (${max}). Upgrade for unlimited.`;
  }

  limitBannerText.textContent = message;
  limitBanner.classList.remove('hidden');
}

// Hide limit warning
function hideLimitWarning() {
  limitBanner.classList.add('hidden');
}

// Refresh license info
async function refreshLicense() {
  chrome.runtime.sendMessage({ action: 'GET_LICENSE' }, (response) => {
    if (response) {
      updateLicenseUI(response.license, response.quota);
    }
  });
}

// Update server status
function updateStatus(connected) {
  statusDot.className = 'status-dot ' + (connected ? 'connected' : 'disconnected');
  statusText.textContent = connected ? 'Connected' : 'Offline';
}

// Update stats display
function updateStats(logs) {
  const stats = { total: 0, log: 0, info: 0, warn: 0, error: 0, debug: 0 };

  logs.forEach(log => {
    stats.total++;
    if (stats.hasOwnProperty(log.type)) {
      stats[log.type]++;
    }
  });

  statTotal.textContent = stats.total;
  statLog.textContent = stats.log;
  statInfo.textContent = stats.info;
  statWarn.textContent = stats.warn;
  statError.textContent = stats.error;
  statDebug.textContent = stats.debug;
}

// Render log item
function renderLogItem(log) {
  const text = log.args.join(' ').slice(0, 150);
  return `<div class="log-item ${log.type}">${escapeHtml(text)}</div>`;
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Update recording logs display
// Note: Filtering now happens at capture time in service-worker.js
function updateRecordingLogs(logs) {
  logsCount.textContent = logs.length;
  updateStats(logs);

  if (logs.length === 0) {
    recordingLogs.innerHTML = '';
    return;
  }

  const recentLogs = logs.slice(-20);
  recordingLogs.innerHTML = recentLogs.map(renderLogItem).join('');
  recordingLogs.scrollTop = recordingLogs.scrollHeight;
}

// Format time ago
function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Show confirmation dialog
function showConfirmDialog(message) {
  return new Promise((resolve) => {
    dialogMessage.textContent = message;
    dialogOverlay.classList.remove('hidden');

    deleteCallback = resolve;
  });
}

// Hide confirmation dialog
function hideConfirmDialog() {
  dialogOverlay.classList.add('hidden');
  deleteCallback = null;
}

// Dialog event listeners
dialogCancel.addEventListener('click', () => {
  if (deleteCallback) deleteCallback(false);
  hideConfirmDialog();
});

dialogConfirm.addEventListener('click', () => {
  if (deleteCallback) deleteCallback(true);
  hideConfirmDialog();
});

dialogOverlay.addEventListener('click', (e) => {
  if (e.target === dialogOverlay) {
    if (deleteCallback) deleteCallback(false);
    hideConfirmDialog();
  }
});

// Render recordings history (max 10, managed by service worker)
function renderRecordingsHistory(recordings) {
  if (isEditingName) return; // Don't re-render while editing

  if (!recordings || recordings.length === 0) {
    recordingsList.innerHTML = '<div class="empty-state">No recordings yet</div>';
    return;
  }

  const recentRecordings = recordings;

  recordingsList.innerHTML = recentRecordings.map(rec => {
    const name = recordingNames[rec.id] || '';
    const displayName = name || rec.id;
    const mcpStatus = rec.sentToMcp ? 'sent' : 'local';
    const mcpLabel = rec.sentToMcp ? 'MCP' : 'Local';

    return `
      <div class="recording-item" data-id="${rec.id}">
        <button class="btn-copy-id" title="Copy ID" data-id="${rec.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <div class="recording-item-info">
          <div class="recording-item-header">
            <span class="recording-item-name editable" data-id="${rec.id}" title="Click to rename">${escapeHtml(displayName)}</span>
            <span class="recording-item-mcp ${mcpStatus}" title="${rec.sentToMcp ? 'Sent to MCP server' : 'Local only'}">${mcpLabel}</span>
          </div>
          <div class="recording-item-meta">
            ${name ? `<span class="recording-item-id">${rec.id}</span>` : ''}
            <span>${rec.count} logs</span>
            <span>${formatTimeAgo(rec.timestamp)}</span>
          </div>
        </div>
        <div class="recording-item-actions">
          <button class="btn-view" title="View JSON" data-id="${rec.id}" ${!rec.sentToMcp ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button class="btn-copy-log" title="Copy logs (plain)" data-id="${rec.id}" ${!rec.sentToMcp ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </button>
          <button class="btn-delete" title="Delete recording" data-id="${rec.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners
  recordingsList.querySelectorAll('.recording-item-name.editable').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      startEditingName(el);
    });
  });

  recordingsList.querySelectorAll('.btn-copy-id').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      navigator.clipboard.writeText(id);
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 1000);
    });
  });

  recordingsList.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      window.open(`${SERVER_URL}/logs?recordingId=${id}`, '_blank');
    });
  });

  recordingsList.querySelectorAll('.btn-copy-log').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      try {
        // Fetch logs in plain format with current MCP settings
        const response = await fetch(`${SERVER_URL}/logs?recordingId=${id}&format=plain&compressObjects=true&showSource=true`);
        const text = await response.text();
        await navigator.clipboard.writeText(text);
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 1000);

        // Track copy recording
        trackEvent('copy_recording', { recordingId: id });
      } catch (err) {
        console.error('Failed to copy logs:', err);
      }
    });
  });

  recordingsList.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const name = recordingNames[id] || id;

      const confirmed = await showConfirmDialog(`Delete "${name}"? This will remove it from history.`);
      if (confirmed) {
        deleteRecording(id);
      }
    });
  });
}

// Delete recording
async function deleteRecording(id) {
  // Remove from local names
  delete recordingNames[id];
  await saveRecordingNames();

  // Remove from history via background
  chrome.runtime.sendMessage({ action: 'DELETE_RECORDING', recordingId: id }, () => {
    refreshStatus();
  });
}

// Start editing recording name
function startEditingName(el) {
  if (isEditingName) return;
  isEditingName = true;

  const id = el.dataset.id;
  const currentName = recordingNames[id] || '';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.placeholder = id;

  el.innerHTML = '';
  el.appendChild(input);

  // Focus after a small delay to prevent immediate blur
  setTimeout(() => {
    input.focus();
    input.select();
  }, 10);

  const finishEditing = () => {
    if (!isEditingName) return;
    isEditingName = false;

    const newName = input.value.trim();
    recordingNames[id] = newName;
    saveRecordingNames();
    el.textContent = newName || id;

    // Refresh after editing is done
    setTimeout(() => refreshStatus(), 100);
  };

  input.addEventListener('blur', finishEditing);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    } else if (e.key === 'Escape') {
      isEditingName = false;
      el.textContent = currentName || id;
    }
  });
}

// Load/save recording names (session storage - cleared on browser close)
async function loadRecordingNames() {
  const result = await chrome.storage.session.get('recordingNames');
  recordingNames = result.recordingNames || {};
}

async function saveRecordingNames() {
  await chrome.storage.session.set({ recordingNames });
}

// Get status from background
async function refreshStatus() {
  if (isEditingName) return; // Don't refresh while editing

  chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (response) => {
    if (response) {
      updateStatus(response.connected);

      // Update capture enabled state from background
      if (response.captureEnabled !== undefined) {
        updateCaptureUI(response.captureEnabled);
      }

      if (response.isRecording && currentState !== 'recording') {
        showState('recording');
        recordingLabel.textContent = 'Recording...';
      }

      if (response.isRecording || currentState === 'recording') {
        updateRecordingLogs(response.recordingLogs || []);
      } else if (currentState === 'idle') {
        updateStats([]);
      }
    }
  });

  chrome.runtime.sendMessage({ action: 'GET_RECORDINGS_HISTORY' }, (response) => {
    if (response && response.recordings) {
      renderRecordingsHistory(response.recordings);
    }
  });
}

// Handle Capture toggle
captureEnabled.addEventListener('change', () => {
  const enabled = captureEnabled.checked;
  updateCaptureUI(enabled);

  // Notify background to enable/disable capture
  chrome.runtime.sendMessage({
    action: 'SET_CAPTURE_ENABLED',
    enabled
  });

  // Save to persistent storage
  chrome.storage.local.set({ captureEnabled: enabled });
});

// Enable capture button in disabled overlay
btnEnableCapture.addEventListener('click', () => {
  captureEnabled.checked = true;
  captureEnabled.dispatchEvent(new Event('change'));
});

// Start recording
btnStartRecord.addEventListener('click', () => {
  hideLimitWarning(); // Clear any previous warning
  chrome.runtime.sendMessage({ action: 'START_RECORDING' }, (response) => {
    if (response && response.started) {
      showState('recording');
      recordingLabel.textContent = 'Recording...';
      updateRecordingLogs([]);
    } else if (response && response.error === 'recording_limit') {
      showLimitWarning('recordings', response.max);
    }
  });
});

// Stop recording and send
btnStopRecord.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'STOP_RECORDING' }, (response) => {
    if (response && response.hash) {
      currentHash = response.hash;
      hashValue.textContent = response.hash;
      showState('sent');

      // Update UI based on MCP availability
      const sentMessage = document.querySelector('.sent-message');
      const hashHint = document.querySelector('.hash-hint');

      if (response.success) {
        sentMessage.textContent = 'Logs sent to MCP!';
        sentMessage.classList.remove('no-mcp');
        hashHint.textContent = 'Share this ID with your AI agent to analyze the logs';
        hashHint.classList.remove('no-mcp');
      } else if (!response.mcpAvailable) {
        sentMessage.textContent = 'Recording saved locally';
        sentMessage.classList.add('no-mcp');
        hashHint.innerHTML = 'MCP access requires PRO plan. <a href="https://browserconsoleai.com/pricing" target="_blank" id="upgradeHintLink">Upgrade</a>';
        hashHint.classList.add('no-mcp');
        // Track upgrade link click in sent state
        document.getElementById('upgradeHintLink')?.addEventListener('click', () => {
          trackEvent('upgrade_clicked', { source: 'sidepanel_sent_state' });
        });
      } else {
        sentMessage.textContent = 'Recording saved (MCP offline)';
        sentMessage.classList.remove('no-mcp');
        hashHint.textContent = 'MCP server not connected. Start it to enable AI analysis.';
        hashHint.classList.remove('no-mcp');
      }

      refreshStatus();
      refreshLicense();
    }
  });
});

// Stop only (don't send)
btnStopOnly.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'STOP_ONLY' }, () => {
    showState('idle');
    updateStats([]);
    updateRecordingLogs([]);
  });
});

// Copy hash
btnCopy.addEventListener('click', () => {
  navigator.clipboard.writeText(currentHash).then(() => {
    btnCopy.classList.add('copied');
    setTimeout(() => btnCopy.classList.remove('copied'), 1000);
  });
});

// New recording
btnNewRecording.addEventListener('click', () => {
  showState('idle');
  currentHash = null;
  updateRecordingLogs([]);
  updateStats([]);
});

// Load and save settings
async function loadSettings() {
  // Load capture enabled state (persistent)
  const captureResult = await chrome.storage.local.get('captureEnabled');
  const captureState = captureResult.captureEnabled !== false; // Default ON
  updateCaptureUI(captureState);

  // Notify background of current capture state
  chrome.runtime.sendMessage({
    action: 'SET_CAPTURE_ENABLED',
    enabled: captureState
  });

  // Load other settings
  const result = await chrome.storage.local.get('settings');
  const settings = result.settings || {};

  // Capture tab settings
  includePatterns.value = settings.includePatterns || '';
  excludePatterns.value = settings.excludePatterns || '';
  filterLog.checked = settings.filterLog !== false;
  filterInfo.checked = settings.filterInfo !== false;
  filterWarn.checked = settings.filterWarn !== false;
  filterError.checked = settings.filterError !== false;
  filterDebug.checked = settings.filterDebug !== false;

  // MCP Output tab settings (defaults optimized for minimal tokens)
  compactMode.checked = settings.compactMode || false;
  compressObjects.checked = settings.compressObjects !== false; // default true
  plainTextFormat.checked = settings.plainTextFormat !== false; // default true
  showSourceInPlain.checked = settings.showSourceInPlain !== false; // default true

  // Props selectors (all false by default for minimal output)
  propId.checked = settings.propId || false;
  propSessionId.checked = settings.propSessionId || false;
  propRecordingId.checked = settings.propRecordingId || false;
  propTimestamp.checked = settings.propTimestamp || false;
  propUrl.checked = settings.propUrl || false;

  // Update preview
  updateOutputPreview();

  // Save settings to ensure defaults are stored
  saveSettings();
}

async function saveSettings() {
  const settings = {
    // Capture tab
    includePatterns: includePatterns.value,
    excludePatterns: excludePatterns.value,
    filterLog: filterLog.checked,
    filterInfo: filterInfo.checked,
    filterWarn: filterWarn.checked,
    filterError: filterError.checked,
    filterDebug: filterDebug.checked,
    // MCP Output tab
    compactMode: compactMode.checked,
    compressObjects: compressObjects.checked,
    plainTextFormat: plainTextFormat.checked,
    showSourceInPlain: showSourceInPlain.checked,
    propId: propId.checked,
    propSessionId: propSessionId.checked,
    propRecordingId: propRecordingId.checked,
    propTimestamp: propTimestamp.checked,
    propUrl: propUrl.checked
  };

  await chrome.storage.local.set({ settings });
  chrome.runtime.sendMessage({ action: 'SETTINGS_UPDATED', settings });
}

// Generate preview output based on current MCP settings
function updateOutputPreview() {
  const sampleArgs = '[Store] Cache saved {"key":"products_cache_very_long_object_data_here_end"}';

  let output = '';

  // Compress if enabled
  let text = sampleArgs;
  if (compressObjects.checked) {
    // Simulate compression of JSON objects > 50 chars
    text = '[Store] Cache saved {"key":"products_c...ta_here_end"}';
  }

  // Build output parts
  const parts = [text];

  if (propId.checked) parts.push('id:abc123');
  if (propSessionId.checked) parts.push('sess:tab-1');
  if (propRecordingId.checked) parts.push('rec:REC-xyz');
  if (propTimestamp.checked) parts.push('ts:1234567890');
  if (propUrl.checked) parts.push('url:example.com');
  if (showSourceInPlain.checked) parts.push('{store.ts:42}');

  if (plainTextFormat.checked) {
    output = parts.join(',') + '|[API] Request complete|...';
  } else {
    output = JSON.stringify({ args: [sampleArgs], source: 'store.ts:42' }, null, 2).slice(0, 150) + '...';
  }

  outputPreview.textContent = output;
}

// Settings tabs switching
settingsTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.dataset.tab;

    // Update active tab
    settingsTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Show corresponding page
    settingsPages.forEach(page => {
      let pageId = 'tabCapture';
      if (targetTab === 'mcp-output') pageId = 'tabMcpOutput';
      else if (targetTab === 'license') pageId = 'tabLicense';
      else if (targetTab === 'capture') pageId = 'tabCapture';
      else if (targetTab === 'privacy') pageId = 'tabPrivacy';
      page.classList.toggle('active', page.id === pageId);
    });

    // Refresh license info when switching to license tab
    if (targetTab === 'license') {
      refreshLicense();
    }

    // Load privacy settings when switching to privacy tab
    if (targetTab === 'privacy') {
      loadPrivacySettings();
    }
  });
});

// Privacy settings
async function loadPrivacySettings() {
  const result = await chrome.storage.local.get('bcai_analytics_consent');
  // Default to true if not set
  analyticsConsent.checked = result.bcai_analytics_consent !== false;
}

// Handle analytics consent toggle
analyticsConsent.addEventListener('change', async () => {
  const consent = analyticsConsent.checked;
  await chrome.storage.local.set({ bcai_analytics_consent: consent });

  // Track the consent change (this is considered essential)
  trackEvent('analytics_consent_changed', { consent });
});

// Plan badge click - open license tab
planBadge.addEventListener('click', () => {
  // Open settings if closed
  const settingsSection = document.querySelector('.settings-section');
  settingsSection.open = true;

  // Switch to license tab
  settingsTabs.forEach(t => t.classList.remove('active'));
  document.querySelector('[data-tab="license"]').classList.add('active');
  settingsPages.forEach(page => {
    page.classList.toggle('active', page.id === 'tabLicense');
  });

  refreshLicense();
});

// Activate license button
btnActivate.addEventListener('click', () => {
  const token = licenseToken.value.trim();
  if (!token) return;

  btnActivate.disabled = true;
  btnActivate.textContent = 'Activating...';
  tokenError.classList.add('hidden');

  chrome.runtime.sendMessage({ action: 'SET_LICENSE_TOKEN', token }, (response) => {
    btnActivate.disabled = false;
    btnActivate.textContent = 'Activate';

    if (response && response.success) {
      licenseToken.value = '';
      refreshLicense();
      hideLimitWarning();
    } else {
      tokenError.textContent = response?.error || 'Invalid or expired token';
      tokenError.classList.remove('hidden');
    }
  });
});

// Remove license button
btnRemoveLicense.addEventListener('click', async () => {
  const confirmed = await showConfirmDialog('Remove license? You will be downgraded to FREE plan.');
  if (confirmed) {
    chrome.runtime.sendMessage({ action: 'REMOVE_LICENSE_TOKEN' }, () => {
      refreshLicense();
    });
  }
});

// Track upgrade link clicks
upgradeLink.addEventListener('click', () => {
  trackEvent('upgrade_clicked', { source: 'sidepanel_license_tab' });
});

// Start trial button
btnStartTrial.addEventListener('click', () => {
  btnStartTrial.disabled = true;
  btnStartTrial.textContent = 'Activating...';
  trialError.classList.add('hidden');

  chrome.runtime.sendMessage({ action: 'ACTIVATE_TRIAL' }, (response) => {
    btnStartTrial.disabled = false;
    btnStartTrial.textContent = 'Start Free Trial';

    if (response && response.success) {
      // Trial activated successfully
      refreshLicense();
      hideLimitWarning();
    } else {
      // Show error
      trialError.textContent = response?.message || 'Failed to activate trial. Please try again.';
      trialError.classList.remove('hidden');

      // If trial already used, hide the trial section
      if (response?.error === 'trial_already_used' || response?.error === 'trial_expired') {
        trialSection.classList.add('hidden');
      }
    }
  });
});

// Capture tab event listeners
[filterLog, filterInfo, filterWarn, filterError, filterDebug].forEach(el => {
  el.addEventListener('change', saveSettings);
});

[includePatterns, excludePatterns].forEach(el => {
  el.addEventListener('input', debounce(saveSettings, 500));
});

// MCP Output tab event listeners
[compactMode, compressObjects, plainTextFormat, showSourceInPlain, propId, propSessionId, propRecordingId, propTimestamp, propUrl].forEach(el => {
  el.addEventListener('change', () => {
    saveSettings();
    updateOutputPreview();
  });
});

// Debounce helper
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'RECORDING_UPDATE' && currentState === 'recording') {
    updateRecordingLogs(message.logs || []);
  }

  if (message.action === 'LIMIT_REACHED') {
    showLimitWarning(message.type, message.max);
    // Also refresh license to update counts
    refreshLicense();
  }
});

// Show/Hide logs toggle
showLogsToggle.addEventListener('change', () => {
  logsContainer.classList.toggle('hidden', !showLogsToggle.checked);
});

// ================================================
// Firebase Auth Integration
// ================================================

// Update account UI based on auth state
function updateAccountUI(user) {
  if (!accountSection) return;

  if (user && !user.isAnonymous) {
    // User is signed in (not anonymous)
    accountAnonymous.classList.add('hidden');
    accountSignedIn.classList.remove('hidden');

    // Update user info
    if (user.photoURL) {
      accountAvatar.src = user.photoURL;
      accountAvatar.style.display = 'block';
    } else {
      accountAvatar.style.display = 'none';
    }

    accountName.textContent = user.displayName || 'User';
    accountEmailDisplay.textContent = user.email || '';
  } else {
    // Anonymous or not signed in
    accountAnonymous.classList.remove('hidden');
    accountSignedIn.classList.add('hidden');
  }
}

// Initialize Firebase Auth
async function initializeAuth() {
  // Wait for Firebase SDK and AuthManager to be available
  if (typeof AuthManager === 'undefined') {
    console.log('[Sidepanel] AuthManager not loaded yet, retrying...');
    setTimeout(initializeAuth, 100);
    return;
  }

  try {
    // Initialize Firebase
    AuthManager.initializeFirebase();

    // Listen for auth state changes
    AuthManager.onAuthStateChanged((user) => {
      console.log('[Sidepanel] Auth state changed:', user?.uid, user?.isAnonymous ? '(anonymous)' : '');
      updateAccountUI(user);

      // Refresh license when auth changes
      refreshLicense();
    });

    // Ensure user is signed in (anonymous if no account)
    await AuthManager.ensureSignedIn();

    console.log('[Sidepanel] Auth initialized');
  } catch (error) {
    console.error('[Sidepanel] Failed to initialize auth:', error);
  }
}

// Google Sign-In handler
if (btnGoogleSignIn) {
  btnGoogleSignIn.addEventListener('click', async () => {
    if (typeof AuthManager === 'undefined') {
      console.error('[Sidepanel] AuthManager not available');
      return;
    }

    btnGoogleSignIn.disabled = true;
    btnGoogleSignIn.textContent = 'Signing in...';

    try {
      const result = await AuthManager.signInWithGoogle();

      if (result.linked) {
        console.log('[Sidepanel] Google account linked to anonymous user');
        trackEvent('auth_google_linked');
      } else if (result.existingAccount) {
        console.log('[Sidepanel] Signed in with existing Google account');
        trackEvent('auth_google_signin_existing');
      } else {
        console.log('[Sidepanel] Signed in with Google');
        trackEvent('auth_google_signin');
      }

      // Refresh license to get updated entitlements
      refreshLicense();
    } catch (error) {
      console.error('[Sidepanel] Google sign-in failed:', error);

      // Handle specific errors
      if (error.code === 'auth/popup-blocked') {
        alert('Popup was blocked. Please allow popups for this extension.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, do nothing
      } else {
        alert('Sign-in failed. Please try again.');
      }
    } finally {
      btnGoogleSignIn.disabled = false;
      btnGoogleSignIn.innerHTML = `
        <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in with Google
      `;
    }
  });
}

// Sign Out handler
if (btnSignOut) {
  btnSignOut.addEventListener('click', async () => {
    if (typeof AuthManager === 'undefined') {
      console.error('[Sidepanel] AuthManager not available');
      return;
    }

    try {
      await AuthManager.signOut();
      console.log('[Sidepanel] Signed out');
      trackEvent('auth_signout');

      // Sign in anonymously after sign out (to maintain a userId for tracking)
      await AuthManager.signInAnonymously();

      // Refresh license
      refreshLicense();
    } catch (error) {
      console.error('[Sidepanel] Sign out failed:', error);
    }
  });
}

// Initialize
loadSettings();
loadRecordingNames();
refreshStatus();
refreshLicense();

// Initialize Firebase Auth
initializeAuth();

// Track sidepanel opened
trackEvent('sidepanel_opened');

// Refresh status periodically
setInterval(refreshStatus, 3000);

// Refresh license periodically (less frequently)
setInterval(refreshLicense, 30000);
