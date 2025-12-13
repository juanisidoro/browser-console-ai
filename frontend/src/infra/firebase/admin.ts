/**
 * Firebase Admin SDK Configuration
 *
 * This file initializes Firebase Admin for server-side use (API routes).
 * Used by: API routes, server components, middleware
 *
 * IMPORTANT: Never import this file in client components!
 *
 * Supports two configuration methods:
 * 1. Separate env vars (recommended): FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * 2. Full JSON (legacy): FIREBASE_SERVICE_ACCOUNT_KEY
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let adminAuth: Auth;
let adminDb: Firestore;

function getServiceAccountCredentials() {
  // Option 1: Separate environment variables (recommended)
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      // Replace escaped newlines with actual newlines
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };
  }

  // Option 2: Full JSON in single variable (legacy)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        // Replace escaped newlines with actual newlines
        privateKey: parsed.private_key.replace(/\\n/g, '\n'),
      };
    } catch {
      throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON');
    }
  }

  throw new Error(
    'Firebase Admin credentials not configured. Set either:\n' +
    '1. FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (recommended)\n' +
    '2. FIREBASE_SERVICE_ACCOUNT_KEY (full JSON)'
  );
}

function getAdminApp(): App {
  if (!app) {
    const apps = getApps();
    if (apps.length > 0) {
      app = apps[0];
    } else {
      const credentials = getServiceAccountCredentials();
      app = initializeApp({
        credential: cert(credentials),
        projectId: credentials.projectId,
      });
    }
  }
  return app;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(getAdminApp());
  }
  return adminAuth;
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp());
  }
  return adminDb;
}

export { getAdminApp };
