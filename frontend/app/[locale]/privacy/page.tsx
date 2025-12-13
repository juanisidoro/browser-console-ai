'use client';

/**
 * Privacy Policy Page
 *
 * Comprehensive privacy policy for Browser Console AI
 * Compliant with GDPR, CCPA, and other privacy regulations
 */

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useI18n } from '@/lib/i18n-context';

export default function PrivacyPage() {
  const { locale } = useI18n();

  const lastUpdated = '2025-01-15';

  return (
    <>
      <Header locale={locale} />
      <main className="pt-32 pb-20 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">
            {locale === 'en' ? 'Privacy Policy' : 'Politica de Privacidad'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {locale === 'en'
              ? `Last updated: ${lastUpdated}`
              : `Ultima actualizacion: ${lastUpdated}`}
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {locale === 'en' ? 'Introduction' : 'Introduccion'}
              </h2>
              <p className="text-muted-foreground">
                {locale === 'en'
                  ? 'Browser Console AI ("we", "our", or "us") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our Chrome extension and web services.'
                  : 'Browser Console AI ("nosotros") esta comprometido con la proteccion de tu privacidad. Esta politica explica como recopilamos, usamos y protegemos tu informacion cuando usas nuestra extension de Chrome y servicios web.'}
              </p>
            </section>

            {/* What We Collect */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {locale === 'en' ? 'What We Collect' : 'Que Recopilamos'}
              </h2>

              <h3 className="text-xl font-medium mt-6 mb-3">
                {locale === 'en' ? 'Account Information' : 'Informacion de Cuenta'}
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>{locale === 'en' ? 'Email address (for authentication and communication)' : 'Direccion de email (para autenticacion y comunicacion)'}</li>
                <li>{locale === 'en' ? 'Display name (optional)' : 'Nombre de usuario (opcional)'}</li>
                <li>{locale === 'en' ? 'Subscription status' : 'Estado de suscripcion'}</li>
              </ul>

              <h3 className="text-xl font-medium mt-6 mb-3">
                {locale === 'en' ? 'Extension Analytics (with consent)' : 'Analiticas de Extension (con consentimiento)'}
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>{locale === 'en' ? 'Anonymous installation ID (randomly generated UUID, not linked to your device)' : 'ID de instalacion anonimo (UUID aleatorio, no vinculado a tu dispositivo)'}</li>
                <li>{locale === 'en' ? 'Browser type and version' : 'Tipo y version de navegador'}</li>
                <li>{locale === 'en' ? 'Operating system' : 'Sistema operativo'}</li>
                <li>{locale === 'en' ? 'Extension version' : 'Version de la extension'}</li>
                <li>{locale === 'en' ? 'Feature usage events (which features you use)' : 'Eventos de uso de funciones (que funciones usas)'}</li>
              </ul>
            </section>

            {/* What We DON'T Collect */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {locale === 'en' ? 'What We DO NOT Collect' : 'Que NO Recopilamos'}
              </h2>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>{locale === 'en' ? 'Console log contents' : 'Contenido de logs de consola'}</strong> - {locale === 'en' ? 'Your logs stay on your local machine and are never sent to our servers' : 'Tus logs permanecen en tu maquina local y nunca se envian a nuestros servidores'}</li>
                  <li><strong>{locale === 'en' ? 'Browsing history' : 'Historial de navegacion'}</strong> - {locale === 'en' ? 'We don\'t track which websites you visit' : 'No rastreamos que sitios web visitas'}</li>
                  <li><strong>{locale === 'en' ? 'Personal files' : 'Archivos personales'}</strong> - {locale === 'en' ? 'We have no access to your file system' : 'No tenemos acceso a tu sistema de archivos'}</li>
                  <li><strong>{locale === 'en' ? 'Device fingerprints' : 'Huellas de dispositivo'}</strong> - {locale === 'en' ? 'We don\'t use fingerprinting techniques to track you' : 'No usamos tecnicas de fingerprinting para rastrearte'}</li>
                  <li><strong>{locale === 'en' ? 'IP addresses' : 'Direcciones IP'}</strong> - {locale === 'en' ? 'We don\'t store your IP address in analytics' : 'No almacenamos tu direccion IP en analiticas'}</li>
                </ul>
              </div>
            </section>

            {/* How We Use Data */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {locale === 'en' ? 'How We Use Your Data' : 'Como Usamos tus Datos'}
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>{locale === 'en' ? 'Product improvement' : 'Mejora del producto'}</strong> - {locale === 'en' ? 'Understanding which features are popular helps us prioritize development' : 'Entender que funciones son populares nos ayuda a priorizar el desarrollo'}</li>
                <li><strong>{locale === 'en' ? 'Bug fixing' : 'Correccion de errores'}</strong> - {locale === 'en' ? 'Error tracking helps us identify and fix issues quickly' : 'El seguimiento de errores nos ayuda a identificar y corregir problemas rapidamente'}</li>
                <li><strong>{locale === 'en' ? 'License management' : 'Gestion de licencias'}</strong> - {locale === 'en' ? 'Verifying your subscription status' : 'Verificacion de tu estado de suscripcion'}</li>
                <li><strong>{locale === 'en' ? 'Communication' : 'Comunicacion'}</strong> - {locale === 'en' ? 'Sending important updates about your account (never spam)' : 'Envio de actualizaciones importantes sobre tu cuenta (nunca spam)'}</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {locale === 'en' ? 'Your Rights & Controls' : 'Tus Derechos y Controles'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {locale === 'en'
                  ? 'You have full control over your data:'
                  : 'Tienes control total sobre tus datos:'}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>{locale === 'en' ? 'Opt-out of analytics' : 'Desactivar analiticas'}</strong> - {locale === 'en' ? 'Toggle off analytics in the extension\'s Privacy settings tab' : 'Desactiva las analiticas en la pestana de Privacidad de la extension'}</li>
                <li><strong>{locale === 'en' ? 'Delete your account' : 'Eliminar tu cuenta'}</strong> - {locale === 'en' ? 'Contact us to delete all your data' : 'Contactanos para eliminar todos tus datos'}</li>
                <li><strong>{locale === 'en' ? 'Export your data' : 'Exportar tus datos'}</strong> - {locale === 'en' ? 'Request a copy of your data' : 'Solicita una copia de tus datos'}</li>
                <li><strong>{locale === 'en' ? 'Correct your data' : 'Corregir tus datos'}</strong> - {locale === 'en' ? 'Update your account information anytime' : 'Actualiza la informacion de tu cuenta en cualquier momento'}</li>
              </ul>
            </section>

            {/* Essential vs Non-Essential */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {locale === 'en' ? 'Essential vs Non-Essential Data' : 'Datos Esenciales vs No Esenciales'}
              </h2>

              <h3 className="text-xl font-medium mt-6 mb-3">
                {locale === 'en' ? 'Essential Data (always collected)' : 'Datos Esenciales (siempre recopilados)'}
              </h3>
              <p className="text-muted-foreground mb-2">
                {locale === 'en'
                  ? 'Required for the product to function:'
                  : 'Necesarios para que el producto funcione:'}
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>{locale === 'en' ? 'License verification events' : 'Eventos de verificacion de licencia'}</li>
                <li>{locale === 'en' ? 'Critical error reports' : 'Reportes de errores criticos'}</li>
                <li>{locale === 'en' ? 'Subscription events' : 'Eventos de suscripcion'}</li>
              </ul>

              <h3 className="text-xl font-medium mt-6 mb-3">
                {locale === 'en' ? 'Non-Essential Data (opt-in)' : 'Datos No Esenciales (opcional)'}
              </h3>
              <p className="text-muted-foreground mb-2">
                {locale === 'en'
                  ? 'Only collected with your consent:'
                  : 'Solo recopilados con tu consentimiento:'}
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>{locale === 'en' ? 'Feature usage analytics' : 'Analiticas de uso de funciones'}</li>
                <li>{locale === 'en' ? 'UI interaction events' : 'Eventos de interaccion con la interfaz'}</li>
                <li>{locale === 'en' ? 'Performance metrics' : 'Metricas de rendimiento'}</li>
              </ul>
            </section>

            {/* Third Parties */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {locale === 'en' ? 'Third-Party Services' : 'Servicios de Terceros'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {locale === 'en'
                  ? 'We use the following third-party services:'
                  : 'Usamos los siguientes servicios de terceros:'}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Firebase</strong> - {locale === 'en' ? 'Authentication and user management' : 'Autenticacion y gestion de usuarios'}</li>
                <li><strong>Stripe</strong> - {locale === 'en' ? 'Payment processing (we never see your card details)' : 'Procesamiento de pagos (nunca vemos los detalles de tu tarjeta)'}</li>
                <li><strong>Vercel</strong> - {locale === 'en' ? 'Website hosting' : 'Alojamiento web'}</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                {locale === 'en'
                  ? 'Each service has its own privacy policy. We encourage you to review them.'
                  : 'Cada servicio tiene su propia politica de privacidad. Te animamos a revisarlas.'}
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {locale === 'en' ? 'Data Retention' : 'Retencion de Datos'}
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>{locale === 'en' ? 'Account data' : 'Datos de cuenta'}</strong> - {locale === 'en' ? 'Kept while your account is active' : 'Se mantienen mientras tu cuenta este activa'}</li>
                <li><strong>{locale === 'en' ? 'Analytics data' : 'Datos de analiticas'}</strong> - {locale === 'en' ? 'Aggregated and anonymized after 90 days' : 'Agregados y anonimizados despues de 90 dias'}</li>
                <li><strong>{locale === 'en' ? 'Console logs' : 'Logs de consola'}</strong> - {locale === 'en' ? 'Never stored on our servers (local only)' : 'Nunca almacenados en nuestros servidores (solo local)'}</li>
              </ul>
            </section>

            {/* GDPR/CCPA */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {locale === 'en' ? 'GDPR & CCPA Compliance' : 'Cumplimiento GDPR y CCPA'}
              </h2>
              <p className="text-muted-foreground">
                {locale === 'en'
                  ? 'We comply with the General Data Protection Regulation (GDPR) for EU users and the California Consumer Privacy Act (CCPA) for California residents. You have the right to access, correct, delete, and port your data. To exercise these rights, contact us at the email below.'
                  : 'Cumplimos con el Reglamento General de Proteccion de Datos (GDPR) para usuarios de la UE y la Ley de Privacidad del Consumidor de California (CCPA) para residentes de California. Tienes derecho a acceder, corregir, eliminar y portar tus datos. Para ejercer estos derechos, contactanos en el email de abajo.'}
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {locale === 'en' ? 'Contact Us' : 'Contacto'}
              </h2>
              <p className="text-muted-foreground">
                {locale === 'en'
                  ? 'For privacy-related questions or to exercise your rights:'
                  : 'Para preguntas relacionadas con privacidad o para ejercer tus derechos:'}
              </p>
              <p className="mt-2">
                <a href="mailto:privacy@browserconsoleai.com" className="text-primary hover:underline">
                  privacy@browserconsoleai.com
                </a>
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {locale === 'en' ? 'Changes to This Policy' : 'Cambios en Esta Politica'}
              </h2>
              <p className="text-muted-foreground">
                {locale === 'en'
                  ? 'We may update this policy from time to time. We will notify you of significant changes via email or in-app notification. Your continued use after changes constitutes acceptance of the updated policy.'
                  : 'Podemos actualizar esta politica de vez en cuando. Te notificaremos de cambios significativos por email o notificacion en la aplicacion. Tu uso continuado despues de los cambios constituye aceptacion de la politica actualizada.'}
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
