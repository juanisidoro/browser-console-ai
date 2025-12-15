'use client';

/**
 * Extension Token Component
 *
 * Displays the license token for the extension with copy/rotate actions.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n-context';
import { Key, Copy, Check, RefreshCw, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface ExtensionTokenProps {
  token: string | null;
  plan: string;
  expiresAt: string | null;
  onRotate: () => Promise<boolean>;
}

export function ExtensionToken({
  token,
  plan,
  expiresAt,
  onRotate,
}: ExtensionTokenProps) {
  const { locale } = useI18n();
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const handleCopy = async () => {
    if (!token) return;

    try {
      await navigator.clipboard.writeText(token);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRotate = async () => {
    setIsRotating(true);
    await onRotate();
    setIsRotating(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPro = plan === 'pro' || plan === 'pro_early';

  // Check if token is expiring soon (less than 24 hours)
  const isExpiringSoon =
    expiresAt && new Date(expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            {locale === 'en' ? 'Extension Token' : 'Token de Extensión'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {locale === 'en'
              ? 'Use this token to connect the Chrome extension'
              : 'Usa este token para conectar la extensión de Chrome'}
          </p>
        </div>
      </div>

      {!isPro ? (
        <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
          <p className="text-sm text-muted-foreground text-center">
            {locale === 'en'
              ? 'Upgrade to Pro to get your extension token for MCP integration.'
              : 'Mejora a Pro para obtener tu token de extensión para la integración MCP.'}
          </p>
        </div>
      ) : token ? (
        <>
          {/* Auto-sync notice */}
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                {locale === 'en'
                  ? 'Auto-sync enabled'
                  : 'Sincronización automática activada'}
              </p>
              <p className="text-xs text-green-600/80 dark:text-green-400/80">
                {locale === 'en'
                  ? 'Sign in with Google in the extension to auto-sync your Pro license.'
                  : 'Inicia sesión con Google en la extensión para sincronizar automáticamente tu licencia Pro.'}
              </p>
            </div>
          </div>

          {isExpiringSoon && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                {locale === 'en'
                  ? 'Token expires soon. It will auto-refresh on next use.'
                  : 'El token expira pronto. Se actualizará automáticamente.'}
              </p>
            </div>
          )}

          {/* Manual copy section (collapsible/secondary) */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-3">
              <span>{locale === 'en' ? 'Manual token (advanced)' : 'Token manual (avanzado)'}</span>
              <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mb-4">
              <div className="relative">
                <div className="p-3 rounded-lg bg-muted font-mono text-xs break-all">
                  {isVisible ? token : '•'.repeat(Math.min(token.length, 60))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1"
                  onClick={() => setIsVisible(!isVisible)}
                >
                  {isVisible ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {expiresAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  {locale === 'en' ? 'Expires: ' : 'Expira: '}
                  {formatDate(expiresAt)}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    {locale === 'en' ? 'Copied!' : '¡Copiado!'}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    {locale === 'en' ? 'Copy Token' : 'Copiar Token'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
                disabled={isRotating}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isRotating ? 'animate-spin' : ''}`}
                />
                {locale === 'en' ? 'Rotate Token' : 'Rotar Token'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              {locale === 'en'
                ? 'Only use manual token if auto-sync is not working. Rotating the token will invalidate the previous one.'
                : 'Solo usa el token manual si la sincronización automática no funciona. Rotar el token invalidará el anterior.'}
            </p>
          </details>
        </>
      ) : (
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            {locale === 'en'
              ? 'Loading token...'
              : 'Cargando token...'}
          </p>
        </div>
      )}
    </div>
  );
}
