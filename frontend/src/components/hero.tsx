"use client"

import { Button } from "@/components/ui/button"
import { translations, type Locale } from "@/lib/i18n"

export function Hero({ locale }: { locale: Locale }) {
  const t = translations[locale]

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pb-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Tagline */}
        <div className="inline-block mb-6 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full">
          <p className="text-sm font-medium text-primary">{t.hero.tagline}</p>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-pretty">{t.hero.title}</h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed text-balance">
          {t.hero.subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8" asChild>
            <a href="https://chrome.google.com/webstore" target="_blank" rel="noreferrer">
              {t.hero.cta}
            </a>
          </Button>
          <Button size="lg" variant="outline" className="font-semibold px-8 bg-transparent">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {t.hero.secondary}
          </Button>
        </div>

        {/* Demo Image Placeholder */}
        <div className="mt-16 relative">
          <div className="bg-gradient-to-b from-card to-background border border-border rounded-2xl p-8 shadow-2xl">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-primary/40 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-muted-foreground">{locale === "en" ? "Demo coming soon" : "Demo próximamente"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
