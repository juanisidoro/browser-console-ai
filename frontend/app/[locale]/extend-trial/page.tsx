'use client';

/**
 * Extend Trial Page
 *
 * Allows registered users to extend their trial by 3 more days.
 * Flow:
 * 1. Extension links here with ?installationId=xxx
 * 2. If not logged in → redirect to login
 * 3. If logged in → extend trial and show new token
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { useI18n } from '@/lib/i18n-context';
import { Loader2, CheckCircle, XCircle, Copy, ExternalLink } from 'lucide-react';

interface ExtendResult {
  success: boolean;
  token?: string;
  expiresAt?: string;
  daysRemaining?: number;
  message?: string;
  error?: string;
}

function ExtendTrialContent() {
  const { locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, firebaseUser, isLoading: authLoading } = useAuth();

  const [status, setStatus] = useState<'loading' | 'extending' | 'success' | 'error' | 'no_installation'>('loading');
  const [result, setResult] = useState<ExtendResult | null>(null);
  const [copied, setCopied] = useState(false);

  const installationId = searchParams.get('installationId');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const currentUrl = encodeURIComponent(`extend-trial?installationId=${installationId}`);
      router.push(`/${locale}/auth/login?redirect=${currentUrl}`);
    }
  }, [user, authLoading, router, locale, installationId]);

  // Check for installation ID
  useEffect(() => {
    if (!installationId) {
      setStatus('no_installation');
    }
  }, [installationId]);

  // Extend trial when authenticated
  useEffect(() => {
    async function extendTrial() {
      if (!user || !firebaseUser || !installationId || status !== 'loading') return;

      setStatus('extending');

      try {
        const idToken = await firebaseUser.getIdToken();

        const response = await fetch('/api/license/extend-trial', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ installationId }),
        });

        const data = await response.json();

        if (data.success) {
          setResult(data);
          setStatus('success');
        } else {
          setResult(data);
          setStatus('error');
        }
      } catch (error) {
        console.error('Failed to extend trial:', error);
        setResult({
          success: false,
          error: 'network_error',
          message: 'Failed to connect to server. Please try again.',
        });
        setStatus('error');
      }
    }

    extendTrial();
  }, [user, firebaseUser, installationId, status]);

  const copyToken = async () => {
    if (result?.token) {
      await navigator.clipboard.writeText(result.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading state
  if (authLoading || status === 'loading') {
    return (
      <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // No installation ID
  if (status === 'no_installation') {
    return (
      <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="mx-auto flex w-full flex-col items-center justify-center space-y-6 sm:w-[450px]">
          <XCircle className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-semibold">Missing Installation ID</h1>
          <p className="text-center text-muted-foreground">
            This page should be accessed from the Browser Console AI extension.
            Open the extension and click &quot;Get 3 more days&quot; to extend your trial.
          </p>
        </div>
      </div>
    );
  }

  // Extending state
  if (status === 'extending') {
    return (
      <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Extending your trial...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success' && result) {
    return (
      <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="mx-auto flex w-full flex-col items-center justify-center space-y-6 sm:w-[500px]">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-semibold">Trial Extended!</h1>
          <p className="text-center text-muted-foreground">
            {result.message || `Your trial has been extended. You now have ${result.daysRemaining} days remaining.`}
          </p>

          <div className="w-full space-y-4 bg-muted/50 rounded-lg p-6">
            <p className="text-sm font-medium">Copy this token to your extension:</p>
            <div className="flex gap-2">
              <code className="flex-1 bg-background p-3 rounded text-xs break-all border">
                {result.token?.slice(0, 50)}...
              </code>
              <button
                onClick={copyToken}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Expires: {result.expiresAt ? new Date(result.expiresAt).toLocaleDateString() : 'N/A'}
            </p>
            <a
              href={`/${locale}/pricing`}
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Upgrade to PRO for unlimited access
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <div className="mx-auto flex w-full flex-col items-center justify-center space-y-6 sm:w-[450px]">
        <XCircle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-semibold">Unable to Extend Trial</h1>
        <p className="text-center text-muted-foreground">
          {result?.message || 'Something went wrong. Please try again.'}
        </p>

        {result?.error === 'already_extended' && (
          <a
            href={`/${locale}/pricing`}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Upgrade to PRO
          </a>
        )}

        {result?.error === 'no_trial' && (
          <p className="text-sm text-muted-foreground">
            You need to start a free trial in the extension first, then come back here to extend it.
          </p>
        )}

        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          Go back
        </button>
      </div>
    </div>
  );
}

export default function ExtendTrialPage() {
  return (
    <Suspense fallback={
      <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ExtendTrialContent />
    </Suspense>
  );
}
