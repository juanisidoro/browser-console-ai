'use client';

/**
 * Admin Metrics Dashboard
 *
 * Displays analytics metrics for the Browser Console AI project.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  Download,
  CreditCard,
  Activity,
  Zap,
  BarChart3,
  RefreshCw,
  Info,
} from 'lucide-react';
import type { DailyMetrics, TotalMetrics } from '../../../../shared/core';
import { createEmptyTotalMetrics } from '../../../../shared/core';

type TimeRange = '1d' | '7d' | '30d';

interface MetricsData {
  totals: TotalMetrics;
  daily: DailyMetrics[];
  range: string;
}

// Metric descriptions in Spanish
const METRIC_INFO = {
  totalInstalls: {
    title: 'Total Instalaciones',
    description: 'Número total de veces que la extensión ha sido instalada.',
    usage: 'Indica el alcance y adopción del producto.',
    valuable: 'Crecimiento constante indica buena tracción. Comparar con trials para ver conversión.',
  },
  activeTrials: {
    title: 'Trials Activos',
    description: 'Usuarios actualmente en periodo de prueba de 3 días.',
    usage: 'Mide el interés en features PRO sin compromiso de pago.',
    valuable: 'Alto número = buen interés. Bajo = revisar propuesta de valor o visibilidad del trial.',
  },
  paidUsers: {
    title: 'Usuarios de Pago',
    description: 'Usuarios con suscripción PRO activa.',
    usage: 'El indicador más importante de éxito del negocio.',
    valuable: 'Crecimiento sostenido valida el modelo. Si baja, investigar churn.',
  },
  mrr: {
    title: 'MRR (Monthly Recurring Revenue)',
    description: 'Ingresos mensuales recurrentes de suscripciones activas.',
    usage: 'Métrica financiera clave para SaaS.',
    valuable: 'Base para proyecciones. MRR × 12 = ARR aproximado.',
  },
  conversionFunnel: {
    title: 'Embudo de Conversión',
    description: 'Visualiza el flujo de usuarios desde instalación hasta pago.',
    usage: 'Identifica dónde se pierden usuarios en el proceso.',
    valuable: 'Tasas bajas en un paso = oportunidad de optimización.',
  },
  periodActivity: {
    title: 'Actividad del Periodo',
    description: 'Métricas de uso activo en el rango de tiempo seleccionado.',
    usage: 'Mide engagement y adopción de features.',
    valuable: 'Alta actividad correlaciona con retención y conversión.',
  },
  recordings: {
    title: 'Grabaciones',
    description: 'Total de sesiones de grabación de logs completadas.',
    usage: 'Indica uso activo de la funcionalidad principal.',
    valuable: 'Más grabaciones = más valor percibido. Meta: varias por usuario.',
  },
  registrations: {
    title: 'Registros',
    description: 'Usuarios que crearon cuenta en el sitio web.',
    usage: 'Paso previo a conversión, indica intención seria.',
    valuable: 'Diferencia entre installs y registros muestra fricción.',
  },
  installToTrial: {
    title: 'Instalación → Trial',
    description: 'Porcentaje de instalaciones que activan trial.',
    usage: 'Mide efectividad del onboarding y propuesta de valor.',
    valuable: 'Meta: >20%. Bajo = mejorar descubrimiento de trial o valor percibido.',
  },
  trialToPaid: {
    title: 'Trial → Pago',
    description: 'Porcentaje de trials que convierten a pago.',
    usage: 'La métrica más crítica del modelo freemium.',
    valuable: 'Meta: >5-10%. Bajo = revisar precio, features o experiencia trial.',
  },
  dailyBreakdown: {
    title: 'Desglose Diario',
    description: 'Métricas día a día para el periodo seleccionado.',
    usage: 'Detecta tendencias, picos y anomalías.',
    valuable: 'Útil para correlacionar con lanzamientos o campañas.',
  },
};

export default function MetricsPage() {
  const { firebaseUser } = useAuth();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<TimeRange>('7d');
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      setRefreshing(true);
      const idToken = await firebaseUser.getIdToken();

      const response = await fetch(`/api/analytics?range=${range}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [firebaseUser, range]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
          <p className="text-destructive">{error}</p>
          <button
            onClick={fetchMetrics}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const totals = metrics?.totals || createEmptyTotalMetrics();
  const daily = metrics?.daily || [];

  // Calculate period totals
  const periodTotals = daily.reduce(
    (acc, day) => ({
      installs: acc.installs + day.installs,
      trials: acc.trials + day.trialsActivated,
      registrations: acc.registrations + day.registrations,
      recordings: acc.recordings + day.totalRecordings,
      revenue: acc.revenue + day.revenue,
      conversions: acc.conversions + day.conversions,
    }),
    { installs: 0, trials: 0, registrations: 0, recordings: 0, revenue: 0, conversions: 0 }
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Metrics Dashboard</h1>
          <p className="text-muted-foreground">
            Browser Console AI Analytics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
            {(['1d', '7d', '30d'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  range === r
                    ? 'bg-background text-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r === '1d' ? 'Today' : r === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
          <button
            onClick={fetchMetrics}
            disabled={refreshing}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Total Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Installs"
          value={totals.totalInstalls}
          icon={Download}
          trend={periodTotals.installs}
          trendLabel={`+${periodTotals.installs} this period`}
          info={METRIC_INFO.totalInstalls}
        />
        <StatCard
          title="Active Trials"
          value={totals.activeTrials}
          icon={Zap}
          trend={periodTotals.trials}
          trendLabel={`+${periodTotals.trials} started`}
          info={METRIC_INFO.activeTrials}
        />
        <StatCard
          title="Paid Users"
          value={totals.totalPaidUsers}
          icon={CreditCard}
          trend={periodTotals.conversions}
          trendLabel={`+${periodTotals.conversions} converted`}
          highlight
          info={METRIC_INFO.paidUsers}
        />
        <StatCard
          title="MRR"
          value={`$${totals.mrr.toFixed(2)}`}
          icon={TrendingUp}
          trend={periodTotals.revenue}
          trendLabel={`+$${periodTotals.revenue.toFixed(2)} this period`}
          highlight
          info={METRIC_INFO.mrr}
        />
      </div>

      {/* Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary" />
            Conversion Funnel
            <InfoTooltip info={METRIC_INFO.conversionFunnel} />
          </h2>
          <div className="space-y-4">
            <FunnelStep
              label="Installs"
              value={totals.totalInstalls}
              percentage={100}
              info={METRIC_INFO.totalInstalls}
            />
            <FunnelStep
              label="Trials Started"
              value={totals.totalTrials}
              percentage={totals.installToTrialRate * 100}
              info={METRIC_INFO.activeTrials}
            />
            <FunnelStep
              label="Converted to Paid"
              value={totals.totalPaidUsers}
              percentage={totals.trialToConversionRate * 100}
              highlight
              info={METRIC_INFO.paidUsers}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            Period Activity
            <InfoTooltip info={METRIC_INFO.periodActivity} />
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <MiniStat
              label="Recordings"
              value={periodTotals.recordings}
              info={METRIC_INFO.recordings}
            />
            <MiniStat
              label="Registrations"
              value={periodTotals.registrations}
              info={METRIC_INFO.registrations}
            />
            <MiniStat
              label="Install→Trial"
              value={`${(totals.installToTrialRate * 100).toFixed(1)}%`}
              info={METRIC_INFO.installToTrial}
            />
            <MiniStat
              label="Trial→Paid"
              value={`${(totals.trialToConversionRate * 100).toFixed(1)}%`}
              info={METRIC_INFO.trialToPaid}
            />
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-primary" />
          Daily Breakdown
          <InfoTooltip info={METRIC_INFO.dailyBreakdown} />
        </h2>
        {daily.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No data for selected period
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium">Date</th>
                  <th className="text-right py-2 px-2 font-medium">Installs</th>
                  <th className="text-right py-2 px-2 font-medium">Trials</th>
                  <th className="text-right py-2 px-2 font-medium">Active</th>
                  <th className="text-right py-2 px-2 font-medium">Recordings</th>
                  <th className="text-right py-2 px-2 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((day) => (
                  <tr key={day.date} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-2 px-2">{formatDate(day.date)}</td>
                    <td className="text-right py-2 px-2">{day.installs}</td>
                    <td className="text-right py-2 px-2">{day.trialsActivated}</td>
                    <td className="text-right py-2 px-2">{day.activeInstallations}</td>
                    <td className="text-right py-2 px-2">{day.totalRecordings}</td>
                    <td className="text-right py-2 px-2">
                      {day.revenue > 0 ? `$${day.revenue.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Last Updated */}
      <p className="text-xs text-muted-foreground text-center mt-8">
        Last updated: {new Date(totals.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}

// Types
interface MetricInfoType {
  title: string;
  description: string;
  usage: string;
  valuable: string;
}

// Info Tooltip Component
function InfoTooltip({ info }: { info: MetricInfoType }) {
  return (
    <div className="relative group ml-2">
      <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-72">
        <div className="bg-popover border border-border rounded-lg shadow-lg p-4 text-sm">
          <h4 className="font-semibold text-foreground mb-2">{info.title}</h4>
          <div className="space-y-2 text-muted-foreground">
            <p><span className="font-medium text-foreground">Descripcion:</span> {info.description}</p>
            <p><span className="font-medium text-foreground">Uso:</span> {info.usage}</p>
            <p><span className="font-medium text-foreground">Valioso cuando:</span> {info.valuable}</p>
          </div>
          <div className="absolute left-4 bottom-0 translate-y-full">
            <div className="border-8 border-transparent border-t-border" />
            <div className="absolute top-0 left-0 border-8 border-transparent border-t-popover -translate-y-px" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Components
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  highlight,
  info,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  trendLabel?: string;
  highlight?: boolean;
  info?: MetricInfoType;
}) {
  return (
    <div
      className={`rounded-xl p-6 ${
        highlight
          ? 'bg-primary/10 border border-primary/20'
          : 'bg-card border border-border'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="text-sm text-muted-foreground">{title}</span>
          {info && <InfoTooltip info={info} />}
        </div>
        <Icon className={`h-5 w-5 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <div className="text-3xl font-bold">{value}</div>
      {trendLabel && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center">
          {trend !== undefined && trend > 0 && (
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
          )}
          {trendLabel}
        </p>
      )}
    </div>
  );
}

function FunnelStep({
  label,
  value,
  percentage,
  highlight,
  info,
}: {
  label: string;
  value: number;
  percentage: number;
  highlight?: boolean;
  info?: MetricInfoType;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <span className={`text-sm ${highlight ? 'text-primary font-medium' : ''}`}>
            {label}
          </span>
          {info && <InfoTooltip info={info} />}
        </div>
        <span className="text-sm font-medium">{value}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            highlight ? 'bg-primary' : 'bg-primary/60'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}%</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  info,
}: {
  label: string;
  value: string | number;
  info?: MetricInfoType;
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <div className="flex items-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        {info && <InfoTooltip info={info} />}
      </div>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
