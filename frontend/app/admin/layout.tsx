'use client';

/**
 * Admin Layout
 *
 * Protects admin routes - only accessible to admin users.
 * Note: This page is not indexed by search engines (X-Robots-Tag in middleware).
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth';
import { isAdminEmail } from '@/lib/admin';
import { Header } from '@/components/header';
import { I18nProvider } from '@/lib/i18n-context';
import { Loader2, ShieldAlert, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, firebaseUser, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (user?.email && isAdminEmail(user.email)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
  }, [user, isLoading]);

  // Loading state
  if (isLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground">
            Please log in to access the admin panel.
          </p>
          <a
            href="/en/auth/login?redirect=admin/metrics"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Log In
          </a>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to access the admin panel.
          </p>
          <p className="text-sm text-muted-foreground">
            Logged in as: {user.email}
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  // Admin authenticated
  return (
    <I18nProvider locale="en" country="US">
    <div className="min-h-screen bg-background">
      {/* Site Header */}
      <Header locale="en" />

      {/* Admin Sub-header */}
      <div className="pt-16 border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="font-semibold">Admin Panel</span>
              </div>
              <nav className="flex items-center gap-4 ml-6">
                <Link
                  href="/admin/metrics"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Metrics
                </Link>
              </nav>
            </div>
            <span className="text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="pt-6">{children}</main>
    </div>
    </I18nProvider>
  );
}
