'use client';

/**
 * Onboarding Steps Component
 *
 * Visual step-by-step guide for new users to get started.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Sparkles,
  Key,
  Rocket,
  Check,
  ChevronRight,
  ExternalLink,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  completed?: boolean;
}

interface OnboardingStepsProps {
  hasExtension?: boolean;
  hasTrial?: boolean;
  hasToken?: boolean;
  token?: string | null;
  locale: string;
}

export function OnboardingSteps({
  hasExtension = false,
  hasTrial = false,
  hasToken = false,
  token,
  locale
}: OnboardingStepsProps) {
  const [copiedToken, setCopiedToken] = useState(false);

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const isEn = locale === 'en';

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: isEn ? 'Install the Extension' : 'Instalar la Extensión',
      description: isEn
        ? 'Download Browser Console AI from the Chrome Web Store'
        : 'Descarga Browser Console AI desde Chrome Web Store',
      icon: <Download className="w-6 h-6" />,
      action: {
        label: isEn ? 'Get Extension' : 'Obtener Extensión',
        href: 'https://chrome.google.com/webstore',
      },
      completed: hasExtension,
    },
    {
      id: 2,
      title: isEn ? 'Activate Your Trial' : 'Activar tu Prueba',
      description: isEn
        ? 'Open the extension and click "Start Free Trial" for 3 days. Then enter your email for 3 more days!'
        : 'Abre la extensión y pulsa "Start Free Trial" para 3 días. ¡Luego ingresa tu email para 3 días más!',
      icon: <Sparkles className="w-6 h-6" />,
      completed: hasTrial,
    },
    {
      id: 3,
      title: isEn ? 'Enter Your Token' : 'Ingresar tu Token',
      description: isEn
        ? 'Copy your license token below and paste it in the extension settings'
        : 'Copia tu token de licencia y pégalo en los ajustes de la extensión',
      icon: <Key className="w-6 h-6" />,
      action: token ? {
        label: copiedToken
          ? (isEn ? 'Copied!' : '¡Copiado!')
          : (isEn ? 'Copy Token' : 'Copiar Token'),
        onClick: copyToken,
      } : undefined,
      completed: hasToken,
    },
    {
      id: 4,
      title: isEn ? 'Start Capturing!' : '¡Comenzar a Capturar!',
      description: isEn
        ? 'Record console logs and send them to your AI agents via MCP'
        : 'Graba logs de consola y envíalos a tus agentes IA vía MCP',
      icon: <Rocket className="w-6 h-6" />,
      completed: hasExtension && hasTrial && hasToken,
    },
  ];

  // Calculate progress
  const completedSteps = steps.filter(s => s.completed).length;
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header with progress */}
      <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">
              {isEn ? 'Getting Started' : 'Primeros Pasos'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isEn
                ? `${completedSteps} of ${steps.length} steps completed`
                : `${completedSteps} de ${steps.length} pasos completados`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">{Math.round(progressPercent)}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/70"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "p-6 flex items-start gap-4 transition-colors",
              step.completed ? "bg-primary/5" : "hover:bg-muted/50"
            )}
          >
            {/* Step indicator */}
            <div className={cn(
              "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all",
              step.completed
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              {step.completed ? (
                <Check className="w-6 h-6" />
              ) : (
                step.icon
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "font-semibold",
                  step.completed && "text-primary"
                )}>
                  {step.title}
                </h3>
                {step.completed && (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {step.description}
              </p>

              {/* Token display for step 3 */}
              {step.id === 3 && token && !step.completed && (
                <div className="mt-3 p-3 bg-muted rounded-lg font-mono text-xs break-all">
                  {token.slice(0, 50)}...
                </div>
              )}
            </div>

            {/* Action button */}
            {step.action && !step.completed && (
              step.action.href ? (
                <a
                  href={step.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {step.action.label}
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <button
                  onClick={step.action.onClick}
                  className={cn(
                    "flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    copiedToken
                      ? "bg-green-500 text-white"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {copiedToken ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {step.action.label}
                </button>
              )
            )}

            {/* Completed checkmark */}
            {step.completed && (
              <div className="flex-shrink-0 text-primary">
                <ChevronRight className="w-5 h-5" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Completion message */}
      {completedSteps === steps.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-t border-green-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-600 dark:text-green-400">
                {isEn ? "You're all set!" : '¡Todo listo!'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isEn
                  ? 'Start recording console logs and send them to your AI agents.'
                  : 'Comienza a grabar logs de consola y envíalos a tus agentes IA.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
