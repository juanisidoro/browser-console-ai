// Authentication Module for Browser Console AI Extension
//
// Handles Firebase Auth with anonymous-first approach:
// 1. On install/first open: signInAnonymously() to get a userId
// 2. User can link account later with Google or Email
// 3. Linking preserves the same userId for continuous tracking
//
// Uses Firebase SDK v9+ modular syntax loaded via CDN in sidepanel.html

const AUTH_STATE_KEY = 'bcai_auth_state';
const AUTH_USER_KEY = 'bcai_firebase_user';

// Firebase instances (set after SDK loads)
let firebaseApp = null;
let firebaseAuth = null;

// Auth state
let currentUser = null;
let authStateListeners = [];

// ================================================
// Firebase Initialization
// ================================================

// Initialize Firebase (call after SDK is loaded)
function initializeFirebase() {
  if (firebaseApp) {
    console.log('[Auth] Firebase already initialized');
    return;
  }

  console.log('[Auth] Checking Firebase SDK...');
  console.log('[Auth] firebase defined:', typeof firebase !== 'undefined');
  console.log('[Auth] FIREBASE_CONFIG defined:', typeof FIREBASE_CONFIG !== 'undefined');

  if (typeof firebase === 'undefined') {
    console.error('[Auth] Firebase SDK not loaded - check lib/firebase-*.js files');
    return;
  }

  if (typeof FIREBASE_CONFIG === 'undefined') {
    console.error('[Auth] Firebase config not loaded - check utils/firebase-config.js');
    return;
  }

  console.log('[Auth] Firebase config projectId:', FIREBASE_CONFIG.projectId);

  try {
    // Check if already initialized
    if (firebase.apps && firebase.apps.length > 0) {
      firebaseApp = firebase.apps[0];
    } else {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    }

    firebaseAuth = firebase.auth();

    // Listen for auth state changes
    firebaseAuth.onAuthStateChanged(handleAuthStateChange);

    console.log('[Auth] Firebase initialized');
  } catch (error) {
    console.error('[Auth] Failed to initialize Firebase:', error);
  }
}

// ================================================
// Auth State Management
// ================================================

// Handle auth state changes
async function handleAuthStateChange(user) {
  const previousUser = currentUser;
  currentUser = user;

  if (user) {
    // Save minimal user info to storage for offline access
    await chrome.storage.local.set({
      [AUTH_USER_KEY]: {
        uid: user.uid,
        email: user.email,
        isAnonymous: user.isAnonymous,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }
    });

    console.log('[Auth] User signed in:', user.uid, user.isAnonymous ? '(anonymous)' : '');

    // Sync onboarding progress when a real (non-anonymous) user logs in
    // Only do this on transition from anonymous/no-user to real user
    const wasAnonymousOrNoUser = !previousUser || previousUser.isAnonymous;
    const isNowRealUser = !user.isAnonymous;

    if (wasAnonymousOrNoUser && isNowRealUser) {
      console.log('[Auth] Real user logged in, syncing onboarding progress...');
      // Delay slightly to ensure Analytics is ready
      setTimeout(() => {
        if (typeof Analytics !== 'undefined' && Analytics.syncOnboardingProgress) {
          Analytics.syncOnboardingProgress();
        }
      }, 500);
    }
  } else {
    await chrome.storage.local.remove(AUTH_USER_KEY);
    console.log('[Auth] User signed out');
  }

  // Notify listeners
  authStateListeners.forEach(listener => listener(user));

  // Clear entitlements cache when auth changes
  if (typeof LicenseManager !== 'undefined' && LicenseManager.clearEntitlementsCache) {
    await LicenseManager.clearEntitlementsCache();
  }
}

// Add auth state listener
function onAuthStateChanged(callback) {
  authStateListeners.push(callback);

  // Call immediately with current state
  if (currentUser !== null || firebaseAuth) {
    callback(currentUser);
  }

  // Return unsubscribe function
  return () => {
    authStateListeners = authStateListeners.filter(l => l !== callback);
  };
}

// Get current user
function getCurrentUser() {
  return currentUser;
}

// Get current user ID (always available after initialization)
async function getCurrentUserId() {
  if (currentUser) {
    return currentUser.uid;
  }

  // Try to get from storage if not signed in yet
  const result = await chrome.storage.local.get(AUTH_USER_KEY);
  return result[AUTH_USER_KEY]?.uid || null;
}

// Check if user is anonymous
function isAnonymous() {
  return currentUser?.isAnonymous ?? true;
}

// ================================================
// Anonymous Authentication (used on first launch)
// ================================================

// Ensure user is signed in (anonymous if no account)
async function ensureSignedIn() {
  if (!firebaseAuth) {
    console.error('[Auth] Firebase not initialized');
    return null;
  }

  // If already signed in, return current user
  if (currentUser) {
    return currentUser;
  }

  // Wait for auth state to settle
  return new Promise((resolve) => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      unsubscribe();

      if (user) {
        resolve(user);
      } else {
        // No user, sign in anonymously
        signInAnonymously().then(resolve);
      }
    });
  });
}

// Sign in anonymously (creates new anonymous user)
async function signInAnonymously() {
  if (!firebaseAuth) {
    throw new Error('Firebase not initialized');
  }

  try {
    const result = await firebaseAuth.signInAnonymously();
    console.log('[Auth] Signed in anonymously:', result.user.uid);

    // Track event
    if (typeof Analytics !== 'undefined') {
      Analytics.trackEvent('auth_anonymous_signin');
    }

    return result.user;
  } catch (error) {
    console.error('[Auth] Anonymous sign-in failed:', error);
    throw error;
  }
}

// ================================================
// Google Sign-In (using chrome.identity for MV3)
// ================================================

// Get Google OAuth id_token using chrome.identity
async function getGoogleIdToken() {
  return new Promise((resolve, reject) => {
    // Use Chrome's identity API for OAuth
    // This opens a secure popup managed by Chrome
    const clientId = FIREBASE_CONFIG.clientId;

    if (!clientId || clientId.includes('YOUR_')) {
      reject(new Error('OAuth Client ID not configured in firebase-config.js'));
      return;
    }

    const redirectUri = chrome.identity.getRedirectURL();
    const scopes = ['openid', 'email', 'profile'];

    // Generate nonce for security
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('prompt', 'select_account');
    authUrl.searchParams.set('nonce', nonce);

    console.log('[Auth] Starting OAuth flow...');
    console.log('[Auth] Redirect URI:', redirectUri);
    console.log('[Auth] Client ID:', clientId.substring(0, 20) + '...');

    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive: true,
      },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          console.error('[Auth] OAuth error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!responseUrl) {
          reject(new Error('No response URL - user may have cancelled'));
          return;
        }

        // Extract id_token from URL fragment
        const url = new URL(responseUrl);
        const params = new URLSearchParams(url.hash.substring(1));
        const idToken = params.get('id_token');

        if (idToken) {
          console.log('[Auth] Got Google id_token');
          resolve(idToken);
        } else {
          console.error('[Auth] Response URL:', responseUrl);
          reject(new Error('No id_token in response'));
        }
      }
    );
  });
}

// Sign in with Google (link if anonymous, or fresh sign in)
async function signInWithGoogle() {
  if (!firebaseAuth) {
    throw new Error('Firebase not initialized');
  }

  try {
    // Get id_token via chrome.identity
    const idToken = await getGoogleIdToken();

    // Create Firebase credential from Google id_token
    // GoogleAuthProvider.credential(idToken, accessToken) - we only have idToken
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken);

    if (currentUser && currentUser.isAnonymous) {
      // Try to link the anonymous account
      try {
        const result = await currentUser.linkWithCredential(credential);
        console.log('[Auth] Linked Google to anonymous account:', result.user.uid);

        if (typeof Analytics !== 'undefined') {
          Analytics.trackEvent('auth_google_linked');
        }

        return { user: result.user, linked: true };
      } catch (linkError) {
        // If credential already in use, sign in with the existing account
        if (linkError.code === 'auth/credential-already-in-use') {
          console.log('[Auth] Google credential already in use, signing in instead');

          const result = await firebaseAuth.signInWithCredential(credential);

          if (typeof Analytics !== 'undefined') {
            Analytics.trackEvent('auth_google_signin_existing');
          }

          return { user: result.user, linked: false, existingAccount: true };
        }
        throw linkError;
      }
    } else {
      // Fresh sign in (no anonymous user or already has an account)
      const result = await firebaseAuth.signInWithCredential(credential);
      console.log('[Auth] Signed in with Google:', result.user.uid);

      if (typeof Analytics !== 'undefined') {
        Analytics.trackEvent('auth_google_signin');
      }

      return { user: result.user, linked: false };
    }
  } catch (error) {
    console.error('[Auth] Google sign-in failed:', error);
    throw error;
  }
}

// ================================================
// Email Link Authentication
// ================================================

// Send sign-in link to email (for trial extension)
async function sendSignInLinkToEmail(email, installationId) {
  if (!firebaseAuth) {
    throw new Error('Firebase not initialized');
  }

  // The URL must be in the authorized domains in Firebase Console
  const actionCodeSettings = {
    url: `https://browserconsoleai.com/extend-trial/confirm?installationId=${encodeURIComponent(installationId)}&email=${encodeURIComponent(email)}`,
    handleCodeInApp: true,
  };

  try {
    await firebaseAuth.sendSignInLinkToEmail(email, actionCodeSettings);

    // Save email for later verification
    await chrome.storage.local.set({ bcai_email_for_signin: email });

    console.log('[Auth] Sign-in link sent to:', email);

    if (typeof Analytics !== 'undefined') {
      Analytics.trackEvent('auth_email_link_sent', { domain: email.split('@')[1] });
    }

    return true;
  } catch (error) {
    console.error('[Auth] Failed to send sign-in link:', error);
    throw error;
  }
}

// Check if URL is a sign-in link
function isSignInWithEmailLink(url) {
  if (!firebaseAuth) return false;
  return firebaseAuth.isSignInWithEmailLink(url);
}

// Complete sign-in with email link
async function signInWithEmailLink(email, url) {
  if (!firebaseAuth) {
    throw new Error('Firebase not initialized');
  }

  try {
    const result = await firebaseAuth.signInWithEmailLink(email, url);
    console.log('[Auth] Signed in with email link:', result.user.uid);

    // Clear stored email
    await chrome.storage.local.remove('bcai_email_for_signin');

    if (typeof Analytics !== 'undefined') {
      Analytics.trackEvent('auth_email_link_completed');
    }

    return result.user;
  } catch (error) {
    console.error('[Auth] Email link sign-in failed:', error);
    throw error;
  }
}

// ================================================
// Sign Out
// ================================================

async function signOut() {
  if (!firebaseAuth) {
    throw new Error('Firebase not initialized');
  }

  try {
    await firebaseAuth.signOut();
    console.log('[Auth] Signed out');

    if (typeof Analytics !== 'undefined') {
      Analytics.trackEvent('auth_signout');
    }

    return true;
  } catch (error) {
    console.error('[Auth] Sign out failed:', error);
    throw error;
  }
}

// ================================================
// Get ID Token (for API calls)
// ================================================

// Get Firebase ID token for authenticated API calls
async function getIdToken(forceRefresh = false) {
  if (!currentUser) {
    return null;
  }

  try {
    const token = await currentUser.getIdToken(forceRefresh);
    return token;
  } catch (error) {
    console.error('[Auth] Failed to get ID token:', error);
    return null;
  }
}

// ================================================
// Exports
// ================================================

const AuthManagerExports = {
  // Initialization
  initializeFirebase,

  // State
  getCurrentUser,
  getCurrentUserId,
  isAnonymous,
  onAuthStateChanged,

  // Sign in methods
  ensureSignedIn,
  signInAnonymously,
  signInWithGoogle,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,

  // Sign out
  signOut,

  // Token
  getIdToken,
};

// Export for sidepanel (window context)
if (typeof window !== 'undefined') {
  window.AuthManager = AuthManagerExports;
}

// Export for service worker (self context)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.AuthManager = AuthManagerExports;
}
