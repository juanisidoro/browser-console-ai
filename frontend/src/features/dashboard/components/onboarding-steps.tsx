'use client';

/**
 * Onboarding Steps Component
 *
 * Visual step-by-step guide for new users to get started.
 * Steps: Install Extension → Activate Trial → First Recording → Connect MCP
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Sparkles,
  Rocket,
  Plug,
  Check,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  Loader2,
  PartyPopper
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
    loading?: boolean;
  };
  completed?: boolean;
}

interface OnboardingStepsProps {
  extensionInstalled?: boolean;
  trialActivated?: boolean;
  firstRecording?: boolean;
  mcpConnected?: boolean;
  trialDaysRemaining?: number;
  canActivateTrial?: boolean;
  onActivateTrial?: () => Promise<{ success: boolean; error?: string }>;
  activatingTrial?: boolean;
  locale: string;
}

export function OnboardingSteps({
  extensionInstalled = false,
  trialActivated = false,
  firstRecording = false,
  mcpConnected = false,
  trialDaysRemaining,
  canActivateTrial = true,
  onActivateTrial,
  activatingTrial = false,
  locale
}: OnboardingStepsProps) {
  const [trialError, setTrialError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleActivateTrial = async () => {
    if (!onActivateTrial) return;
    setTrialError(null);
    const result = await onActivateTrial();
    if (!result.success && result.error) {
      setTrialError(result.error);
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
      action: !extensionInstalled ? {
        label: isEn ? 'Get Extension' : 'Obtener Extensión',
        href: 'https://chrome.google.com/webstore',
      } : undefined,
      completed: extensionInstalled,
    },
    {
      id: 2,
      title: isEn ? 'Activate 6-Day Trial' : 'Activar Prueba de 6 Días',
      description: trialActivated
        ? (isEn
          ? `Trial active! ${trialDaysRemaining || 0} days remaining`
          : `¡Prueba activa! ${trialDaysRemaining || 0} días restantes`)
        : (isEn
          ? 'Start your free trial to unlock PRO features'
          : 'Inicia tu prueba gratuita para desbloquear funciones PRO'),
      icon: <Sparkles className="w-6 h-6" />,
      action: !trialActivated && canActivateTrial && onActivateTrial ? {
        label: activatingTrial
          ? (isEn ? 'Activating...' : 'Activando...')
          : (isEn ? 'Activate Trial' : 'Activar Prueba'),
        onClick: handleActivateTrial,
        loading: activatingTrial,
      } : undefined,
      completed: trialActivated,
    },
    {
      id: 3,
      title: isEn ? 'Make Your First Recording' : 'Hacer tu Primera Grabación',
      description: isEn
        ? 'Open a webpage, start recording and capture console logs'
        : 'Abre una web, inicia grabación y captura los logs de consola',
      icon: <Rocket className="w-6 h-6" />,
      completed: firstRecording,
    },
    {
      id: 4,
      title: isEn ? 'Connect MCP to Claude' : 'Conectar MCP a Claude',
      description: isEn
        ? 'Link your MCP server to Claude Code or Claude Desktop'
        : 'Conecta tu servidor MCP a Claude Code o Claude Desktop',
      icon: <Plug className="w-6 h-6" />,
      action: !mcpConnected ? {
        label: isEn ? 'View Guide' : 'Ver Guía',
        href: `/${locale}/docs#mcp-setup`,
      } : undefined,
      completed: mcpConnected,
    },
  ];

  // Calculate progress
  const completedSteps = steps.filter(s => s.completed).length;
  const progressPercent = (completedSteps / steps.length) * 100;
  const isComplete = completedSteps === steps.length;

  // Auto-collapse when complete
  const showCollapsed = isComplete && isCollapsed;

  // Collapsed view for completed onboarding
  if (showCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border bg-card overflow-hidden"
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <PartyPopper className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-green-600 dark:text-green-400">
                {isEn ? 'Getting Started Complete!' : '¡Primeros Pasos Completados!'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isEn ? 'All 4 steps done' : 'Los 4 pasos completados'}
              </p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </button>
      </motion.div>
    );
  }

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

              {/* Trial error message */}
              {step.id === 2 && trialError && (
                <div className="text-xs text-destructive mt-2">
                  {trialError}
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
                  disabled={step.action.loading}
                  className={cn(
                    "flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    step.action.loading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {step.action.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : step.id === 2 ? (
                    <Sparkles className="w-4 h-4" />
                  ) : null}
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

      {/* Completion message with collapse button */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-t border-green-500/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <PartyPopper className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-600 dark:text-green-400">
                    {isEn ? "You're all set!" : '¡Todo listo!'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isEn
                      ? 'Start debugging with your AI agents.'
                      : 'Comienza a depurar con tus agentes IA.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                {isEn ? 'Collapse' : 'Colapsar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
