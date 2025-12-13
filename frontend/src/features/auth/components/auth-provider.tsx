'use client';

/**
 * Auth Provider Component
 *
 * Provides authentication state to the entire application.
 * Listens to Firebase auth state changes and syncs with context.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/infra/firebase/client';
import type { User } from '../../../../../../shared/core';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Transform Firebase user to our User entity
function toUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || undefined,
    photoURL: firebaseUser.photoURL || undefined,
  };
}

// Ensure user document exists in Firestore (server-side)
async function ensureUserInFirestore(idToken: string): Promise<void> {
  try {
    const response = await fetch('/api/users/ensure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to ensure user in Firestore:', await response.text());
    }
  } catch (error) {
    console.error('Error ensuring user in Firestore:', error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen to auth state changes (only after mount to avoid hydration issues)
  useEffect(() => {
    if (!mounted) return;

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        setUser(toUser(fbUser));
        // Ensure user document exists in Firestore
        const idToken = await fbUser.getIdToken();
        await ensureUserInFirestore(idToken);
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [mounted]);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('[Auth] Starting Google login...');
      const auth = getFirebaseAuth();
      console.log('[Auth] Firebase auth instance:', auth ? 'OK' : 'NULL');
      const provider = new GoogleAuthProvider();
      console.log('[Auth] Opening popup...');
      const result = await signInWithPopup(auth, provider);
      console.log('[Auth] Login successful:', result.user.email);
    } catch (err) {
      console.error('[Auth] Google login error:', err);
      const message = err instanceof Error ? err.message : 'Failed to login with Google';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('[Auth] Starting email login for:', email);
      const auth = getFirebaseAuth();
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('[Auth] Email login successful:', result.user.email);
    } catch (err: unknown) {
      console.error('[Auth] Email login error:', err);
      // Firebase error codes for better UX
      const firebaseError = err as { code?: string; message?: string };
      let message = 'Failed to login';
      if (firebaseError.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (firebaseError.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      } else if (firebaseError.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (firebaseError.code === 'auth/invalid-credential') {
        message = 'Invalid email or password';
      } else if (firebaseError.message) {
        message = firebaseError.message;
      }
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('[Auth] Starting registration for:', email);
      const auth = getFirebaseAuth();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('[Auth] Registration successful:', result.user.email);
    } catch (err: unknown) {
      console.error('[Auth] Registration error:', err);
      const firebaseError = err as { code?: string; message?: string };
      let message = 'Failed to register';
      if (firebaseError.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists';
      } else if (firebaseError.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters';
      } else if (firebaseError.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (firebaseError.message) {
        message = firebaseError.message;
      }
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);

    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to logout';
      setError(message);
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        error,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
