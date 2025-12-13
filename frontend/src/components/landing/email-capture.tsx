"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Mail, ArrowRight, Check, Loader2 } from "lucide-react"
import { type Locale } from "@/lib/i18n"
import { useI18n } from "@/lib/i18n-context"

interface EmailCaptureProps {
  locale: Locale
}

export function EmailCapture({ locale }: EmailCaptureProps) {
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle")
  const { section } = useI18n()
  const t = section("email") as Record<string, string>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || status === "loading") return

    setStatus("loading")

    // Simulate API call - replace with actual API
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setStatus("success")
    setEmail("")
  }

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-glow-cyan/20 to-primary/20 rounded-3xl blur-2xl opacity-50" />

          {/* Card */}
          <div className="relative glass rounded-2xl p-8 md:p-12 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6"
            >
              <Mail className="w-8 h-8 text-primary" />
            </motion.div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{t.title}</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t.subtitle}</p>

            {/* Form */}
            {status === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 text-green-500 py-4"
              >
                <Check className="w-5 h-5" />
                <span>{t.success}</span>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.placeholder}
                    required
                    className="w-full h-12 px-4 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={status === "loading"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-12 px-6 bg-primary text-primary-foreground rounded-lg font-medium inline-flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {status === "loading" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {t.button}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>
            )}

            {/* Privacy note */}
            <p className="text-xs text-muted-foreground mt-4">{t.privacy}</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
