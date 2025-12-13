import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { Locale } from "@/lib/i18n"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - Browser Console AI",
}

export default async function PrivacyPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params

  return (
    <>
      <Header locale={locale} />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-8">
            {locale === "en" ? "Privacy Policy" : "Política de Privacidad"}
          </h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">
              {locale === "en"
                ? "Browser Console AI is committed to protecting your privacy. This extension runs entirely locally on your machine and does not collect, store, or transmit any personal data to external servers."
                : "Browser Console AI se compromete a proteger tu privacidad. Esta extensión se ejecuta completamente en tu máquina y no recopila, almacena ni transmite datos personales a servidores externos."}
            </p>
            <h2 className="text-2xl font-bold mt-8 mb-4">
              {locale === "en" ? "Data Collection" : "Recopilación de Datos"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {locale === "en"
                ? "We do not collect any data. Browser logs are stored only on your local machine and are never sent to any server unless explicitly configured by you."
                : "No recopilamos datos. Los logs del navegador se almacenan solo en tu máquina local y nunca se envían a ningún servidor a menos que tú lo configures explícitamente."}
            </p>
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
