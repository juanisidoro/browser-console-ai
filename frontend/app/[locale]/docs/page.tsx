import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { Locale } from "@/lib/i18n"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Documentation - Browser Console AI",
  description: "Learn how to install and use Browser Console AI. Step-by-step guides and API documentation.",
}

export default async function DocsPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params

  return (
    <>
      <Header locale={locale} />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Documentation</h1>
          <p className="text-lg text-muted-foreground mb-12">Coming soon...</p>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
