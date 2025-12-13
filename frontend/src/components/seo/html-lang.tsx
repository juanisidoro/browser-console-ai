"use client"

import { useEffect } from "react"
import { useI18n } from "@/lib/i18n-context"

/**
 * Client component that sets the html lang attribute based on current locale.
 * This is necessary because the root layout doesn't have access to dynamic params.
 */
export function HtmlLang() {
  const { locale } = useI18n()

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale
    }
  }, [locale])

  return null
}
