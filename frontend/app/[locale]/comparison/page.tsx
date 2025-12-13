import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ComparisonTable } from "@/components/comparison-table"
import type { Locale } from "@/lib/i18n"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Comparison - Browser Console AI vs Alternatives",
  description:
    "See how Browser Console AI compares to manual debugging and other tools. Real-time AI analysis, 100% private, zero config.",
}

export default async function ComparisonPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params

  return (
    <>
      <Header locale={locale} />
      <main className="pt-24 pb-20">
        <div className="py-12" />
        <ComparisonTable locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  )
}
