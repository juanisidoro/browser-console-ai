import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { Locale } from "@/lib/i18n"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Features - Browser Console AI",
  description: "Explore all features of Browser Console AI: automatic capture, real-time analysis, privacy, and more.",
}

export default async function FeaturesPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params

  return (
    <>
      <Header locale={locale} />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Features</h1>
          <p className="text-lg text-muted-foreground mb-12">Coming soon...</p>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
