"use client"

import * as React from "react"
import {
  type Locale,
  type Messages,
  getMessages,
  tCountry,
  t,
  getSection,
} from "./i18n"

interface I18nContextValue {
  locale: Locale
  country: string
  messages: Messages
  // Helper functions bound to current locale/country
  t: (key: string) => unknown
  tc: (key: string) => string // tCountry with current country
  section: (key: string) => Messages
}

const I18nContext = React.createContext<I18nContextValue | null>(null)

interface I18nProviderProps {
  locale: Locale
  country: string
  children: React.ReactNode
}

export function I18nProvider({ locale, country, children }: I18nProviderProps) {
  const msgs = getMessages(locale)

  const value: I18nContextValue = React.useMemo(
    () => ({
      locale,
      country,
      messages: msgs,
      t: (key: string) => t(msgs, key),
      tc: (key: string) => tCountry(msgs, key, country),
      section: (key: string) => getSection(msgs, key),
    }),
    [locale, country, msgs]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = React.useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}

/**
 * Hook to get a specific section of translations
 * Useful for components that only need a subset of messages
 */
export function useTranslations(section: string) {
  const { messages, country } = useI18n()
  const sectionMessages = getSection(messages, section)

  return {
    // Get value with country variant support
    tc: (key: string) => tCountry(sectionMessages as Messages, key, country),
    // Get simple value (no variants)
    t: (key: string) => t(sectionMessages as Messages, key),
    // Get raw value
    raw: (key: string) => (sectionMessages as Record<string, unknown>)[key],
  }
}
