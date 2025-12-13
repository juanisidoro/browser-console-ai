'use client';

/**
 * Settings Page
 *
 * User account settings and preferences.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/features/auth';
import { useI18n } from '@/lib/i18n-context';
import {
  Loader2,
  User,
  Bell,
  Shield,
  Trash2,
  ArrowLeft,
  Mail,
  Key,
  ExternalLink,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { locale } = useI18n();
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    productUpdates: true,
    securityAlerts: true,
    marketingEmails: false,
  });

  const isEn = locale === 'en';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/auth/login?redirect=settings`);
    }
  }, [authLoading, user, router, locale]);

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save preferences to Firestore
    await new Promise(resolve => setTimeout(resolve, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'account', label: isEn ? 'Account' : 'Cuenta', icon: User },
    { id: 'notifications', label: isEn ? 'Notifications' : 'Notificaciones', icon: Bell },
    { id: 'privacy', label: isEn ? 'Privacy' : 'Privacidad', icon: Shield },
  ];

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
          {/* Back link */}
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {isEn ? 'Back to Dashboard' : 'Volver al Panel'}
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              {isEn ? 'Settings' : 'Configuración'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEn
                ? 'Manage your account settings and preferences'
                : 'Gestiona tu cuenta y preferencias'}
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar / Tabs */}
            <div className="lg:col-span-1">
              <nav className="flex lg:flex-col gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full text-left",
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="rounded-xl border bg-card">
                {/* Account Tab */}
                {activeTab === 'account' && (
                  <div className="divide-y">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-1">
                        {isEn ? 'Account Information' : 'Información de Cuenta'}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {isEn
                          ? 'Your personal account details'
                          : 'Detalles de tu cuenta personal'}
                      </p>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Email */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Mail className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{isEn ? 'Email' : 'Correo'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {isEn ? 'Verified' : 'Verificado'}
                        </span>
                      </div>

                      {/* Display Name */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{isEn ? 'Name' : 'Nombre'}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.displayName || (isEn ? 'Not set' : 'No configurado')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Key className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{isEn ? 'Password' : 'Contraseña'}</p>
                            <p className="text-sm text-muted-foreground">••••••••</p>
                          </div>
                        </div>
                        <button className="text-sm text-primary hover:underline">
                          {isEn ? 'Change' : 'Cambiar'}
                        </button>
                      </div>
                    </div>

                    {/* Subscription link */}
                    <div className="p-6">
                      <Link
                        href={`/${locale}/dashboard`}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">
                            {isEn ? 'Subscription & Billing' : 'Suscripción y Facturación'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {isEn
                              ? 'Manage your plan and payment methods'
                              : 'Gestiona tu plan y métodos de pago'}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="divide-y">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-1">
                        {isEn ? 'Email Notifications' : 'Notificaciones por Email'}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {isEn
                          ? 'Choose what emails you want to receive'
                          : 'Elige qué emails quieres recibir'}
                      </p>
                    </div>

                    <div className="p-6 space-y-4">
                      {[
                        {
                          key: 'emailNotifications',
                          title: isEn ? 'Essential notifications' : 'Notificaciones esenciales',
                          desc: isEn ? 'Account security and important updates' : 'Seguridad de cuenta y actualizaciones importantes',
                          disabled: true,
                        },
                        {
                          key: 'productUpdates',
                          title: isEn ? 'Product updates' : 'Actualizaciones del producto',
                          desc: isEn ? 'New features and improvements' : 'Nuevas funciones y mejoras',
                        },
                        {
                          key: 'securityAlerts',
                          title: isEn ? 'Security alerts' : 'Alertas de seguridad',
                          desc: isEn ? 'Unusual activity and login attempts' : 'Actividad inusual e intentos de inicio de sesión',
                        },
                        {
                          key: 'marketingEmails',
                          title: isEn ? 'Marketing emails' : 'Emails de marketing',
                          desc: isEn ? 'Tips, offers and promotions' : 'Consejos, ofertas y promociones',
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between py-2"
                        >
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences[item.key as keyof typeof preferences]}
                              onChange={(e) => setPreferences({
                                ...preferences,
                                [item.key]: e.target.checked
                              })}
                              disabled={item.disabled}
                              className="sr-only peer"
                            />
                            <div className={cn(
                              "w-11 h-6 rounded-full peer-focus:ring-2 peer-focus:ring-primary/20 transition-colors",
                              "after:content-[''] after:absolute after:top-[2px] after:left-[2px]",
                              "after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all",
                              preferences[item.key as keyof typeof preferences]
                                ? "bg-primary after:translate-x-5"
                                : "bg-muted after:translate-x-0",
                              item.disabled && "opacity-50 cursor-not-allowed"
                            )} />
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 flex justify-end">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                          saved
                            ? "bg-green-500 text-white"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : saved ? (
                          <Check className="w-4 h-4" />
                        ) : null}
                        {saving
                          ? (isEn ? 'Saving...' : 'Guardando...')
                          : saved
                            ? (isEn ? 'Saved!' : '¡Guardado!')
                            : (isEn ? 'Save Changes' : 'Guardar Cambios')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="divide-y">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-1">
                        {isEn ? 'Privacy & Data' : 'Privacidad y Datos'}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {isEn
                          ? 'Control your data and privacy settings'
                          : 'Controla tus datos y configuración de privacidad'}
                      </p>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Data export */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{isEn ? 'Export your data' : 'Exportar tus datos'}</p>
                          <p className="text-sm text-muted-foreground">
                            {isEn
                              ? 'Download a copy of all your data'
                              : 'Descarga una copia de todos tus datos'}
                          </p>
                        </div>
                        <button className="text-sm text-primary hover:underline">
                          {isEn ? 'Request export' : 'Solicitar exportación'}
                        </button>
                      </div>

                      {/* Analytics */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{isEn ? 'Usage analytics' : 'Analíticas de uso'}</p>
                          <p className="text-sm text-muted-foreground">
                            {isEn
                              ? 'Help us improve by sharing anonymous usage data'
                              : 'Ayúdanos a mejorar compartiendo datos de uso anónimos'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-primary rounded-full peer-focus:ring-2 peer-focus:ring-primary/20 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                        </label>
                      </div>
                    </div>

                    {/* Danger zone */}
                    <div className="p-6">
                      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                        <div className="flex items-start gap-3">
                          <Trash2 className="w-5 h-5 text-destructive mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-destructive">
                              {isEn ? 'Delete Account' : 'Eliminar Cuenta'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {isEn
                                ? 'Permanently delete your account and all associated data. This action cannot be undone.'
                                : 'Elimina permanentemente tu cuenta y todos los datos asociados. Esta acción no se puede deshacer.'}
                            </p>
                            <button className="mt-3 text-sm text-destructive hover:underline font-medium">
                              {isEn ? 'Delete my account' : 'Eliminar mi cuenta'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
