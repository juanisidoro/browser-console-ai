import { Header } from "@/components/header"
import { AnimatedHero } from "@/components/landing/animated-hero"
import { ProblemSolution } from "@/components/landing/problem-solution"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { HowItWorks } from "@/components/landing/how-it-works"
import { EmailCapture } from "@/components/landing/email-capture"
import { FinalCTA } from "@/components/landing/final-cta"
import { Footer } from "@/components/footer"
import { type Locale, locales, getMessages } from "@/lib/i18n"
import type { Metadata } from "next"
import { OrganizationSchema, SoftwareApplicationSchema, HowToSchema } from "@/components/seo/json-ld"

const baseUrl = "https://browserconsoleai.com"

// SEO metadata per locale
const seoData: Record<Locale, { title: string; description: string; keywords: string[] }> = {
  en: {
    title: "Browser Console AI - Debug with AI in Real Time",
    description: "Connect your browser console directly to AI assistants like Claude. Capture logs, analyze errors instantly, and debug smarter with AI-powered insights.",
    keywords: ["browser console", "AI debugging", "Chrome extension", "developer tools", "Claude AI", "MCP"]
  },
  es: {
    title: "Browser Console AI - Depura con IA en Tiempo Real",
    description: "Conecta tu consola del navegador directamente a asistentes de IA como Claude. Captura logs, analiza errores al instante y depura de forma inteligente.",
    keywords: ["consola navegador", "depuracion IA", "extension Chrome", "herramientas desarrollo", "Claude AI", "MCP"]
  },
  fr: {
    title: "Browser Console AI - Deboguez avec l'IA en Temps Reel",
    description: "Connectez votre console navigateur directement aux assistants IA comme Claude. Capturez les logs, analysez les erreurs instantanement.",
    keywords: ["console navigateur", "debogage IA", "extension Chrome", "outils developpeur", "Claude AI", "MCP"]
  },
  de: {
    title: "Browser Console AI - Debuggen Sie mit KI in Echtzeit",
    description: "Verbinden Sie Ihre Browser-Konsole direkt mit KI-Assistenten wie Claude. Erfassen Sie Logs, analysieren Sie Fehler sofort und debuggen Sie intelligenter.",
    keywords: ["Browser-Konsole", "KI-Debugging", "Chrome-Erweiterung", "Entwicklertools", "Claude AI", "MCP"]
  },
  it: {
    title: "Browser Console AI - Debug con IA in Tempo Reale",
    description: "Connetti la tua console browser direttamente agli assistenti IA come Claude. Cattura i log, analizza gli errori istantaneamente e fai debug in modo intelligente.",
    keywords: ["console browser", "debug IA", "estensione Chrome", "strumenti sviluppo", "Claude AI", "MCP"]
  },
  pt: {
    title: "Browser Console AI - Debug com IA em Tempo Real",
    description: "Conecte o console do seu navegador diretamente a assistentes de IA como Claude. Capture logs, analise erros instantaneamente e depure de forma inteligente.",
    keywords: ["console navegador", "debug IA", "extensao Chrome", "ferramentas desenvolvimento", "Claude AI", "MCP"]
  }
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const { locale } = params
  const seo = seoData[locale] || seoData.en // Fallback to English

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: "Browser Console AI" }],
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "website",
      url: `${baseUrl}/${locale}`,
      images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630, alt: "Browser Console AI" }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [`${baseUrl}/twitter-image.png`],
    },
  }
}

export default async function Home({ params }: { params: { locale: Locale } }) {
  const { locale } = params

  return (
    <>
      {/* JSON-LD Structured Data */}
      <OrganizationSchema />
      <SoftwareApplicationSchema locale={locale} />
      <HowToSchema locale={locale} />

      <Header locale={locale} />
      <main>
        {/* Hero Section - Main value proposition */}
        <AnimatedHero locale={locale} />

        {/* Problem/Solution - Why this extension */}
        <ProblemSolution locale={locale} />

        {/* Features Grid - Key capabilities */}
        <FeaturesGrid locale={locale} />

        {/* How It Works - Simple 3-step process */}
        <HowItWorks locale={locale} />

        {/* Email Capture - Newsletter signup */}
        <EmailCapture locale={locale} />

        {/* Final CTA - Last conversion opportunity */}
        <FinalCTA locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  )
}
