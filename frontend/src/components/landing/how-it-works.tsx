"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Download, Link2, Sparkles } from "lucide-react"
import { type Locale } from "@/lib/i18n"
import { useI18n } from "@/lib/i18n-context"

interface HowItWorksProps {
  locale: Locale
}

export function HowItWorks({ locale }: HowItWorksProps) {
  const { section } = useI18n()
  const install = section("install") as Record<string, unknown>

  const steps = [
    {
      number: "01",
      icon: Download,
      key: "step1",
      color: "from-blue-500 to-cyan-500",
    },
    {
      number: "02",
      icon: Link2,
      key: "step2",
      color: "from-purple-500 to-pink-500",
    },
    {
      number: "03",
      icon: Sparkles,
      key: "step3",
      color: "from-green-500 to-emerald-500",
    },
  ]

  return (
    <section className="py-24 md:py-32 bg-card/50">
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
            {install.title as string}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            {install.subtitle as string}
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-24 left-1/2 -translate-x-1/2 w-2/3 h-0.5">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 origin-left"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => {
              const Icon = step.icon
              const stepData = install[step.key] as { title: string; desc: string }

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                  className="relative text-center"
                >
                  {/* Step number */}
                  <div className="relative inline-block mb-6">
                    {/* Glow */}
                    <div className={`absolute -inset-4 bg-gradient-to-r ${step.color} rounded-full opacity-20 blur-xl`} />

                    {/* Circle */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`relative w-20 h-20 rounded-full bg-gradient-to-r ${step.color} p-0.5`}
                    >
                      <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
                        <span className={`text-2xl font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                          {step.number}
                        </span>
                      </div>
                    </motion.div>

                    {/* Icon badge */}
                    <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-2">{stepData.title}</h3>
                  <p className="text-muted-foreground">{stepData.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
