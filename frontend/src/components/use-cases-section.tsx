"use client"

import { translations, type Locale } from "@/lib/i18n"

const useCaseIcons = {
  debugging: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  ),
  testing: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  monitoring: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  integration: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
}

export function UseCasesSection({ locale }: { locale: Locale }) {
  const t = translations[locale]

  const useCases = [
    { key: "debugging", icon: useCaseIcons.debugging },
    { key: "testing", icon: useCaseIcons.testing },
    { key: "monitoring", icon: useCaseIcons.monitoring },
    { key: "integration", icon: useCaseIcons.integration },
  ]

  return (
    <section className="py-20 md:py-32 bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.useCases.title}</h2>
          <p className="text-lg text-muted-foreground">{t.useCases.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {useCases.map((useCase) => {
            const useCaseData = t.useCases[useCase.key as keyof typeof t.useCases] as { title: string; desc: string }
            return (
              <div
                key={useCase.key}
                className="p-8 bg-background border border-border rounded-xl hover:border-primary/50 transition-all hover:shadow-lg group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors text-primary">
                  {useCase.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-3">{useCaseData.title}</h3>
                <p className="text-muted-foreground text-lg">{useCaseData.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
