import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { Locale } from "@/lib/i18n"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service - Browser Console AI",
}

export default async function TermsPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params

  return (
    <>
      <Header locale={locale} />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-8">
            {locale === "en" ? "Terms of Service" : "Términos de Servicio"}
          </h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">
              {locale === "en"
                ? "Browser Console AI is provided as-is, free of charge. By using this extension, you agree to these terms."
                : "Browser Console AI se proporciona tal cual, de forma gratuita. Al usar esta extensión, aceptas estos términos."}
            </p>
            <h2 className="text-2xl font-bold mt-8 mb-4">{locale === "en" ? "License" : "Licencia"}</h2>
            <p className="text-muted-foreground mb-6">
              {locale === "en"
                ? "Browser Console AI is open source and licensed under the MIT License. You are free to use, modify, and distribute the software."
                : "Browser Console AI es de código abierto y tiene licencia bajo la Licencia MIT. Eres libre de usar, modificar y distribuir el software."}
            </p>
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
