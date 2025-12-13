'use client';

/**
 * useDashboard Hook
 *
 * Fetches and manages dashboard data: subscription status, license token.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';

interface Subscription {
  status: 'free' | 'pro' | 'pro_early' | 'canceled';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

interface LicenseData {
  token: string;
  plan: string;
  expiresAt: string;
}

interface DashboardData {
  subscription: Subscription | null;
  license: LicenseData | null;
  isLoading: boolean;
  error: string | null;
}

export function useDashboard() {
  const { user, firebaseUser } = useAuth();
  const [data, setData] = useState<DashboardData>({
    subscription: null,
    license: null,
    isLoading: true,
    error: null,
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user || !firebaseUser) {
      setData((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const idToken = await firebaseUser.getIdToken();

      // Fetch session data (includes subscription)
      const sessionRes = await fetch('/api/auth/session', {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!sessionRes.ok) {
        throw new Error('Failed to fetch session');
      }

      const sessionData = await sessionRes.json();

      // Fetch license token
      const licenseRes = await fetch('/api/license', {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      let licenseData = null;
      if (licenseRes.ok) {
        licenseData = await licenseRes.json();
      }

      setData({
        subscription: sessionData.subscription,
        license: licenseData,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      }));
    }
  }, [user, firebaseUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const rotateToken = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      const idToken = await firebaseUser.getIdToken();

      const res = await fetch('/api/license/rotate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) {
        throw new Error('Failed to rotate token');
      }

      const newLicense = await res.json();

      setData((prev) => ({
        ...prev,
        license: {
          token: newLicense.token,
          plan: newLicense.plan,
          expiresAt: newLicense.expiresAt,
        },
      }));

      return true;
    } catch (err) {
      setData((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to rotate token',
      }));
      return false;
    }
  }, [firebaseUser]);

  const openBillingPortal = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      const idToken = await firebaseUser.getIdToken();

      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) {
        throw new Error('Failed to open billing portal');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setData((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to open billing portal',
      }));
    }
  }, [firebaseUser]);

  return {
    ...data,
    refresh: fetchDashboardData,
    rotateToken,
    openBillingPortal,
  };
}
