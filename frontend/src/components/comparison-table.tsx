"use client"

import { motion } from "framer-motion"
import { Check, Minus } from "lucide-react"
import { translations, type Locale } from "@/lib/i18n"

export function ComparisonTable({ locale }: { locale: Locale }) {
  const t = translations[locale]

  return (
    <section className="py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t.comparison.title}</h2>
          <p className="text-lg text-muted-foreground">{t.comparison.subtitle}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="overflow-x-auto"
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-6 font-semibold">{t.comparison.feature}</th>
                <th className="text-center py-4 px-6 font-semibold text-primary">{t.comparison.bcai}</th>
                <th className="text-center py-4 px-6 font-semibold text-muted-foreground">{t.comparison.manual}</th>
                <th className="text-center py-4 px-6 font-semibold text-muted-foreground">{t.comparison.other}</th>
              </tr>
            </thead>
            <tbody>
              {t.comparison.features.map((feature: { name: string; bcai: boolean; manual: boolean; other: boolean }, idx: number) => (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="border-b border-border hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-4 px-6 font-medium">{feature.name}</td>
                  <td className="text-center py-4 px-6">
                    {feature.bcai ? (
                      <Check className="w-5 h-5 text-primary mx-auto" />
                    ) : (
                      <Minus className="w-5 h-5 text-muted-foreground mx-auto" />
                    )}
                  </td>
                  <td className="text-center py-4 px-6">
                    {feature.manual ? (
                      <Check className="w-5 h-5 text-muted-foreground mx-auto" />
                    ) : (
                      <Minus className="w-5 h-5 text-muted-foreground mx-auto" />
                    )}
                  </td>
                  <td className="text-center py-4 px-6">
                    {feature.other ? (
                      <Check className="w-5 h-5 text-muted-foreground mx-auto" />
                    ) : (
                      <Minus className="w-5 h-5 text-muted-foreground mx-auto" />
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  )
}
