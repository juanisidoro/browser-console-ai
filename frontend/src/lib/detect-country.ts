import { headers } from "next/headers"
import { countryToLocale, type Locale, defaultLocale } from "./i18n"

/**
 * Detect country from request headers (SSR)
 *
 * Works with:
 * - Vercel: x-vercel-ip-country
 * - Cloudflare: cf-ipcountry
 * - AWS CloudFront: cloudfront-viewer-country
 * - Generic: x-country
 *
 * @returns Country code (e.g., "UK", "DE", "BR") or "GLOBAL" if not detected
 */
export async function detectCountry(): Promise<string> {
  try {
    const headersList = await headers()

    // Try different header formats from various CDNs
    const country =
      headersList.get("x-vercel-ip-country") ||
      headersList.get("cf-ipcountry") ||
      headersList.get("cloudfront-viewer-country") ||
      headersList.get("x-country") ||
      null

    if (country) {
      // Normalize country code (e.g., "gb" -> "UK")
      const normalized = country.toUpperCase()
      // Handle GB -> UK mapping
      if (normalized === "GB") return "UK"
      return normalized
    }

    return "GLOBAL"
  } catch {
    // If headers() is called outside of a request context, return GLOBAL
    return "GLOBAL"
  }
}

/**
 * Get the best locale for a detected country
 * Use this when you want to auto-redirect users based on their country
 */
export function getLocaleForCountry(country: string): Locale {
  const normalizedCountry = country.toUpperCase()

  // Handle GB -> UK mapping
  const countryKey = normalizedCountry === "GB" ? "UK" : normalizedCountry

  return countryToLocale[countryKey] || defaultLocale
}

/**
 * Detect country from client-side (fallback)
 * Only use this if SSR detection fails
 */
export async function detectCountryClient(): Promise<string> {
  try {
    const response = await fetch("https://ipapi.co/json/", {
      cache: "force-cache",
    })
    const data = await response.json()
    return data.country_code || "GLOBAL"
  } catch {
    return "GLOBAL"
  }
}

/**
 * Countries that have specific variants defined
 * Use this to show "localized" badge or content
 */
export const countriesWithVariants: Record<Locale, string[]> = {
  en: ["UK", "US", "DE", "NL"],
  es: ["ES", "MX", "AR"],
  fr: ["FR", "BE", "CH"],
  de: ["DE", "AT", "CH"],
  it: ["IT", "CH"],
  pt: ["BR", "PT"],
}

/**
 * Check if a country has specific variants for a locale
 */
export function hasCountryVariant(locale: Locale, country: string): boolean {
  return countriesWithVariants[locale]?.includes(country.toUpperCase()) ?? false
}
