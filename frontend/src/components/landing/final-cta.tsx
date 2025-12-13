"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Chrome, Github, ArrowRight } from "lucide-react"
import { GlowLink } from "@/components/ui/glow-button"
import { type Locale } from "@/lib/i18n"
import { useI18n } from "@/lib/i18n-context"

interface FinalCTAProps {
  locale: Locale
}

export function FinalCTA({ locale }: FinalCTAProps) {
  const { section, tc } = useI18n()
  const cta = section("cta") as Record<string, string>
  const trust = section("trust") as Record<string, unknown>

  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: "20%", left: "10%" }}
        />
        <motion.div
          className="absolute w-48 h-48 rounded-full bg-glow-cyan/10 blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ bottom: "20%", right: "15%" }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-sm font-medium text-primary">
            {tc("trust.badge")}
          </span>
        </motion.div>

        {/* Title - country-specific */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
        >
          {tc("cta.title")}
        </motion.h2>

        {/* Subtitle - country-specific */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto"
        >
          {tc("cta.subtitle")}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <GlowLink
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            size="lg"
          >
            <Chrome className="w-5 h-5" />
            {cta.button}
            <ArrowRight className="w-4 h-4" />
          </GlowLink>

          <GlowLink
            href="https://github.com/browserconsoleai"
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="lg"
            glow={false}
          >
            <Github className="w-5 h-5" />
            {cta.github}
          </GlowLink>
        </motion.div>

        {/* Stats or social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
        >
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-gradient">100%</div>
            <div className="text-sm text-muted-foreground">{(trust.items as Record<string, string>).free}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-gradient">Local</div>
            <div className="text-sm text-muted-foreground">{(trust.items as Record<string, string>).privacy}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-gradient">MIT</div>
            <div className="text-sm text-muted-foreground">License</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
