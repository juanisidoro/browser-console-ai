// Side Panel Script - Redesigned UI with Modals & Accordions

const SERVER_URL = 'http://localhost:9876';

// Track analytics helper
function trackEvent(event, data = {}) {
  chrome.runtime.sendMessage({ action: 'TRACK_EVENT', event, data });
}

// ================================================
// DOM Elements - Header
// ================================================
const captureEnabled = document.getElementById('captureEnabled');
const planBadge = document.getElementById('planBadge');
const planText = document.getElementById('planText');
const mcpDot = document.getElementById('mcpDot');

// ================================================
// DOM Elements - Action Block
// ================================================
const actionBlock = document.getElementById('actionBlock');
const actionTitle = document.getElementById('actionTitle');
const actionSubtitle = document.getElementById('actionSubtitle');
const btnExpandLogs = document.getElementById('btnExpandLogs');
const statTotal = document.getElementById('statTotal');
const statLog = document.getElementById('statLog');
const statInfo = document.getElementById('statInfo');
const statWarn = document.getElementById('statWarn');
const statError = document.getElementById('statError');
const statDebug = document.getElementById('statDebug');
const btnAction = document.getElementById('btnAction');
const btnActionText = document.getElementById('btnActionText');
const btnActionIcon = document.getElementById('btnActionIcon');
const actionPreview = document.getElementById('actionPreview');
const previewContent = document.getElementById('previewContent');

// ================================================
// DOM Elements - Accordions
// ================================================
const accordionCapture = document.getElementById('accordionCapture');
const accordionOutput = document.getElementById('accordionOutput');
const accordionRecordings = document.getElementById('accordionRecordings');
const captureBadge = document.getElementById('captureBadge');
const outputBadge = document.getElementById('outputBadge');
const recordingsCount = document.getElementById('recordingsCount');
const recordingsList = document.getElementById('recordingsList');

// Settings elements - Capture
const filterLog = document.getElementById('filterLog');
const filterInfo = document.getElementById('filterInfo');
const filterWarn = document.getElementById('filterWarn');
const filterError = document.getElementById('filterError');
const filterDebug = document.getElementById('filterDebug');
const includePatterns = document.getElementById('includePatterns');
const excludePatterns = document.getElementById('excludePatterns');

// Settings elements - MCP Output
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

// ================================================
// DOM Elements - Footer
// ================================================
const btnPreferences = document.getElementById('btnPreferences');

// ================================================
// DOM Elements - Account Modal
// ================================================
const accountModalOverlay = document.getElementById('accountModalOverlay');
const btnCloseAccountModal = document.getElementById('btnCloseAccountModal');
const accountAnonymous = document.getElementById('accountAnonymous');
const accountSignedIn = document.getElementById('accountSignedIn');
const accountAvatar = document.getElementById('accountAvatar');
const accountName = document.getElementById('accountName');
const accountEmail = document.getElementById('accountEmail');
const btnGoogleSignIn = document.getElementById('btnGoogleSignIn');
const btnSignOut = document.getElementById('btnSignOut');
const planInfoValue = document.getElementById('planInfoValue');
const logsQuotaValue = document.getElementById('logsQuotaValue');
const recordingsQuotaValue = document.getElementById('recordingsQuotaValue');
const trialSection = document.getElementById('trialSection');
const btnStartTrial = document.getElementById('btnStartTrial');
const trialError = document.getElementById('trialError');
const trialActiveSection = document.getElementById('trialActiveSection');
const trialDaysRemaining = document.getElementById('trialDaysRemaining');
const extendTrialSection = document.getElementById('extendTrialSection');
const extendEmail = document.getElementById('extendEmail');
const btnSendMagicLink = document.getElementById('btnSendMagicLink');
const extendError = document.getElementById('extendError');
const extendSending = document.getElementById('extendSending');
const extendSent = document.getElementById('extendSent');
const confirmCode = document.getElementById('confirmCode');
const btnConfirmCode = document.getElementById('btnConfirmCode');
const codeError = document.getElementById('codeError');
const btnResendLink = document.getElementById('btnResendLink');
const btnUpgrade = document.getElementById('btnUpgrade');
const tokenSection = document.getElementById('tokenSection');
const licenseToken = document.getElementById('licenseToken');
const btnActivate = document.getElementById('btnActivate');
const tokenError = document.getElementById('tokenError');

// ================================================
// DOM Elements - Logs Sidebar Modal
// ================================================
const logsModalOverlay = document.getElementById('logsModalOverlay');
const btnCopyAllLogs = document.getElementById('btnCopyAllLogs');
const btnDownloadLogs = document.getElementById('btnDownloadLogs');
const btnCloseLogsModal = document.getElementById('btnCloseLogsModal');
const sidebarStatTotal = document.getElementById('sidebarStatTotal');
const sidebarStatLog = document.getElementById('sidebarStatLog');
const sidebarStatInfo = document.getElementById('sidebarStatInfo');
const sidebarStatWarn = document.getElementById('sidebarStatWarn');
const sidebarStatError = document.getElementById('sidebarStatError');
const sidebarStatDebug = document.getElementById('sidebarStatDebug');
const logsSearchInput = document.getElementById('logsSearchInput');
const sidebarLogs = document.getElementById('sidebarLogs');
const sidebarFilters = document.querySelectorAll('.sidebar-filters .filter-chip input');

// ================================================
// DOM Elements - Preferences Panel
// ================================================
const preferencesPanel = document.getElementById('preferencesPanel');
const btnClosePreferences = document.getElementById('btnClosePreferences');
const analyticsConsent = document.getElementById('analyticsConsent');

// ================================================
// DOM Elements - MCP Tooltip
// ================================================
const mcpTooltip = document.getElementById('mcpTooltip');
const mcpTooltipStatus = document.getElementById('mcpTooltipStatus');
const mcpTooltipText = document.getElementById('mcpTooltipText');

// ================================================
// DOM Elements - Dialogs
// ================================================
const dialogOverlay = document.getElementById('dialogOverlay');
const dialogMessage = document.getElementById('dialogMessage');
const dialogCancel = document.getElementById('dialogCancel');
const dialogConfirm = document.getElementById('dialogConfirm');

// ================================================
// DOM Elements - Limit Banner & Disabled Overlay
// ================================================
const limitBanner = document.getElementById('limitBanner');
const limitBannerText = document.getElementById('limitBannerText');
const disabledOverlay = document.getElementById('disabledOverlay');
const btnEnableCapture = document.getElementById('btnEnableCapture');

// ================================================
// State
// ================================================
let currentState = 'idle'; // idle, recording, saved
let currentLicense = null;
let currentHash = null;
let recordingNames = {};
let isEditingName = false;
let deleteCallback = null;
let isCaptureEnabled = true;
let currentLogs = [];
let filteredLogs = [];
let mcpConnected = false;

// ================================================
// Accordion Logic - Only one open at a time
// ================================================
const accordions = [accordionCapture, accordionOutput, accordionRecordings];

accordions.forEach(accordion => {
  if (!accordion) return;
  accordion.addEventListener('toggle', () => {
    if (accordion.open) {
      accordions.forEach(other => {
        if (other && other !== accordion && other.open) {
          other.open = false;
        }
      });
    }
  });
});

// ================================================
// Account Modal Logic
// ================================================
async function openAccountModal() {
  accountModalOverlay?.classList.remove('hidden');

  // Refresh entitlements from backend with Firebase ID token
  // This is the ONLY source of truth - no need to call refreshLicense() separately
  await refreshEntitlementsFromBackend();
}

function closeAccountModal() {
  accountModalOverlay?.classList.add('hidden');
}

// Refresh entitlements from backend (with Firebase ID token if signed in)
async function refreshEntitlementsFromBackend() {
  try {
    let firebaseIdToken = null;

    // Get Firebase ID token if user is signed in (non-anonymous)
    if (typeof AuthManager !== 'undefined') {
      const user = AuthManager.getCurrentUser();
      if (user && !user.isAnonymous) {
        try {
          // Get fresh ID token using AuthManager
          firebaseIdToken = await AuthManager.getIdToken(true);
        } catch (e) {
          console.debug('[Sidepanel] Could not get Firebase ID token:', e);
        }
      }
    }

    // Request fresh entitlements from backend
    chrome.runtime.sendMessage({
      action: 'REFRESH_ENTITLEMENTS',
      firebaseIdToken
    }, (response) => {
      if (response?.success && response.entitlements) {
        console.debug('[Sidepanel] Entitlements refreshed:', response.entitlements);

        // Auto-sync: If backend has a token (web trial or PRO), save it locally
        if (response.entitlements.token) {
          console.debug('[Sidepanel] Auto-syncing token from backend');
          chrome.runtime.sendMessage({
            action: 'SAVE_LICENSE_TOKEN',
            token: response.entitlements.token
          }, (result) => {
            if (result?.success) {
              console.debug('[Sidepanel] Token auto-synced successfully');
            }
          });
        }

        // Update UI based on entitlements
        updateEntitlementsUI(response.entitlements);
      }
    });
  } catch (error) {
    console.error('[Sidepanel] Failed to refresh entitlements:', error);
  }
}

// Update UI based on entitlements from backend
// This is the SINGLE SOURCE OF TRUTH for account/license state
function updateEntitlementsUI(entitlements) {
  if (!entitlements) return;

  const isPro = ['pro', 'pro_early'].includes(entitlements.plan);
  const isTrial = entitlements.plan === 'trial';

  // Update header badge
  if (planText) {
    if (isTrial) {
      planText.textContent = 'TRIAL';
      planBadge.className = 'plan-badge trial';
    } else if (isPro) {
      planText.textContent = entitlements.plan.toUpperCase().replace('_', ' ');
      planBadge.className = 'plan-badge pro';
    } else {
      planText.textContent = 'FREE';
      planBadge.className = 'plan-badge';
    }
  }

  // Update plan info in modal
  if (planInfoValue) {
    planInfoValue.textContent = entitlements.plan.toUpperCase().replace('_', ' ');
  }

  // Update usage quotas in modal
  const limits = entitlements.limits || {};
  if (logsQuotaValue) {
    const maxLogs = limits.maxLogs;
    logsQuotaValue.textContent = maxLogs === Infinity || maxLogs > 10000
      ? 'Unlimited'
      : `0 / ${maxLogs}`;
  }
  if (recordingsQuotaValue) {
    const maxRec = limits.maxRecordings;
    recordingsQuotaValue.textContent = maxRec === Infinity || maxRec > 10000
      ? 'Unlimited'
      : `${recordingsHistory?.length || 0} / ${maxRec}`;
  }

  // Handle trial UI in modal
  if (isTrial && entitlements.daysRemaining !== null) {
    trialSection?.classList.add('hidden');
    trialActiveSection?.classList.remove('hidden');

    if (trialDaysRemaining) {
      trialDaysRemaining.textContent = Math.max(0, entitlements.daysRemaining);
    }

    // Show extend section if can extend
    const canExtend = entitlements.canExtendTrial === true;
    extendTrialSection?.classList.toggle('hidden', !canExtend);
    if (canExtend) setupExtendTrialLink();

    btnUpgrade?.classList.remove('hidden');
  } else if (isPro) {
    trialSection?.classList.add('hidden');
    trialActiveSection?.classList.add('hidden');
    extendTrialSection?.classList.add('hidden');
    btnUpgrade?.classList.add('hidden');
  } else {
    // FREE plan - use canActivateTrial from entitlements (NO extra request needed)
    trialActiveSection?.classList.add('hidden');
    extendTrialSection?.classList.add('hidden');
    btnUpgrade?.classList.remove('hidden');

    // Show trial section based on entitlements.canActivateTrial
    if (entitlements.canActivateTrial) {
      trialSection?.classList.remove('hidden');
    } else {
      trialSection?.classList.add('hidden');
    }
  }

  // Update currentLicense for other parts of the UI
  currentLicense = {
    plan: entitlements.plan,
    isValid: isPro || isTrial,
    expiresAt: entitlements.planEndsAt,
    limits: limits
  };
}

planBadge?.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  openAccountModal();
});

btnCloseAccountModal?.addEventListener('click', closeAccountModal);

accountModalOverlay?.addEventListener('click', (e) => {
  if (e.target === accountModalOverlay) closeAccountModal();
});

// ================================================
// Logs Sidebar Modal Logic
// ================================================
function openLogsModal() {
  logsModalOverlay?.classList.remove('hidden');
  renderSidebarLogs();
}

function closeLogsModal() {
  logsModalOverlay?.classList.add('hidden');
}

btnExpandLogs?.addEventListener('click', openLogsModal);
btnCloseLogsModal?.addEventListener('click', closeLogsModal);

logsModalOverlay?.addEventListener('click', (e) => {
  if (e.target === logsModalOverlay) closeLogsModal();
});

// Search and filter logs in sidebar
logsSearchInput?.addEventListener('input', renderSidebarLogs);
sidebarFilters.forEach(input => {
  input?.addEventListener('change', (e) => {
    e.target.closest('.filter-chip')?.classList.toggle('active', e.target.checked);
    renderSidebarLogs();
  });
});

function getEnabledSidebarFilters() {
  const enabled = [];
  document.querySelectorAll('.sidebar-filters .filter-chip').forEach(chip => {
    const input = chip.querySelector('input');
    const type = chip.dataset.type;
    if (input?.checked && type) enabled.push(type);
  });
  return enabled;
}

function renderSidebarLogs() {
  const searchTerm = logsSearchInput?.value?.toLowerCase() || '';
  const enabledTypes = getEnabledSidebarFilters();

  filteredLogs = currentLogs.filter(log => {
    const matchesType = enabledTypes.includes(log.type);
    const text = log.args.join(' ').toLowerCase();
    const matchesSearch = !searchTerm || text.includes(searchTerm);
    return matchesType && matchesSearch;
  });

  // Update sidebar stats
  const stats = { total: filteredLogs.length, log: 0, info: 0, warn: 0, error: 0, debug: 0 };
  filteredLogs.forEach(log => {
    if (stats.hasOwnProperty(log.type)) stats[log.type]++;
  });

  if (sidebarStatTotal) sidebarStatTotal.textContent = stats.total;
  if (sidebarStatLog) sidebarStatLog.textContent = stats.log;
  if (sidebarStatInfo) sidebarStatInfo.textContent = stats.info;
  if (sidebarStatWarn) sidebarStatWarn.textContent = stats.warn;
  if (sidebarStatError) sidebarStatError.textContent = stats.error;
  if (sidebarStatDebug) sidebarStatDebug.textContent = stats.debug;

  if (!sidebarLogs) return;

  if (filteredLogs.length === 0) {
    sidebarLogs.innerHTML = '<div class="sidebar-logs-empty">No logs match your filters</div>';
    return;
  }

  sidebarLogs.innerHTML = filteredLogs.map(log => {
    const text = log.args.join(' ');
    const time = new Date(log.timestamp).toLocaleTimeString();
    return `
      <div class="sidebar-log-item ${log.type}">
        <div class="sidebar-log-meta">
          <span class="sidebar-log-type ${log.type}">${log.type.toUpperCase()}</span>
          <span class="sidebar-log-time">${time}</span>
        </div>
        <div class="sidebar-log-content">${escapeHtml(text)}</div>
      </div>
    `;
  }).join('');
}

// Copy all logs
btnCopyAllLogs?.addEventListener('click', async () => {
  const text = filteredLogs.map(log => `[${log.type.toUpperCase()}] ${log.args.join(' ')}`).join('\n');
  await navigator.clipboard.writeText(text);
  const originalHtml = btnCopyAllLogs.innerHTML;
  btnCopyAllLogs.innerHTML = '<span>Copied!</span>';
  setTimeout(() => { btnCopyAllLogs.innerHTML = originalHtml; }, 1500);
});

// Download logs
btnDownloadLogs?.addEventListener('click', () => {
  const text = filteredLogs.map(log => `[${log.type.toUpperCase()}] ${log.args.join(' ')}`).join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `logs-${currentHash || 'recording'}.txt`;
  a.click();
  URL.revokeObjectURL(url);
});

// ================================================
// Preferences Panel Logic (Slide-up)
// ================================================
function openPreferences() {
  preferencesPanel?.classList.remove('hidden');
  loadPrivacySettings();
}

function closePreferences() {
  preferencesPanel?.classList.add('hidden');
}

btnPreferences?.addEventListener('click', openPreferences);
btnClosePreferences?.addEventListener('click', closePreferences);

async function loadPrivacySettings() {
  const result = await chrome.storage.local.get('bcai_analytics_consent');
  if (analyticsConsent) analyticsConsent.checked = result.bcai_analytics_consent !== false;
}

analyticsConsent?.addEventListener('change', async () => {
  const consent = analyticsConsent.checked;
  await chrome.storage.local.set({ bcai_analytics_consent: consent });
  trackEvent('analytics_consent_changed', { consent });
});

// ================================================
// MCP Tooltip Logic
// ================================================
let tooltipTimeout;

planBadge?.addEventListener('mouseenter', () => {
  if (!mcpTooltip) return;
  tooltipTimeout = setTimeout(() => {
    const rect = planBadge.getBoundingClientRect();
    mcpTooltip.style.top = `${rect.bottom + 8}px`;
    mcpTooltip.style.right = `${window.innerWidth - rect.right}px`;
    if (mcpTooltipStatus) {
      mcpTooltipStatus.textContent = mcpConnected ? 'Connected' : 'Offline';
    }
    if (mcpTooltipText) {
      mcpTooltipText.textContent = mcpConnected ? 'MCP server running' : 'MCP server not running';
    }
    mcpTooltip.classList.remove('hidden');
  }, 500);
});

planBadge?.addEventListener('mouseleave', () => {
  clearTimeout(tooltipTimeout);
  mcpTooltip?.classList.add('hidden');
});

// ================================================
// State Management - Action Block
// ================================================
function showState(state) {
  currentState = state;

  if (!actionTitle || !actionSubtitle || !btnAction || !btnActionText) return;

  if (state === 'idle') {
    actionTitle.textContent = 'Ready to capture';
    actionSubtitle.textContent = 'Start recording to capture console logs';
    btnAction.className = 'btn-action btn-start';
    btnActionIcon.innerHTML = '';
    btnActionText.textContent = 'Start Recording';
    if (previewContent) {
      previewContent.innerHTML = '<div class="preview-placeholder"><span class="preview-placeholder-text">Logs will appear here during recording</span></div>';
    }
  } else if (state === 'recording') {
    actionTitle.innerHTML = '<span class="recording-dot"></span> Recording...';
    actionSubtitle.textContent = 'Capturing console logs';
    btnAction.className = 'btn-action btn-stop';
    btnActionIcon.innerHTML = '<span class="stop-icon"></span>';
    btnActionText.textContent = 'Stop & Save';
  } else if (state === 'saved') {
    actionTitle.textContent = 'Saved locally';
    actionSubtitle.textContent = 'Recording stored — ready for new capture';
    btnAction.className = 'btn-action btn-start';
    btnActionIcon.innerHTML = '';
    btnActionText.textContent = 'Start Recording';
    if (previewContent && currentHash) {
      previewContent.innerHTML = `
        <div class="recording-saved-info">
          <span class="recording-id-label">Recording ID:</span>
          <span class="recording-id-value">${currentHash}</span>
          <button class="btn-copy-id" id="btnCopyId" title="Copy ID">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      `;
      document.getElementById('btnCopyId')?.addEventListener('click', () => {
        navigator.clipboard.writeText(currentHash);
      });
    }
  }
}

// ================================================
// Capture Toggle
// ================================================
function updateCaptureUI(enabled) {
  isCaptureEnabled = enabled;
  if (captureEnabled) captureEnabled.checked = enabled;
  disabledOverlay?.classList.toggle('hidden', enabled);
}

captureEnabled?.addEventListener('change', () => {
  const enabled = captureEnabled.checked;
  updateCaptureUI(enabled);
  chrome.runtime.sendMessage({ action: 'SET_CAPTURE_ENABLED', enabled });
  chrome.storage.local.set({ captureEnabled: enabled });
});

btnEnableCapture?.addEventListener('click', () => {
  if (captureEnabled) {
    captureEnabled.checked = true;
    captureEnabled.dispatchEvent(new Event('change'));
  }
});

// ================================================
// Stats Update
// ================================================
function updateStats(logs) {
  currentLogs = logs;
  const stats = { total: 0, log: 0, info: 0, warn: 0, error: 0, debug: 0 };

  logs.forEach(log => {
    stats.total++;
    if (stats.hasOwnProperty(log.type)) stats[log.type]++;
  });

  if (statTotal) statTotal.textContent = stats.total;
  if (statLog) statLog.textContent = stats.log;
  if (statInfo) statInfo.textContent = stats.info;
  if (statWarn) statWarn.textContent = stats.warn;
  if (statError) statError.textContent = stats.error;
  if (statDebug) statDebug.textContent = stats.debug;
}

// ================================================
// Preview Update
// ================================================
function updatePreview(logs) {
  if (!previewContent) return;

  if (logs.length === 0 && currentState !== 'saved') {
    previewContent.innerHTML = '<div class="preview-placeholder"><span class="preview-placeholder-text">Logs will appear here during recording</span></div>';
    return;
  }

  if (currentState === 'saved') return; // Don't overwrite saved state preview

  const recentLogs = logs.slice(-4);
  previewContent.innerHTML = `
    <div class="preview-logs">
      ${recentLogs.map(log => {
        const text = log.args.join(' ').slice(0, 100);
        return `<div class="preview-log-line ${log.type}">${escapeHtml(text)}</div>`;
      }).join('')}
    </div>
  `;
}

// ================================================
// Recording Logs Update
// ================================================
function updateRecordingLogs(logs) {
  updateStats(logs);
  updatePreview(logs);
}

// ================================================
// License UI
// ================================================
function updateLicenseUI(license, quota) {
  currentLicense = license;
  const isPro = ['pro', 'pro_early'].includes(license.plan) && license.isValid;
  const isTrial = license.plan === 'trial' && license.isValid;

  // Update header badge
  if (planText) {
    if (isTrial) {
      planText.textContent = 'TRIAL';
      planBadge.className = 'plan-badge trial';
    } else if (isPro) {
      planText.textContent = license.plan.toUpperCase().replace('_', ' ');
      planBadge.className = 'plan-badge pro';
    } else {
      planText.textContent = 'FREE';
      planBadge.className = 'plan-badge';
    }
  }

  // Update MCP dot
  if (mcpDot) {
    mcpDot.className = 'mcp-dot ' + (mcpConnected ? 'connected' : 'offline');
  }

  // Update plan info in modal
  if (planInfoValue) {
    planInfoValue.textContent = license.plan.toUpperCase().replace('_', ' ');
  }

  // Update usage in modal
  if (quota && logsQuotaValue) {
    logsQuotaValue.textContent = quota.logs.unlimited
      ? `${quota.logs.current} / Unlimited`
      : `${quota.logs.current} / ${quota.logs.max}`;
  }
  if (quota && recordingsQuotaValue) {
    recordingsQuotaValue.textContent = quota.recordings.unlimited
      ? `${quota.recordings.current} / Unlimited`
      : `${quota.recordings.current} / ${quota.recordings.max}`;
  }

  // Handle trial UI in modal
  if (isTrial) {
    trialSection?.classList.add('hidden');
    trialActiveSection?.classList.remove('hidden');

    if (license.expiresAt && trialDaysRemaining) {
      let expiresAtMs = typeof license.expiresAt === 'string'
        ? new Date(license.expiresAt).getTime()
        : license.expiresAt;
      const daysLeft = Math.ceil((expiresAtMs - Date.now()) / (24 * 60 * 60 * 1000));
      trialDaysRemaining.textContent = Math.max(0, daysLeft);
    }

    const isExtended = license.email && license.email.length > 0;
    extendTrialSection?.classList.toggle('hidden', isExtended);
    if (!isExtended) setupExtendTrialLink();

    btnUpgrade?.classList.remove('hidden');
  } else if (isPro) {
    trialSection?.classList.add('hidden');
    trialActiveSection?.classList.add('hidden');
    extendTrialSection?.classList.add('hidden');
    btnUpgrade?.classList.add('hidden');
  } else {
    // FREE plan - don't call checkTrialAvailability() here
    // Use updateEntitlementsUI() which already has canActivateTrial from backend
    trialActiveSection?.classList.add('hidden');
    extendTrialSection?.classList.add('hidden');
    btnUpgrade?.classList.remove('hidden');
    // Note: trialSection visibility is handled by updateEntitlementsUI()
  }
}

// ================================================
// Trial Logic (DEPRECATED - use updateEntitlementsUI instead)
// This function is kept for backward compatibility but should not make extra requests
// ================================================
async function checkTrialAvailability() {
  // DEPRECATED: This function used to make a separate request to CHECK_TRIAL_STATUS
  // Now we use the canActivateTrial field from /api/entitlements
  // Only refresh entitlements if needed (rare case)
  console.debug('[Sidepanel] checkTrialAvailability called - use updateEntitlementsUI instead');
}

btnStartTrial?.addEventListener('click', () => {
  btnStartTrial.disabled = true;
  btnStartTrial.textContent = 'Activating...';
  trialError?.classList.add('hidden');

  chrome.runtime.sendMessage({ action: 'ACTIVATE_TRIAL' }, async (response) => {
    btnStartTrial.disabled = false;
    btnStartTrial.textContent = 'Start Trial';

    if (response?.success) {
      // Refresh entitlements from backend to get updated state
      await refreshEntitlementsFromBackend();
      hideLimitWarning();
    } else {
      if (trialError) {
        trialError.textContent = response?.message || 'Failed to activate trial';
        trialError.classList.remove('hidden');
      }
      if (response?.error === 'trial_already_used' || response?.error === 'trial_expired') {
        trialSection?.classList.add('hidden');
      }
    }
  });
});

// ================================================
// Extend Trial Logic
// ================================================
let currentInstallationId = null;
let lastSentEmail = null;

async function setupExtendTrialLink() {
  try {
    currentInstallationId = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'GET_INSTALLATION_ID' }, (response) => {
        resolve(response?.installationId || '');
      });
    });
  } catch (error) {
    console.error('[Sidepanel] Failed to setup extend trial:', error);
  }
}

btnSendMagicLink?.addEventListener('click', handleSendMagicLink);
extendEmail?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSendMagicLink();
});

async function handleSendMagicLink() {
  const email = extendEmail?.value?.trim() || lastSentEmail;
  if (!email || !isValidEmail(email)) {
    showExtendError('Please enter a valid email');
    return;
  }
  if (!currentInstallationId) {
    showExtendError('Unable to identify installation. Please reload.');
    return;
  }

  btnSendMagicLink.disabled = true;
  btnSendMagicLink.textContent = 'Sending...';
  extendError?.classList.add('hidden');
  lastSentEmail = email;

  try {
    const response = await fetch('https://browserconsoleai.com/api/license/extend-trial-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, installationId: currentInstallationId }),
    });

    const data = await response.json();

    btnSendMagicLink.disabled = false;
    btnSendMagicLink.textContent = 'Send';

    if (data.success) {
      extendSent?.classList.remove('hidden');
      trackEvent('extend_trial_email_sent', { email: email.split('@')[1] });
    } else {
      showExtendError(data.message || 'Failed to send magic link');
    }
  } catch (error) {
    btnSendMagicLink.disabled = false;
    btnSendMagicLink.textContent = 'Send';
    showExtendError('Network error. Please try again.');
  }
}

btnConfirmCode?.addEventListener('click', handleConfirmCode);
confirmCode?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleConfirmCode();
});
confirmCode?.addEventListener('input', (e) => {
  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
});

async function handleConfirmCode() {
  const code = confirmCode?.value?.trim();
  if (!code || code.length !== 6) {
    showCodeError('Code must be 6 characters');
    return;
  }
  if (!currentInstallationId) {
    showCodeError('Unable to identify installation. Please reload.');
    return;
  }

  btnConfirmCode.disabled = true;
  codeError?.classList.add('hidden');

  try {
    const response = await fetch('https://browserconsoleai.com/api/license/confirm-link-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, installationId: currentInstallationId }),
    });

    const data = await response.json();
    btnConfirmCode.disabled = false;

    if (data.success && data.licenseToken) {
      chrome.runtime.sendMessage({ action: 'SAVE_LICENSE_TOKEN', token: data.licenseToken }, async (result) => {
        if (result?.success) {
          // Refresh entitlements from backend to get updated state
          await refreshEntitlementsFromBackend();
          extendTrialSection?.classList.add('hidden');
          if (confirmCode) confirmCode.value = '';
          trackEvent('trial_extended', { method: 'one_time_code' });
        } else {
          showCodeError('Failed to save token. Please try again.');
        }
      });
    } else {
      showCodeError(data.message || 'Invalid code');
    }
  } catch (error) {
    btnConfirmCode.disabled = false;
    showCodeError('Network error. Please try again.');
  }
}

btnResendLink?.addEventListener('click', () => {
  extendSent?.classList.add('hidden');
  handleSendMagicLink();
});

function showExtendError(message) {
  if (extendError) {
    extendError.textContent = message;
    extendError.classList.remove('hidden');
  }
}

function showCodeError(message) {
  if (codeError) {
    codeError.textContent = message;
    codeError.classList.remove('hidden');
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Token activation (manual - for backward compatibility)
btnActivate?.addEventListener('click', () => {
  const token = licenseToken?.value?.trim();
  if (!token) return;

  btnActivate.disabled = true;
  btnActivate.textContent = 'Activating...';
  tokenError?.classList.add('hidden');

  chrome.runtime.sendMessage({ action: 'SET_LICENSE_TOKEN', token }, async (response) => {
    btnActivate.disabled = false;
    btnActivate.textContent = 'Activate';

    if (response?.success) {
      if (licenseToken) licenseToken.value = '';
      // Refresh entitlements from backend to get updated state
      await refreshEntitlementsFromBackend();
      hideLimitWarning();
    } else {
      if (tokenError) {
        tokenError.textContent = response?.error || 'Invalid or expired token';
        tokenError.classList.remove('hidden');
      }
    }
  });
});

// ================================================
// Limit Banner
// ================================================
function showLimitWarning(type, max) {
  let message = type === 'logs'
    ? `Log limit reached (${max}). Upgrade for unlimited.`
    : `Recording limit reached (${max}). Upgrade for unlimited.`;

  if (limitBannerText) limitBannerText.textContent = message;
  limitBanner?.classList.remove('hidden');
}

function hideLimitWarning() {
  limitBanner?.classList.add('hidden');
}

// ================================================
// Refresh License
// ================================================
async function refreshLicense() {
  chrome.runtime.sendMessage({ action: 'GET_LICENSE' }, (response) => {
    if (response) {
      updateLicenseUI(response.license, response.quota);
    }
  });
}

// ================================================
// Server Status
// ================================================
function updateStatus(connected) {
  mcpConnected = connected;
  if (mcpDot) {
    mcpDot.className = 'mcp-dot ' + (connected ? 'connected' : 'offline');
  }
  // Update output badge
  if (outputBadge) {
    outputBadge.textContent = connected ? 'Connected' : 'Offline';
    outputBadge.className = 'accordion-badge mcp-status-badge ' + (connected ? 'connected' : '');
  }
}

// ================================================
// Recordings History
// ================================================
function renderRecordingsHistory(recordings) {
  if (isEditingName) return;

  // Update badge count
  if (recordingsCount) {
    recordingsCount.textContent = recordings?.length || 0;
  }

  if (!recordingsList) return;

  if (!recordings || recordings.length === 0) {
    recordingsList.innerHTML = '<div class="empty-state">No recordings yet</div>';
    return;
  }

  recordingsList.innerHTML = recordings.map(rec => {
    const name = recordingNames[rec.id] || '';
    const displayName = name || rec.id;

    return `
      <div class="recording-item" data-id="${rec.id}">
        <div class="recording-item-info">
          <div class="recording-item-header">
            <span class="recording-item-name">${escapeHtml(displayName)}</span>
            <span class="recording-item-status ${rec.sentToMcp ? 'sent' : 'local'}">${rec.sentToMcp ? 'MCP' : 'Local'}</span>
          </div>
          <div class="recording-item-meta">
            <span>${rec.count} logs</span>
            <span>•</span>
            <span>${formatTimeAgo(rec.timestamp)}</span>
          </div>
        </div>
        <div class="recording-item-actions">
          <button class="btn-icon btn-copy-rec" title="Copy logs" data-id="${rec.id}" ${!rec.sentToMcp ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="btn-icon btn-delete-rec" title="Delete" data-id="${rec.id}">
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
  recordingsList.querySelectorAll('.btn-copy-rec').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      try {
        const response = await fetch(`${SERVER_URL}/logs?recordingId=${id}&format=plain&compressObjects=true&showSource=true`);
        const text = await response.text();
        await navigator.clipboard.writeText(text);
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 1000);
        trackEvent('copy_recording', { recordingId: id });
      } catch (err) {
        console.error('Failed to copy logs:', err);
      }
    });
  });

  recordingsList.querySelectorAll('.btn-delete-rec').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const name = recordingNames[id] || id;
      const confirmed = await showConfirmDialog(`Delete "${name}"?`);
      if (confirmed) deleteRecording(id);
    });
  });
}

async function deleteRecording(id) {
  delete recordingNames[id];
  await saveRecordingNames();
  chrome.runtime.sendMessage({ action: 'DELETE_RECORDING', recordingId: id }, refreshStatus);
}

// ================================================
// Recording Names (Session Storage)
// ================================================
async function loadRecordingNames() {
  const result = await chrome.storage.session.get('recordingNames');
  recordingNames = result.recordingNames || {};
}

async function saveRecordingNames() {
  await chrome.storage.session.set({ recordingNames });
}

// ================================================
// Dialog
// ================================================
function showConfirmDialog(message) {
  return new Promise((resolve) => {
    if (dialogMessage) dialogMessage.textContent = message;
    dialogOverlay?.classList.remove('hidden');
    deleteCallback = resolve;
  });
}

function hideConfirmDialog() {
  dialogOverlay?.classList.add('hidden');
  deleteCallback = null;
}

dialogCancel?.addEventListener('click', () => {
  if (deleteCallback) deleteCallback(false);
  hideConfirmDialog();
});

dialogConfirm?.addEventListener('click', () => {
  if (deleteCallback) deleteCallback(true);
  hideConfirmDialog();
});

dialogOverlay?.addEventListener('click', (e) => {
  if (e.target === dialogOverlay) {
    if (deleteCallback) deleteCallback(false);
    hideConfirmDialog();
  }
});

// ================================================
// Utility Functions
// ================================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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

function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ================================================
// Refresh Status
// ================================================
async function refreshStatus() {
  if (isEditingName) return;

  chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (response) => {
    if (response) {
      updateStatus(response.connected);

      if (response.captureEnabled !== undefined) {
        updateCaptureUI(response.captureEnabled);
      }

      if (response.isRecording && currentState !== 'recording') {
        showState('recording');
      }

      if (response.isRecording || currentState === 'recording') {
        updateRecordingLogs(response.recordingLogs || []);
      } else if (currentState === 'idle') {
        updateStats([]);
      }
    }
  });

  chrome.runtime.sendMessage({ action: 'GET_RECORDINGS_HISTORY' }, (response) => {
    if (response?.recordings) {
      renderRecordingsHistory(response.recordings);
    }
  });
}

// ================================================
// Recording Actions - Main Button
// ================================================
btnAction?.addEventListener('click', () => {
  if (currentState === 'recording') {
    // Stop recording
    chrome.runtime.sendMessage({ action: 'STOP_RECORDING' }, (response) => {
      if (response?.hash) {
        currentHash = response.hash;
        showState('saved');
        refreshStatus();
        refreshLicense();
      }
    });
  } else {
    // Start recording
    hideLimitWarning();
    chrome.runtime.sendMessage({ action: 'START_RECORDING' }, (response) => {
      if (response?.started) {
        showState('recording');
        updateRecordingLogs([]);
      } else if (response?.error === 'recording_limit') {
        showLimitWarning('recordings', response.max);
      }
    });
  }
});

// ================================================
// Settings
// ================================================
async function loadSettings() {
  const captureResult = await chrome.storage.local.get('captureEnabled');
  const captureState = captureResult.captureEnabled !== false;
  updateCaptureUI(captureState);
  chrome.runtime.sendMessage({ action: 'SET_CAPTURE_ENABLED', enabled: captureState });

  const result = await chrome.storage.local.get('settings');
  const settings = result.settings || {};

  // Capture settings
  if (includePatterns) includePatterns.value = settings.includePatterns || '';
  if (excludePatterns) excludePatterns.value = settings.excludePatterns || '';
  if (filterLog) filterLog.checked = settings.filterLog !== false;
  if (filterInfo) filterInfo.checked = settings.filterInfo !== false;
  if (filterWarn) filterWarn.checked = settings.filterWarn !== false;
  if (filterError) filterError.checked = settings.filterError !== false;
  if (filterDebug) filterDebug.checked = settings.filterDebug !== false;

  // MCP Output settings
  if (compactMode) compactMode.checked = settings.compactMode || false;
  if (compressObjects) compressObjects.checked = settings.compressObjects !== false;
  if (plainTextFormat) plainTextFormat.checked = settings.plainTextFormat !== false;
  if (showSourceInPlain) showSourceInPlain.checked = settings.showSourceInPlain !== false;
  if (propId) propId.checked = settings.propId || false;
  if (propSessionId) propSessionId.checked = settings.propSessionId || false;
  if (propRecordingId) propRecordingId.checked = settings.propRecordingId || false;
  if (propTimestamp) propTimestamp.checked = settings.propTimestamp || false;
  if (propUrl) propUrl.checked = settings.propUrl || false;

  updateOutputPreview();
  updateCaptureBadge();
  saveSettings();
}

async function saveSettings() {
  const settings = {
    includePatterns: includePatterns?.value || '',
    excludePatterns: excludePatterns?.value || '',
    filterLog: filterLog?.checked !== false,
    filterInfo: filterInfo?.checked !== false,
    filterWarn: filterWarn?.checked !== false,
    filterError: filterError?.checked !== false,
    filterDebug: filterDebug?.checked !== false,
    compactMode: compactMode?.checked || false,
    compressObjects: compressObjects?.checked !== false,
    plainTextFormat: plainTextFormat?.checked !== false,
    showSourceInPlain: showSourceInPlain?.checked !== false,
    propId: propId?.checked || false,
    propSessionId: propSessionId?.checked || false,
    propRecordingId: propRecordingId?.checked || false,
    propTimestamp: propTimestamp?.checked || false,
    propUrl: propUrl?.checked || false
  };

  await chrome.storage.local.set({ settings });
  chrome.runtime.sendMessage({ action: 'SETTINGS_UPDATED', settings });
}

function updateCaptureBadge() {
  if (!captureBadge) return;
  const hasCustomFilters = includePatterns?.value || excludePatterns?.value ||
    !filterLog?.checked || !filterInfo?.checked || !filterWarn?.checked ||
    !filterError?.checked || !filterDebug?.checked;

  captureBadge.textContent = hasCustomFilters ? 'Custom' : 'Default';
}

function updateOutputPreview() {
  if (!outputPreview) return;

  const sampleArgs = '[Store] Cache saved {"key":"products_cache_very_long_data"}';
  let text = sampleArgs;

  if (compressObjects?.checked) {
    text = '[Store] Cache saved {"key":"..."}';
  }

  const parts = ['[log]', text];
  if (showSourceInPlain?.checked) parts.push('{file.ts:42}');

  outputPreview.textContent = parts.join(' ');
}

// Settings event listeners
[filterLog, filterInfo, filterWarn, filterError, filterDebug].forEach(el => {
  el?.addEventListener('change', () => { saveSettings(); updateCaptureBadge(); });
});

[includePatterns, excludePatterns].forEach(el => {
  el?.addEventListener('input', debounce(() => { saveSettings(); updateCaptureBadge(); }, 500));
});

[compactMode, compressObjects, plainTextFormat, showSourceInPlain, propId, propSessionId, propRecordingId, propTimestamp, propUrl].forEach(el => {
  el?.addEventListener('change', () => { saveSettings(); updateOutputPreview(); });
});

// ================================================
// Messages from Background
// ================================================
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'RECORDING_UPDATE' && currentState === 'recording') {
    updateRecordingLogs(message.logs || []);
  }
  if (message.action === 'LIMIT_REACHED') {
    showLimitWarning(message.type, message.max);
    refreshLicense();
  }
});

// ================================================
// Firebase Auth Integration
// ================================================
function updateAccountUI(user) {
  if (user && !user.isAnonymous) {
    accountAnonymous?.classList.add('hidden');
    accountSignedIn?.classList.remove('hidden');

    if (accountAvatar && user.photoURL) {
      accountAvatar.src = user.photoURL;
      accountAvatar.style.display = 'block';
    }
    if (accountName) accountName.textContent = user.displayName || 'User';
    if (accountEmail) accountEmail.textContent = user.email || '';
  } else {
    accountAnonymous?.classList.remove('hidden');
    accountSignedIn?.classList.add('hidden');
  }
}

async function initializeAuth() {
  if (typeof AuthManager === 'undefined') {
    setTimeout(initializeAuth, 100);
    return;
  }

  try {
    AuthManager.initializeFirebase();
    AuthManager.onAuthStateChanged(async (user) => {
      updateAccountUI(user);
      // Refresh entitlements from backend when auth state changes
      await refreshEntitlementsFromBackend();
    });
    await AuthManager.ensureSignedIn();
  } catch (error) {
    console.error('[Sidepanel] Failed to initialize auth:', error);
  }
}

btnGoogleSignIn?.addEventListener('click', async () => {
  if (typeof AuthManager === 'undefined') return;

  btnGoogleSignIn.disabled = true;
  btnGoogleSignIn.textContent = 'Signing in...';

  try {
    await AuthManager.signInWithGoogle();
    // Refresh entitlements from backend with new auth state
    await refreshEntitlementsFromBackend();
    trackEvent('auth_google_signin');
  } catch (error) {
    if (error.code !== 'auth/popup-closed-by-user') {
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

btnSignOut?.addEventListener('click', async () => {
  if (typeof AuthManager === 'undefined') return;

  try {
    await AuthManager.signOut();
    await AuthManager.signInAnonymously();
    // Refresh entitlements from backend (will get FREE plan now)
    await refreshEntitlementsFromBackend();
    trackEvent('auth_signout');
  } catch (error) {
    console.error('[Sidepanel] Sign out failed:', error);
  }
});

// ================================================
// Initialize
// ================================================
showState('idle');
loadSettings();
loadRecordingNames();
refreshStatus();
// Initial entitlements refresh from backend
refreshEntitlementsFromBackend();
initializeAuth();
trackEvent('sidepanel_opened');

// Periodic refresh (status every 3s, entitlements every 5 min)
setInterval(refreshStatus, 3000);
setInterval(refreshEntitlementsFromBackend, 5 * 60 * 1000);
