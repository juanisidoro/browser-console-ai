"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Zap, Shield, Settings, Filter, Plug, Clock } from "lucide-react"
import { StaggerContainer, StaggerItem } from "@/components/shared/section-wrapper"
import { type Locale } from "@/lib/i18n"
import { useI18n } from "@/lib/i18n-context"

interface FeaturesGridProps {
  locale: Locale
}

const featureIcons = {
  autoCapture: Zap,
  realTime: Clock,
  private: Shield,
  easy: Settings,
  filters: Filter,
  mcp: Plug,
}

export function FeaturesGrid({ locale }: FeaturesGridProps) {
  const { section } = useI18n()
  const featuresSection = section("features") as Record<string, unknown>

  const features = [
    { key: "autoCapture", icon: featureIcons.autoCapture, color: "from-blue-500 to-cyan-500" },
    { key: "realTime", icon: featureIcons.realTime, color: "from-purple-500 to-pink-500" },
    { key: "private", icon: featureIcons.private, color: "from-green-500 to-emerald-500" },
    { key: "easy", icon: featureIcons.easy, color: "from-orange-500 to-yellow-500" },
    { key: "filters", icon: featureIcons.filters, color: "from-indigo-500 to-purple-500" },
    { key: "mcp", icon: featureIcons.mcp, color: "from-cyan-500 to-blue-500" },
  ]

  return (
    <section className="py-24 md:py-32">
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
            {featuresSection.title as string}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            {featuresSection.subtitle as string}
          </motion.p>
        </div>

        {/* Features grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            const featureData = featuresSection[feature.key] as { name: string; desc: string }

            return (
              <StaggerItem key={feature.key}>
                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="group relative h-full"
                >
                  {/* Glow effect on hover */}
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.color} rounded-xl opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300`} />

                  <div className="relative h-full p-6 bg-card border border-border rounded-xl hover:border-primary/30 transition-all shadow-sm hover:shadow-md dark:shadow-none">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} p-0.5 mb-4`}>
                      <div className="w-full h-full bg-card rounded-[7px] flex items-center justify-center">
                        <Icon className="w-5 h-5 text-foreground" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {featureData.name}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {featureData.desc}
                    </p>
                  </div>
                </motion.div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </div>
    </section>
  )
}
