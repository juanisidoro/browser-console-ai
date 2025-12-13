'use client';

/**
 * Auth Callback Page
 *
 * Handles OAuth redirects and token passing to the Chrome extension.
 * When the extension opens this page, it extracts the token from URL params.
 */

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/features/auth';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n-context';

function CallbackContent() {
  const { section } = useI18n();
  const auth = section('auth') as Record<string, unknown>;
  const callback = auth.callback as Record<string, string>;

  const { user, firebaseUser, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [token, setToken] = useState<string | null>(null);

  // Check if this is a redirect from the extension
  const isExtensionCallback = searchParams.get('source') === 'extension';

  useEffect(() => {
    async function handleCallback() {
      if (isLoading) return;

      if (!user || !firebaseUser) {
        setStatus('error');
        return;
      }

      try {
        // Get a fresh ID token
        const idToken = await firebaseUser.getIdToken(true);
        setToken(idToken);
        setStatus('success');

        // If opened by extension, it will read the token from the page
        // The extension should look for a data attribute or postMessage
        if (isExtensionCallback && typeof window !== 'undefined') {
          // Post message to extension if it's listening
          window.postMessage(
            {
              type: 'BROWSER_CONSOLE_AI_AUTH',
              token: idToken,
              user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
              },
            },
            '*'
          );
        }
      } catch (error) {
        console.error('Failed to get token:', error);
        setStatus('error');
      }
    }

    handleCallback();
  }, [user, firebaseUser, isLoading, isExtensionCallback]);

  // Show loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">{callback?.loading || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (status === 'error') {
    return (
      <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-destructive text-4xl">!</div>
          <h1 className="text-xl font-semibold">{callback?.error || 'Error'}</h1>
          <p className="text-muted-foreground">{callback?.errorDescription || 'An error occurred'}</p>
        </div>
      </div>
    );
  }

  // Show success state
  return (
    <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-green-500 text-4xl">✓</div>
        <h1 className="text-xl font-semibold">{callback?.success || 'Success'}</h1>
        <p className="text-muted-foreground">{callback?.successDescription || 'Authentication complete'}</p>

        {isExtensionCallback && token && (
          <div
            className="mt-6 p-4 bg-muted rounded-lg text-xs font-mono break-all text-left"
            data-auth-token={token}
          >
            <p className="text-muted-foreground mb-2">{callback?.tokenCopied || 'Token ready'}</p>
            <p className="truncate">{token.slice(0, 50)}...</p>
          </div>
        )}

        {!isExtensionCallback && (
          <p className="text-sm text-muted-foreground">
            {callback?.closeTab || 'You can close this tab'}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
