"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { X, Check, ArrowRight, Copy, Clipboard, Bot } from "lucide-react"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { type Locale } from "@/lib/i18n"
import { useI18n } from "@/lib/i18n-context"

interface ProblemSolutionProps {
  locale: Locale
}

interface ProblemSection {
  title: string
  items: string[]
  aiText?: string
}

export function ProblemSolution({ locale }: ProblemSolutionProps) {
  const { section } = useI18n()
  const problem = section("problem") as {
    title: string
    subtitle: string
    before: ProblemSection
    after: ProblemSection
  }

  return (
    <SectionWrapper className="py-24 md:py-32 bg-card/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
          >
            {problem.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            {problem.subtitle}
          </motion.p>
        </div>

        {/* Comparison cards */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Before card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-card border border-red-500/20 rounded-xl p-8 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold">{problem.before.title}</h3>
              </div>

              {/* Illustration */}
              <div className="mb-6 p-4 illustration-bg rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Copy className="w-4 h-4" />
                  <span>Copy... Paste... Copy... Paste...</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-16 h-10 rounded border border-border flex items-center justify-center text-xs">
                    Console
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="w-16 h-10 rounded border border-border flex items-center justify-center text-xs">
                    <Clipboard className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="w-16 h-10 rounded border border-border flex items-center justify-center text-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <ul className="space-y-3">
                {problem.before.items.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-muted-foreground"
                  >
                    <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* After card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-glow-cyan/20 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-card border border-primary/20 rounded-xl p-8 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{problem.after.title}</h3>
              </div>

              {/* Illustration */}
              <div className="mb-6 p-4 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-primary mb-3">
                  <Bot className="w-4 h-4" />
                  <span>{problem.after.aiText || "AI sees your console automatically"}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-16 h-10 rounded border border-primary/30 bg-background flex items-center justify-center text-xs">
                    Console
                  </div>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </motion.div>
                  <div className="w-16 h-10 rounded border border-primary/30 bg-background flex items-center justify-center text-xs">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </div>

              <ul className="space-y-3">
                {problem.after.items.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </SectionWrapper>
  )
}
