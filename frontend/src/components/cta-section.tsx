"use client"

import { Button } from "@/components/ui/button"
import { translations, type Locale } from "@/lib/i18n"

export function CTASection({ locale }: { locale: Locale }) {
  const t = translations[locale]

  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-primary to-primary/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary-foreground">{t.cta.title}</h2>
        <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">{t.cta.subtitle}</p>
        <Button
          size="lg"
          className="bg-primary-foreground hover:bg-primary-foreground/90 text-primary font-semibold px-8"
          asChild
        >
          <a href="https://chrome.google.com/webstore" target="_blank" rel="noreferrer">
            {t.cta.button}
          </a>
        </Button>
      </div>
    </section>
  )
}
