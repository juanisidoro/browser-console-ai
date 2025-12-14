// Firebase Configuration for Browser Console AI Extension
//
// These are public Firebase config values (safe to expose in client code)
// The actual security comes from Firebase Security Rules
//
// IMPORTANT: These values must match your NEXT_PUBLIC_FIREBASE_* env vars
// Get them from: Firebase Console > Project Settings > General > Your apps

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCpydVbKXrPNz9pA_OOmDPVzazEWIoUDB4',
  authDomain: 'browser-console-ai.firebaseapp.com',
  projectId: 'browser-console-ai',
  storageBucket: 'browser-console-ai.firebasestorage.app',
  messagingSenderId: '761675505616',
  appId: '1:761675505616:web:a150ad2c01a1014422a3d5',

  // OAuth Client ID for Web Application (from Google Cloud Console)
  // Redirect URI: https://diddbjpaljofahffcmaddecdlflmgagh.chromiumapp.org/
  clientId: '761675505616-gk2bic8b25185cum71622ilbo24k5493.apps.googleusercontent.com',
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.FIREBASE_CONFIG = FIREBASE_CONFIG;
}

// For service worker context
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.FIREBASE_CONFIG = FIREBASE_CONFIG;
}
