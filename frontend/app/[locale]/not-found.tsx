import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Locale } from "@/lib/i18n"

export default function NotFound() {
  const locale: Locale = "en"

  return (
    <>
      <Header locale={locale} />
      <main className="pt-32 pb-20 min-h-screen flex items-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold mb-4">404</h1>
            <p className="text-2xl text-muted-foreground mb-8">
              {locale === "en" ? "Page not found" : "Página no encontrada"}
            </p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href={`/${locale}`}>{locale === "en" ? "Back to home" : "Volver al inicio"}</Link>
          </Button>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
