'use client';

/**
 * Extend Trial Confirmation Page
 *
 * Handles magic link clicks to extend trials.
 * URL: /extend-trial/confirm?token=xxx
 */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

type Status = 'loading' | 'success' | 'error';

interface ExtendResult {
  success: boolean;
  message?: string;
  daysRemaining?: number;
  expiresAt?: string;
}

function ConfirmContent() {
  const { locale } = useI18n();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<Status>('loading');
  const [result, setResult] = useState<ExtendResult | null>(null);

  useEffect(() => {
    async function confirmExtension() {
      if (!token) {
        setStatus('error');
        setResult({ success: false, message: 'Invalid magic link. No token provided.' });
        return;
      }

      try {
        const response = await fetch('/api/license/extend-trial/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();
        setResult(data);
        setStatus(data.success ? 'success' : 'error');
      } catch (error) {
        console.error('Failed to confirm extension:', error);
        setResult({
          success: false,
          message: 'Network error. Please try clicking the link again.',
        });
        setStatus('error');
      }
    }

    confirmExtension();
  }, [token]);

  // Loading state
  if (status === 'loading') {
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
  if (status === 'success') {
    return (
      <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="mx-auto flex w-full flex-col items-center justify-center space-y-6 sm:w-[500px]">
          <CheckCircle className="h-20 w-20 text-green-500" />
          <h1 className="text-3xl font-bold">Trial Extended!</h1>
          <p className="text-center text-lg text-muted-foreground">
            {result?.message || `You now have ${result?.daysRemaining} days remaining.`}
          </p>

          <div className="w-full bg-muted/50 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Your extension will automatically update.
            </p>
            <p className="text-sm font-medium">
              Just open the Browser Console AI sidepanel and you&apos;re all set!
            </p>
          </div>

          {result?.expiresAt && (
            <p className="text-sm text-muted-foreground">
              New expiry: {new Date(result.expiresAt).toLocaleDateString()}
            </p>
          )}

          <div className="flex gap-4">
            <a
              href={`/${locale}/pricing`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Upgrade to PRO
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

        <div className="flex gap-4">
          <a
            href={`/${locale}/pricing`}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Upgrade to PRO
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}
