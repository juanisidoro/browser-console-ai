'use client';

/**
 * Dashboard Page
 *
 * Protected page showing user's subscription and license info.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/features/auth';
import { useDashboard, SubscriptionCard, OnboardingSteps } from '@/features/dashboard';
import { useI18n } from '@/lib/i18n-context';
import { Loader2, Settings } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { locale } = useI18n();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    subscription,
    license,
    trial,
    onboarding,
    isLoading: dashboardLoading,
    error,
    activatingTrial,
    rotateToken,
    openBillingPortal,
    activateTrial,
  } = useDashboard();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/auth/login?redirect=dashboard`);
    }
  }, [authLoading, user, router, locale]);

  // Show loading while checking auth
  if (authLoading || !user) {
    return (
      <>
        <Header locale={locale} />
        <main className="pt-32 pb-20 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
        </main>
        <Footer locale={locale} />
      </>
    );
  }

  return (
    <>
      <Header locale={locale} />
      <main className="pt-32 pb-20 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              {locale === 'en' ? 'Dashboard' : 'Panel de Control'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {locale === 'en'
                ? `Welcome back, ${user.displayName || user.email}`
                : `Bienvenido, ${user.displayName || user.email}`}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              {error}
            </div>
          )}

          {/* Dashboard Loading */}
          {dashboardLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6">
              {/* Onboarding Steps - Show for free/trial users */}
              {(!subscription?.status || subscription?.status === 'free' || subscription?.status === 'trial') && (
                <OnboardingSteps
                  extensionInstalled={onboarding.extensionInstalled}
                  trialActivated={onboarding.trialActivated}
                  firstRecording={onboarding.firstRecording}
                  mcpConnected={onboarding.mcpConnected}
                  trialDaysRemaining={trial?.daysRemaining}
                  canActivateTrial={trial?.canActivate ?? true}
                  onActivateTrial={activateTrial}
                  activatingTrial={activatingTrial}
                  locale={locale}
                />
              )}

              {/* Subscription Card */}
              <SubscriptionCard
                status={subscription?.status || 'free'}
                currentPeriodEnd={subscription?.currentPeriodEnd}
                cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd}
                onManageBilling={openBillingPortal}
              />

              {/* Quick Links */}
              <div className="rounded-xl border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {locale === 'en' ? 'Quick Links' : 'Enlaces Rápidos'}
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <a
                    href="https://chrome.google.com/webstore"
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                  >
                    <h4 className="font-medium group-hover:text-primary transition-colors">
                      {locale === 'en' ? 'Chrome Extension' : 'Extensión Chrome'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {locale === 'en'
                        ? 'Install or update'
                        : 'Instalar o actualizar'}
                    </p>
                  </a>
                  <a
                    href={`/${locale}/docs`}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                  >
                    <h4 className="font-medium group-hover:text-primary transition-colors">
                      {locale === 'en' ? 'Documentation' : 'Documentación'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {locale === 'en'
                        ? 'Learn how to use'
                        : 'Aprende a usar'}
                    </p>
                  </a>
                  <Link
                    href={`/${locale}/settings`}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                  >
                    <h4 className="font-medium group-hover:text-primary transition-colors flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      {locale === 'en' ? 'Settings' : 'Configuración'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {locale === 'en'
                        ? 'Manage your account'
                        : 'Gestionar tu cuenta'}
                    </p>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
