import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PricingCard } from "@/features/billing"
import { getMessages, type Locale } from "@/lib/i18n"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing - Browser Console AI",
  description: "Start free, upgrade to Pro for unlimited logs, MCP integration, and advanced features. Early access: $9/month.",
}

export default async function PricingPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params
  const msgs = getMessages(locale)
  const pricing = msgs.pricing as Record<string, unknown>
  const free = pricing.free as Record<string, unknown>
  const pro = pricing.pro as Record<string, unknown>

  return (
    <>
      <Header locale={locale} />
      <main className="pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">{pricing.title as string}</h1>
            <p className="text-lg text-muted-foreground">{pricing.subtitle as string}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <PricingCard
              plan="free"
              price={free.price as string}
              period={free.period as string}
              features={free.features as string[]}
            />

            {/* Pro Plan */}
            <PricingCard
              plan="pro"
              price={pro.price as string}
              period={pro.period as string}
              features={pro.features as string[]}
              highlighted
              badge={locale === 'en' ? 'Early Access' : 'Acceso Anticipado'}
            />
          </div>

          {/* FAQ or additional info */}
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              {locale === 'en'
                ? 'Early access pricing is available for a limited time. Lock in $9/month before we increase to $12/month. Cancel anytime.'
                : 'El precio de acceso anticipado está disponible por tiempo limitado. Asegura $9/mes antes de que aumente a $12/mes. Cancela cuando quieras.'}
            </p>
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
