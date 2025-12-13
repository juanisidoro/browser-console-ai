import type React from "react"
import type { Metadata } from "next"
import { type Locale, locales, getMessages } from "@/lib/i18n"
import { I18nProvider } from "@/lib/i18n-context"
import { detectCountry } from "@/lib/detect-country"
import { notFound } from "next/navigation"
import { HtmlLang } from "@/components/seo/html-lang"

const baseUrl = "https://browserconsoleai.com"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale }
}): Promise<Metadata> {
  const { locale } = params
  const msgs = getMessages(locale)

  // Build hreflang alternates
  const languages: Record<string, string> = {}
  for (const l of locales) {
    languages[l] = `${baseUrl}/${l}`
  }
  languages["x-default"] = `${baseUrl}/en`

  return {
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages,
    },
    openGraph: {
      locale: locale === "en" ? "en_US" :
              locale === "es" ? "es_ES" :
              locale === "fr" ? "fr_FR" :
              locale === "de" ? "de_DE" :
              locale === "it" ? "it_IT" :
              locale === "pt" ? "pt_BR" : "en_US",
      alternateLocale: locales.filter(l => l !== locale).map(l =>
        l === "en" ? "en_US" :
        l === "es" ? "es_ES" :
        l === "fr" ? "fr_FR" :
        l === "de" ? "de_DE" :
        l === "it" ? "it_IT" :
        l === "pt" ? "pt_BR" : "en_US"
      ),
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: Locale }
}) {
  const { locale } = params

  if (!locales.includes(locale)) {
    notFound()
  }

  // Detect country for localized variants
  const country = await detectCountry()

  return (
    <I18nProvider locale={locale} country={country}>
      <HtmlLang />
      {children}
    </I18nProvider>
  )
}
