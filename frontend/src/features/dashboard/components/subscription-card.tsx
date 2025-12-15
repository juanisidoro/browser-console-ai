'use client';

/**
 * Subscription Card Component
 *
 * Displays current subscription status and actions.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n-context';
import { Crown, Sparkles, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionCardProps {
  status: 'free' | 'trial' | 'pro' | 'pro_early' | 'canceled';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  onManageBilling: () => void;
}

export function SubscriptionCard({
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  onManageBilling,
}: SubscriptionCardProps) {
  const { locale } = useI18n();

  const isPro = status === 'pro' || status === 'pro_early';
  const isEarlyAccess = status === 'pro_early';

  const statusLabels: Record<string, string> = {
    free: locale === 'en' ? 'Free Plan' : 'Plan Gratuito',
    trial: locale === 'en' ? 'Trial' : 'Prueba',
    pro: locale === 'en' ? 'Pro Plan' : 'Plan Pro',
    pro_early: locale === 'en' ? 'Pro (Early Access)' : 'Pro (Acceso Anticipado)',
    canceled: locale === 'en' ? 'Canceled' : 'Cancelado',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {isPro ? (
              <Crown className="w-5 h-5 text-yellow-500" />
            ) : (
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            )}
            {locale === 'en' ? 'Subscription' : 'Suscripción'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {locale === 'en'
              ? 'Manage your plan and billing'
              : 'Gestiona tu plan y facturación'}
          </p>
        </div>
        <Badge variant={isPro ? 'default' : 'secondary'}>
          {statusLabels[status]}
        </Badge>
      </div>

      {isPro && currentPeriodEnd && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50">
          <p className="text-sm">
            {cancelAtPeriodEnd ? (
              <>
                <span className="text-destructive font-medium">
                  {locale === 'en' ? 'Cancels on ' : 'Se cancela el '}
                </span>
                {formatDate(currentPeriodEnd)}
              </>
            ) : (
              <>
                <span className="text-muted-foreground">
                  {locale === 'en' ? 'Renews on ' : 'Se renueva el '}
                </span>
                {formatDate(currentPeriodEnd)}
              </>
            )}
          </p>
          {isEarlyAccess && (
            <p className="text-xs text-muted-foreground mt-1">
              {locale === 'en'
                ? 'Locked in at $9/month early access price'
                : 'Precio de acceso anticipado bloqueado a $9/mes'}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {isPro ? (
          <Button variant="outline" onClick={onManageBilling}>
            <CreditCard className="w-4 h-4 mr-2" />
            {locale === 'en' ? 'Manage Billing' : 'Gestionar Facturación'}
          </Button>
        ) : (
          <Button asChild>
            <Link href={`/${locale}/pricing`}>
              <Crown className="w-4 h-4 mr-2" />
              {locale === 'en' ? 'Upgrade to Pro' : 'Mejorar a Pro'}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
