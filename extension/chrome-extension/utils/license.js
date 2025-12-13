// License Management Module
// Handles JWT token storage, validation, and plan limits

const LICENSE_STORAGE_KEY = 'bcai_license_token';
const INSTALLATION_ID_KEY = 'bcai_installation_id';
const VERIFICATION_CACHE_KEY = 'bcai_verification_cache';
const VERIFICATION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const OFFLINE_GRACE_PERIOD = 24 * 60 * 60 * 1000; // 24 hours
const API_BASE_URL = 'https://browserconsoleai.com';

const PLAN_LIMITS = {
  free: {
    maxLogsPerRecording: 100,
    maxRecordings: 5,
    canUseMCP: false,
    canExport: false,
    formats: ['plain']
  },
  trial: {
    maxLogsPerRecording: Infinity,
    maxRecordings: Infinity,
    canUseMCP: true,
    canExport: true,
    formats: ['plain', 'json', 'toon']
  },
  pro: {
    maxLogsPerRecording: Infinity,
    maxRecordings: Infinity,
    canUseMCP: true,
    canExport: true,
    formats: ['plain', 'json', 'toon']
  },
  pro_early: {
    maxLogsPerRecording: Infinity,
    maxRecordings: Infinity,
    canUseMCP: true,
    canExport: true,
    formats: ['plain', 'json', 'toon']
  }
};

// Decode JWT without verification (client-side check only)
// Real verification happens on MCP server
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    console.error('[License] Failed to decode JWT:', e);
    return null;
  }
}

// Check if token is expired
function isTokenExpired(payload) {
  if (!payload || !payload.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

// Get current license info
async function getLicenseInfo() {
  const result = await chrome.storage.local.get(LICENSE_STORAGE_KEY);
  const token = result[LICENSE_STORAGE_KEY];

  if (!token) {
    return {
      plan: 'free',
      isValid: false,
      token: null,
      email: null,
      expiresAt: null,
      limits: PLAN_LIMITS.free
    };
  }

  const payload = decodeJWT(token);

  if (!payload || isTokenExpired(payload)) {
    return {
      plan: 'free',
      isValid: false,
      token: token,
      email: payload?.email || null,
      expiresAt: payload?.exp ? new Date(payload.exp * 1000) : null,
      expired: true,
      limits: PLAN_LIMITS.free
    };
  }

  const plan = payload.plan || 'free';

  return {
    plan: plan,
    isValid: true,
    token: token,
    email: payload.email || null,
    userId: payload.sub || null,
    expiresAt: new Date(payload.exp * 1000),
    limits: PLAN_LIMITS[plan] || PLAN_LIMITS.free
  };
}

// Save license token
async function saveLicenseToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token');
  }

  const payload = decodeJWT(token);
  if (!payload) {
    throw new Error('Could not decode token');
  }

  if (isTokenExpired(payload)) {
    throw new Error('Token is expired');
  }

  await chrome.storage.local.set({ [LICENSE_STORAGE_KEY]: token });

  return {
    plan: payload.plan || 'free',
    email: payload.email,
    expiresAt: new Date(payload.exp * 1000)
  };
}

// Remove license token
async function removeLicenseToken() {
  await chrome.storage.local.remove(LICENSE_STORAGE_KEY);
}

// Check if action is allowed based on plan
async function checkLimit(action, currentCount = 0) {
  const license = await getLicenseInfo();
  const limits = license.limits;

  switch (action) {
    case 'addLog':
      return currentCount < limits.maxLogsPerRecording;
    case 'createRecording':
      return currentCount < limits.maxRecordings;
    case 'useMCP':
      return limits.canUseMCP;
    case 'export':
      return limits.canExport;
    case 'useFormat':
      return (format) => limits.formats.includes(format);
    default:
      return true;
  }
}

// Get remaining quota
async function getRemainingQuota(currentLogs, currentRecordings) {
  const license = await getLicenseInfo();
  const limits = license.limits;

  return {
    plan: license.plan,
    logs: {
      current: currentLogs,
      max: limits.maxLogsPerRecording,
      remaining: Math.max(0, limits.maxLogsPerRecording - currentLogs),
      unlimited: limits.maxLogsPerRecording === Infinity
    },
    recordings: {
      current: currentRecordings,
      max: limits.maxRecordings,
      remaining: Math.max(0, limits.maxRecordings - currentRecordings),
      unlimited: limits.maxRecordings === Infinity
    },
    features: {
      mcp: limits.canUseMCP,
      export: limits.canExport,
      formats: limits.formats
    }
  };
}

// === Device Fingerprinting ===

// Get or create installation ID
async function getInstallationId() {
  const result = await chrome.storage.local.get(INSTALLATION_ID_KEY);

  if (result[INSTALLATION_ID_KEY]) {
    return result[INSTALLATION_ID_KEY];
  }

  // Generate new UUID v4
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ [INSTALLATION_ID_KEY]: id });
  return id;
}

// Get device fingerprint
async function getDeviceFingerprint() {
  const installationId = await getInstallationId();
  const ua = navigator.userAgent;

  // Parse browser
  let browser = 'unknown';
  let browserVersion = '';
  if (ua.includes('Chrome/')) {
    browser = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Firefox/')) {
    browser = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Safari/')) {
    browser = 'Safari';
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Edg/')) {
    browser = 'Edge';
    browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || '';
  }

  // Parse OS
  let os = 'unknown';
  let osVersion = '';
  if (ua.includes('Windows')) {
    os = 'Windows';
    osVersion = ua.match(/Windows NT (\d+\.\d+)/)?.[1] || '';
  } else if (ua.includes('Mac OS X')) {
    os = 'macOS';
    osVersion = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
    osVersion = ua.match(/Android (\d+)/)?.[1] || '';
  } else if (ua.includes('iOS')) {
    os = 'iOS';
  }

  // Screen class (screen not available in service worker)
  let screenClass = 'unknown';
  if (typeof screen !== 'undefined') {
    const width = screen.width;
    if (width < 768) screenClass = 'small';
    else if (width >= 768 && width < 1024) screenClass = 'medium';
    else if (width >= 1024 && width < 1440) screenClass = 'large';
    else screenClass = 'xlarge';
  }

  return {
    installationId,
    browser,
    browserVersion,
    os,
    osVersion,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    screenClass,
  };
}

// === Trial Activation ===

// Check if trial can be activated
async function canActivateTrial() {
  const installationId = await getInstallationId();

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/license/activate-trial?installationId=${installationId}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.debug('[License] Failed to check trial status:', error);
    return { canActivate: true, hasTrialed: false }; // Optimistic default
  }
}

// Activate trial
async function activateTrial() {
  const fingerprint = await getDeviceFingerprint();

  try {
    const response = await fetch(`${API_BASE_URL}/api/license/activate-trial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprint }),
    });

    const data = await response.json();

    if (data.success && data.token) {
      await saveLicenseToken(data.token);
      return {
        success: true,
        expiresAt: data.expiresAt,
        daysRemaining: data.daysRemaining,
      };
    }

    return {
      success: false,
      error: data.error || 'Unknown error',
      message: data.message,
    };
  } catch (error) {
    console.error('[License] Failed to activate trial:', error);
    return {
      success: false,
      error: 'network_error',
      message: 'Could not connect to server. Check your internet connection.',
    };
  }
}

// === On-Demand Verification ===

// Get cached verification result
async function getCachedVerification() {
  const result = await chrome.storage.local.get(VERIFICATION_CACHE_KEY);
  const cache = result[VERIFICATION_CACHE_KEY];

  if (!cache) return null;

  // Check if cache is still valid
  if (Date.now() - cache.timestamp < VERIFICATION_CACHE_TTL) {
    return cache.result;
  }

  return null;
}

// Save verification to cache
async function cacheVerification(result) {
  await chrome.storage.local.set({
    [VERIFICATION_CACHE_KEY]: {
      result,
      timestamp: Date.now(),
    }
  });
}

// Verify license online (on-demand)
async function verifyLicenseOnline(token) {
  // Check cache first
  const cached = await getCachedVerification();
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    const result = {
      valid: data.valid,
      reason: data.reason,
      payload: data.payload,
      verifiedAt: Date.now(),
    };

    // Cache the result
    await cacheVerification(result);

    return result;
  } catch (error) {
    console.debug('[License] Online verification failed:', error);

    // Check offline grace period
    const result = await chrome.storage.local.get('bcai_last_successful_verification');
    const lastVerification = result.bcai_last_successful_verification;

    if (lastVerification && Date.now() - lastVerification < OFFLINE_GRACE_PERIOD) {
      // Within grace period, trust local token
      return {
        valid: true,
        reason: 'offline_grace',
        offlineMode: true,
      };
    }

    // Beyond grace period, fallback to local validation only
    return {
      valid: false,
      reason: 'offline_expired',
      offlineMode: true,
    };
  }
}

// Clear verification cache (call when token changes)
async function clearVerificationCache() {
  await chrome.storage.local.remove(VERIFICATION_CACHE_KEY);
}

// Export functions for use in service worker and sidepanel
const LicenseManagerExports = {
  getLicenseInfo,
  saveLicenseToken,
  removeLicenseToken,
  checkLimit,
  getRemainingQuota,
  getInstallationId,
  getDeviceFingerprint,
  canActivateTrial,
  activateTrial,
  verifyLicenseOnline,
  clearVerificationCache,
  PLAN_LIMITS
};

if (typeof window !== 'undefined') {
  window.LicenseManager = LicenseManagerExports;
}

// For service worker (non-window context)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.LicenseManager = LicenseManagerExports;
}
