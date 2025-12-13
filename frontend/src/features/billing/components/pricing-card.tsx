'use client';

/**
 * Pricing Card Component
 *
 * Handles checkout flow for PRO subscriptions.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth';
import { useI18n } from '@/lib/i18n-context';
import Link from 'next/link';
import { Loader2, Check, Sparkles } from 'lucide-react';

interface PricingCardProps {
  plan: 'free' | 'pro';
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

export function PricingCard({
  plan,
  price,
  period,
  features,
  highlighted = false,
  badge,
}: PricingCardProps) {
  const { locale, section } = useI18n();
  const auth = section('auth') as Record<string, string>;
  const pricing = section('pricing') as Record<string, unknown>;

  const { user, firebaseUser, isLoading: authLoading } = useAuth();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setError(null);

    // If not logged in, redirect to login
    if (!user || !firebaseUser) {
      window.location.href = `/${locale}/auth/login?redirect=pricing`;
      return;
    }

    setIsCheckoutLoading(true);

    try {
      const idToken = await firebaseUser.getIdToken();

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ plan: 'pro_early', locale }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsCheckoutLoading(false);
    }
  };

  const cardClasses = highlighted
    ? 'p-8 bg-primary/5 border-2 border-primary rounded-xl relative'
    : 'p-8 bg-card border border-border rounded-xl';

  return (
    <div className={cardClasses}>
      {badge && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {badge}
        </div>
      )}

      <h3 className="text-2xl font-bold mb-2">
        {plan === 'free' ? (pricing.free as Record<string, string>).name : (pricing.pro as Record<string, string>).name}
      </h3>
      <p className="text-4xl font-bold text-primary mb-1">{price}</p>
      <p className="text-muted-foreground mb-8">{period}</p>

      {plan === 'free' ? (
        <Button
          className="w-full mb-8"
          variant={highlighted ? 'default' : 'outline'}
          asChild
        >
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noreferrer"
          >
            {locale === 'en' ? 'Install Free' : 'Instalar Gratis'}
          </a>
        </Button>
      ) : (
        <Button
          className="w-full mb-8"
          onClick={handleCheckout}
          disabled={isCheckoutLoading || authLoading}
        >
          {isCheckoutLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {locale === 'en' ? 'Loading...' : 'Cargando...'}
            </>
          ) : !user ? (
            locale === 'en' ? 'Login to Subscribe' : 'Iniciar sesión'
          ) : (
            locale === 'en' ? 'Get Pro' : 'Obtener Pro'
          )}
        </Button>
      )}

      {error && (
        <p className="text-sm text-destructive mb-4 text-center">{error}</p>
      )}

      <ul className="space-y-3">
        {features.map((feature, idx) => (
          <li key={idx} className="flex gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
