import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { InstallationSection } from "@/components/installation-section"
import { UseCasesSection } from "@/components/use-cases-section"
import type { Locale } from "@/lib/i18n"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Installation Guide - Browser Console AI",
  description:
    "Get started with Browser Console AI in 3 simple steps. Learn how to install, configure, and start debugging with AI.",
}

export default async function InstallPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params

  return (
    <>
      <Header locale={locale} />
      <main className="pt-24 pb-20">
        <InstallationSection locale={locale} />
        <UseCasesSection locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  )
}
