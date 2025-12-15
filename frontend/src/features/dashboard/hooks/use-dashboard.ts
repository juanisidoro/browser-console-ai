'use client';

/**
 * useDashboard Hook
 *
 * Fetches and manages dashboard data: subscription status, license token, trial.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';

interface Subscription {
  status: 'free' | 'trial' | 'pro' | 'pro_early' | 'canceled';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

interface LicenseData {
  token: string;
  plan: string;
  expiresAt: string;
}

interface TrialStatus {
  hasTrialed: boolean;
  canActivate: boolean;
  isValid: boolean;
  token?: string;
  expiresAt?: string;
  daysRemaining?: number;
}

interface OnboardingProgress {
  extensionInstalled: boolean;
  trialActivated: boolean;
  firstRecording: boolean;
  mcpConnected: boolean;
}

interface DashboardData {
  subscription: Subscription | null;
  license: LicenseData | null;
  trial: TrialStatus | null;
  onboarding: OnboardingProgress;
  isLoading: boolean;
  error: string | null;
}

export function useDashboard() {
  const { user, firebaseUser } = useAuth();
  const [data, setData] = useState<DashboardData>({
    subscription: null,
    license: null,
    trial: null,
    onboarding: {
      extensionInstalled: false,
      trialActivated: false,
      firstRecording: false,
      mcpConnected: false,
    },
    isLoading: true,
    error: null,
  });
  const [activatingTrial, setActivatingTrial] = useState(false);

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

      // Fetch trial status
      const trialRes = await fetch('/api/license/activate-user-trial', {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      let trialData = null;
      if (trialRes.ok) {
        trialData = await trialRes.json();
      }

      // Get subscription and onboarding from session
      const subscription = sessionData.subscription;
      const isPro = subscription?.status === 'pro' || subscription?.status === 'pro_early';
      const hasTrial = trialData?.isValid || subscription?.status === 'trial';

      // Use onboarding progress from session (tracked via analytics events)
      const onboarding = sessionData.onboarding || {
        extensionInstalled: false,
        trialActivated: false,
        firstRecording: false,
        mcpConnected: false,
      };

      // Ensure trialActivated is true if user has active trial/pro
      if (hasTrial || isPro) {
        onboarding.trialActivated = true;
      }

      setData({
        subscription: {
          ...subscription,
          status: hasTrial && !isPro ? 'trial' : subscription?.status || 'free',
        },
        license: licenseData || (trialData?.token ? {
          token: trialData.token,
          plan: 'trial',
          expiresAt: trialData.expiresAt,
        } : null),
        trial: trialData,
        onboarding,
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

  const activateTrial = useCallback(async () => {
    if (!firebaseUser) return { success: false, error: 'Not authenticated' };

    setActivatingTrial(true);

    try {
      const idToken = await firebaseUser.getIdToken();

      const res = await fetch('/api/license/activate-user-trial', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });

      const result = await res.json();

      if (result.success) {
        // Update local state with new trial
        setData((prev) => ({
          ...prev,
          trial: {
            hasTrialed: true,
            canActivate: false,
            isValid: true,
            token: result.token,
            expiresAt: result.expiresAt,
            daysRemaining: result.daysRemaining,
          },
          license: {
            token: result.token,
            plan: 'trial',
            expiresAt: result.expiresAt,
          },
          subscription: {
            ...prev.subscription,
            status: 'trial',
          },
          onboarding: {
            ...prev.onboarding,
            hasTrial: true,
            hasToken: true,
          },
        }));

        setActivatingTrial(false);
        return { success: true, token: result.token };
      } else {
        setActivatingTrial(false);
        return { success: false, error: result.message || result.error };
      }
    } catch (err) {
      setActivatingTrial(false);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to activate trial',
      };
    }
  }, [firebaseUser]);

  return {
    ...data,
    activatingTrial,
    refresh: fetchDashboardData,
    rotateToken,
    openBillingPortal,
    activateTrial,
  };
}
