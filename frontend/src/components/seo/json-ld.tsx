import type { Locale } from "@/lib/i18n"

const baseUrl = "https://browserconsoleai.com"

interface JsonLdProps {
  locale: Locale
}

/**
 * Organization Schema - Use in root layout or homepage
 */
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Browser Console AI",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "AI-powered browser console debugging tool for developers",
    "sameAs": [
      "https://github.com/browserconsoleai",
      "https://twitter.com/browserconsoleai"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "contact@browserconsoleai.com",
      "contactType": "customer support"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Software Application Schema - Use on homepage and features page
 */
export function SoftwareApplicationSchema({ locale }: JsonLdProps) {
  const descriptions: Record<Locale, string> = {
    en: "Connect your browser console directly to AI assistants. Capture logs, analyze errors, and debug faster.",
    es: "Conecta tu consola del navegador directamente a asistentes de IA. Captura logs, analiza errores y depura mas rapido.",
    fr: "Connectez votre console navigateur directement aux assistants IA. Capturez les logs et analysez les erreurs.",
    de: "Verbinden Sie Ihre Browser-Konsole direkt mit KI-Assistenten. Erfassen Sie Logs und analysieren Sie Fehler.",
    it: "Connetti la tua console browser direttamente agli assistenti IA. Cattura i log e analizza gli errori.",
    pt: "Conecte o console do seu navegador diretamente a assistentes de IA. Capture logs e analise erros."
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Browser Console AI",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Chrome, Edge, Firefox",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": descriptions[locale],
    "url": `${baseUrl}/${locale}`,
    "downloadUrl": "https://chrome.google.com/webstore",
    "softwareVersion": "1.0.0",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "50"
    },
    "featureList": [
      "Real-time console log capture",
      "AI-powered error analysis",
      "MCP protocol support",
      "Privacy-first design",
      "Zero configuration setup"
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * WebSite Schema with SearchAction - Use in root layout
 */
export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Browser Console AI",
    "url": baseUrl,
    "description": "AI-powered browser console debugging tool",
    "inLanguage": ["en", "es", "fr", "de", "it", "pt"],
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * HowTo Schema - Use on installation/docs page
 */
export function HowToSchema({ locale }: JsonLdProps) {
  const steps: Record<Locale, { name: string; text: string }[]> = {
    en: [
      { name: "Install Extension", text: "Visit Chrome Web Store and click 'Add to Chrome' to install the extension." },
      { name: "Connect to AI", text: "Open your AI assistant (Claude, etc.) and configure Browser Console AI as your tool." },
      { name: "Start Debugging", text: "Open DevTools console and watch your logs flow to your AI assistant in real-time." }
    ],
    es: [
      { name: "Instalar Extension", text: "Visita Chrome Web Store y haz clic en 'Agregar a Chrome' para instalar la extension." },
      { name: "Conectar a IA", text: "Abre tu asistente de IA (Claude, etc.) y configura Browser Console AI como tu herramienta." },
      { name: "Comenzar Debugging", text: "Abre la consola DevTools y observa tus logs fluir hacia tu asistente de IA en tiempo real." }
    ],
    fr: [
      { name: "Installer l'Extension", text: "Visitez Chrome Web Store et cliquez sur 'Ajouter a Chrome' pour installer l'extension." },
      { name: "Connecter a l'IA", text: "Ouvrez votre assistant IA (Claude, etc.) et configurez Browser Console AI comme votre outil." },
      { name: "Commencer le Debogage", text: "Ouvrez la console DevTools et regardez vos logs s'ecouler vers votre assistant IA en temps reel." }
    ],
    de: [
      { name: "Erweiterung Installieren", text: "Besuchen Sie den Chrome Web Store und klicken Sie auf 'Zu Chrome hinzufugen'." },
      { name: "Mit KI Verbinden", text: "Offnen Sie Ihren KI-Assistenten (Claude, etc.) und konfigurieren Sie Browser Console AI." },
      { name: "Debugging Starten", text: "Offnen Sie die DevTools-Konsole und beobachten Sie Ihre Logs in Echtzeit." }
    ],
    it: [
      { name: "Installa l'Estensione", text: "Visita Chrome Web Store e clicca su 'Aggiungi a Chrome' per installare l'estensione." },
      { name: "Connetti all'IA", text: "Apri il tuo assistente IA (Claude, etc.) e configura Browser Console AI come tuo strumento." },
      { name: "Inizia il Debug", text: "Apri la console DevTools e guarda i tuoi log fluire verso il tuo assistente IA in tempo reale." }
    ],
    pt: [
      { name: "Instalar Extensao", text: "Visite a Chrome Web Store e clique em 'Adicionar ao Chrome' para instalar a extensao." },
      { name: "Conectar a IA", text: "Abra seu assistente de IA (Claude, etc.) e configure o Browser Console AI como sua ferramenta." },
      { name: "Iniciar Debug", text: "Abra o console DevTools e veja seus logs fluirem para seu assistente de IA em tempo real." }
    ]
  }

  const localizedSteps = steps[locale] || steps.en

  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": locale === "en" ? "How to Install Browser Console AI" :
            locale === "es" ? "Como Instalar Browser Console AI" :
            locale === "fr" ? "Comment Installer Browser Console AI" :
            locale === "de" ? "So Installieren Sie Browser Console AI" :
            locale === "it" ? "Come Installare Browser Console AI" :
            "Como Instalar Browser Console AI",
    "description": "Step-by-step guide to install and configure Browser Console AI",
    "totalTime": "PT5M",
    "step": localizedSteps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * BreadcrumbList Schema - Use on inner pages
 */
interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbSchema({ items, locale }: { items: BreadcrumbItem[]; locale: Locale }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * FAQ Schema - Use on FAQ or features page
 */
interface FAQItem {
  question: string
  answer: string
}

export function FAQSchema({ items }: { items: FAQItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
