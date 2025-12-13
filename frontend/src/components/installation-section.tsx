"use client"

import { translations, type Locale } from "@/lib/i18n"

export function InstallationSection({ locale }: { locale: Locale }) {
  const t = translations[locale]

  const steps = [
    { step: "1", key: "step1" },
    { step: "2", key: "step2" },
    { step: "3", key: "step3" },
  ]

  return (
    <section className="py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.install.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.install.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item) => {
            const stepData = t.install[item.key as keyof typeof t.install] as { title: string; desc: string }
            return (
              <div key={item.key} className="relative">
                {/* Step number */}
                <div className="absolute -left-4 top-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  {item.step}
                </div>

                {/* Connector line */}
                {Number.parseInt(item.step) < 3 && (
                  <div className="hidden md:block absolute top-4 left-8 w-full h-1 bg-gradient-to-r from-primary/50 to-primary/0 transform -translate-y-1/2" />
                )}

                {/* Card */}
                <div className="pt-8 pl-8 bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
                  <h3 className="text-xl font-semibold mb-2">{stepData.title}</h3>
                  <p className="text-muted-foreground">{stepData.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Video Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold mb-4 text-center">{t.install.videoTitle}</h3>
          <p className="text-center text-muted-foreground mb-8">{t.install.videoDesc}</p>
          <div className="bg-muted rounded-xl aspect-video flex items-center justify-center border border-border">
            <svg className="w-16 h-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>
        </div>
      </div>
    </section>
  )
}
