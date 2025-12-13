// License Management Module
// Handles JWT token storage, validation, and plan limits

const LICENSE_STORAGE_KEY = 'bcai_license_token';
const PLAN_LIMITS = {
  free: {
    maxLogsPerRecording: 100,
    maxRecordings: 5,
    canUseMCP: false,
    canExport: false,
    formats: ['plain']
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

// Export functions for use in service worker and sidepanel
if (typeof window !== 'undefined') {
  window.LicenseManager = {
    getLicenseInfo,
    saveLicenseToken,
    removeLicenseToken,
    checkLimit,
    getRemainingQuota,
    PLAN_LIMITS
  };
}

// For service worker (non-window context)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.LicenseManager = {
    getLicenseInfo,
    saveLicenseToken,
    removeLicenseToken,
    checkLimit,
    getRemainingQuota,
    PLAN_LIMITS
  };
}
