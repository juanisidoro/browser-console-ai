// Analytics Module
// Tracks events for Browser Console AI metrics
// Note: Uses LicenseManager.getInstallationId() from license.js (loaded first)
//
// Privacy: Respects user consent preferences
// - Essential events: Always sent (license verification, critical errors)
// - Non-essential events: Only sent if user has consented

const ANALYTICS_ENDPOINT = 'https://browserconsoleai.com/api/analytics';

// Events that are essential for the product to work (always tracked)
const ESSENTIAL_EVENTS = [
  'extension_installed',       // Need to know for support
  'extension_updated',         // Need to know for support
  'trial_activated',           // License management
  'trial_extended',            // License management
  'license_verified',          // License management
  'error_occurred',            // Critical for fixing bugs
  'subscription_created',      // Business essential
  'subscription_cancelled',    // Business essential
  'analytics_consent_changed', // Privacy compliance
];

// Get analytics consent status
async function getAnalyticsConsent() {
  const result = await chrome.storage.local.get('bcai_analytics_consent');
  // Default to true for existing users, but new users should explicitly consent
  // We'll show the privacy notice on first run
  return result.bcai_analytics_consent !== false;
}

// Set analytics consent
async function setAnalyticsConsent(consent) {
  await chrome.storage.local.set({ bcai_analytics_consent: consent });
}

// Check if an event is essential (doesn't require consent)
function isEssentialEvent(event) {
  return ESSENTIAL_EVENTS.includes(event);
}

// Get installation ID from LicenseManager (avoids duplicate declarations)
async function getAnalyticsInstallationId() {
  // LicenseManager is loaded before analytics.js in service worker
  if (typeof LicenseManager !== 'undefined' && LicenseManager.getInstallationId) {
    return LicenseManager.getInstallationId();
  }
  // Fallback for contexts where LicenseManager isn't available
  const INSTALLATION_ID_KEY = 'bcai_installation_id';
  const result = await chrome.storage.local.get(INSTALLATION_ID_KEY);
  if (result[INSTALLATION_ID_KEY]) {
    return result[INSTALLATION_ID_KEY];
  }
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ [INSTALLATION_ID_KEY]: id });
  return id;
}

// Get device metadata
function getMetadata() {
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

  // Device type
  const deviceType = /Mobile|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';

  return {
    version: chrome.runtime.getManifest().version,
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
    screenClass,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };
}

// Track an event (fire and forget)
// Respects user consent for non-essential events
async function trackEvent(event, data = {}) {
  try {
    // Check if this is a non-essential event and user hasn't consented
    if (!isEssentialEvent(event)) {
      const hasConsent = await getAnalyticsConsent();
      if (!hasConsent) {
        console.debug('[Analytics] Skipped (no consent):', event);
        return;
      }
    }

    const installationId = await getAnalyticsInstallationId();
    const metadata = getMetadata();

    // Get userId from Firebase Auth (anonymous or registered)
    // In extension, userId should NEVER be null - we always have at least an anonymous user
    let userId = null;

    // First, try to get from AuthManager (preferred - Firebase UID)
    if (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUserId) {
      userId = await AuthManager.getCurrentUserId();
    }

    // Fallback: try to get from stored auth state
    if (!userId) {
      const authResult = await chrome.storage.local.get('bcai_firebase_user');
      if (authResult.bcai_firebase_user?.uid) {
        userId = authResult.bcai_firebase_user.uid;
      }
    }

    // Legacy fallback: get from JWT token (for pro users)
    if (!userId) {
      const licenseResult = await chrome.storage.local.get('bcai_license_token');
      if (licenseResult.bcai_license_token) {
        try {
          const parts = licenseResult.bcai_license_token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            // Use explicit userId field if present
            userId = payload.userId || null;
            // For pro/pro_early plans, 'sub' is the Firebase UID
            if (!userId && payload.plan && payload.plan !== 'trial' && payload.plan !== 'free') {
              userId = payload.sub || null;
            }
          }
        } catch (e) {
          // Ignore decode errors
        }
      }
    }

    const payload = {
      event,
      installationId,
      userId, // May still be null for very first events before auth initializes
      timestamp: Date.now(),
      data: Object.keys(data).length > 0 ? data : undefined,
      metadata,
    };

    // Fire and forget - don't await, don't block
    fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silent fail - analytics should never block functionality
    });

    console.debug('[Analytics] Tracked:', event, userId ? `(uid: ${userId.slice(0, 8)}...)` : '(no uid yet)');
  } catch (error) {
    // Silent fail
    console.warn('[Analytics] Failed to track:', event, error);
  }
}

// Track extension install
async function trackInstall() {
  const result = await chrome.storage.local.get('bcai_install_tracked');
  if (!result.bcai_install_tracked) {
    await trackEvent('extension_installed');
    await chrome.storage.local.set({ bcai_install_tracked: true });
  }
}

// Track extension update
async function trackUpdate(previousVersion) {
  await trackEvent('extension_updated', {
    previousVersion,
    newVersion: chrome.runtime.getManifest().version,
  });
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.Analytics = {
    trackEvent,
    trackInstall,
    trackUpdate,
    getInstallationId: getAnalyticsInstallationId,
    getConsent: getAnalyticsConsent,
    setConsent: setAnalyticsConsent,
    ESSENTIAL_EVENTS,
  };
}

// For service worker context
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.Analytics = {
    trackEvent,
    trackInstall,
    trackUpdate,
    getInstallationId: getAnalyticsInstallationId,
    getConsent: getAnalyticsConsent,
    setConsent: setAnalyticsConsent,
    ESSENTIAL_EVENTS,
  };
}
