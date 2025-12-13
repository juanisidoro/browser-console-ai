'use client';

/**
 * Admin Layout
 *
 * Protects admin routes - only accessible to admin users.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth';
import { isAdminEmail } from '../../../shared/core';
import { Loader2, ShieldAlert } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a href="/" className="text-xl font-bold">
                Browser Console AI
              </a>
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                Admin
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <nav className="flex space-x-4">
                <a
                  href="/admin/metrics"
                  className="text-sm text-foreground hover:text-primary"
                >
                  Metrics
                </a>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>
    </div>
  );
}
