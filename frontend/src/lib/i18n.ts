// Supported languages
export type Locale = "en" | "es" | "fr" | "de" | "it" | "pt"

export const defaultLocale: Locale = "en"
export const locales: Locale[] = ["en", "es", "fr", "de", "it", "pt"]

// Country codes for variants
export type CountryCode =
  // English-speaking
  | "UK" | "US" | "AU" | "CA" | "IE" | "NZ"
  // Spanish-speaking
  | "ES" | "MX" | "AR" | "CO" | "CL" | "PE"
  // French-speaking
  | "FR" | "BE" | "CH" | "CA"
  // German-speaking
  | "DE" | "AT" | "CH"
  // Italian-speaking
  | "IT" | "CH"
  // Portuguese-speaking
  | "BR" | "PT"
  // Other European
  | "NL" | "PL" | "SE" | "NO" | "DK" | "FI"
  // Global fallback
  | "GLOBAL"

// Map countries to their primary language
export const countryToLocale: Record<string, Locale> = {
  // English
  US: "en", UK: "en", GB: "en", AU: "en", CA: "en", IE: "en", NZ: "en",
  // Use English for countries without native support
  NL: "en", PL: "en", SE: "en", NO: "en", DK: "en", FI: "en",
  // Spanish
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es",
  // French
  FR: "fr", BE: "fr",
  // German
  DE: "de", AT: "de",
  // Italian
  IT: "it",
  // Portuguese
  BR: "pt", PT: "pt",
  // Swiss - default to German
  CH: "de",
}

// Locale display names
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
}

// Locale flags (emoji)
export const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  it: "🇮🇹",
  pt: "🇧🇷",
}

// Message types
export interface Messages {
  [key: string]: string | Messages | boolean | unknown[]
}

// Import messages statically for SSR
import enMessages from "@/messages/en.json"
import esMessages from "@/messages/es.json"
import frMessages from "@/messages/fr.json"
import deMessages from "@/messages/de.json"
import itMessages from "@/messages/it.json"
import ptMessages from "@/messages/pt.json"

// Messages by locale
export const messages: Record<Locale, Messages> = {
  en: enMessages as Messages,
  es: esMessages as Messages,
  fr: frMessages as Messages,
  de: deMessages as Messages,
  it: itMessages as Messages,
  pt: ptMessages as Messages,
}

/**
 * Get messages for a specific locale
 */
export function getMessages(locale: Locale): Messages {
  return messages[locale] || messages[defaultLocale]
}

/**
 * Get a translation value with country variant support
 *
 * @param msgs - The messages object for the current locale
 * @param key - The key to look up (supports dot notation: "hero.title")
 * @param country - The country code for variants (e.g., "UK", "DE", "BR")
 * @returns The translation string (variant if exists, otherwise global)
 *
 * @example
 * // Messages structure:
 * // {
 * //   "hero": {
 * //     "title_global": "Debug with AI",
 * //     "title_variants": { "UK": "Supercharge Debugging", "DE": "KI Debugging" }
 * //   }
 * // }
 *
 * tCountry(msgs, "hero.title", "UK") // => "Supercharge Debugging"
 * tCountry(msgs, "hero.title", "US") // => "Debug with AI" (falls back to global)
 */
export function tCountry(
  msgs: Messages,
  key: string,
  country: string = "GLOBAL"
): string {
  const keys = key.split(".")
  const lastKey = keys.pop()!

  // Navigate to the parent object
  let current: unknown = msgs
  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = (current as Record<string, unknown>)[k]
    } else {
      return key // Key not found, return the key itself
    }
  }

  if (!current || typeof current !== "object") {
    return key
  }

  const parent = current as Record<string, unknown>

  // Check for variant
  const variantsKey = `${lastKey}_variants`
  const globalKey = `${lastKey}_global`

  // If variants exist, try to get country-specific version
  if (variantsKey in parent && typeof parent[variantsKey] === "object") {
    const variants = parent[variantsKey] as Record<string, string>
    if (country in variants) {
      return variants[country]
    }
  }

  // Fall back to global version
  if (globalKey in parent) {
    return parent[globalKey] as string
  }

  // Fall back to direct key (for non-variant fields)
  if (lastKey in parent) {
    const value = parent[lastKey]
    if (typeof value === "string") {
      return value
    }
  }

  return key
}

/**
 * Simple translation function (no variants)
 * Use for non-variant content like nav, footer, etc.
 */
export function t(msgs: Messages, key: string): unknown {
  const keys = key.split(".")
  let current: unknown = msgs

  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = (current as Record<string, unknown>)[k]
    } else {
      return key
    }
  }

  return current ?? key
}

/**
 * Get nested object from messages
 */
export function getSection(msgs: Messages, section: string): Messages {
  const keys = section.split(".")
  let current: unknown = msgs

  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = (current as Record<string, unknown>)[k]
    } else {
      return {}
    }
  }

  return (current as Messages) ?? {}
}

// Legacy support - keep old translations object for backwards compatibility
// This will be gradually phased out
export const translations = {
  en: messages.en,
  es: messages.es,
}
