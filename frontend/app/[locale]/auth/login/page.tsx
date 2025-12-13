'use client';

/**
 * Login Page
 *
 * Renders the login form for user authentication.
 * Redirects to dashboard after successful login.
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm, useAuth } from '@/features/auth';
import { useI18n } from '@/lib/i18n-context';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { locale, section } = useI18n();
  const auth = section('auth') as Record<string, string>;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();

  // Redirect to dashboard (or custom redirect) after login
  useEffect(() => {
    if (user && !isLoading) {
      const redirect = searchParams.get('redirect') || 'dashboard';
      router.push(`/${locale}/${redirect}`);
    }
  }, [user, isLoading, router, locale, searchParams]);

  // Show loading while checking auth or redirecting
  if (isLoading || user) {
    return (
      <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{auth.loginTitle}</h1>
          <p className="text-sm text-muted-foreground">{auth.loginDescription}</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
