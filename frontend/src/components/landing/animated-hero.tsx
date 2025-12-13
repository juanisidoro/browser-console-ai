"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Chrome, Play, Shield, Sparkles, Zap } from "lucide-react"
import { GlowLink } from "@/components/ui/glow-button"
import { type Locale } from "@/lib/i18n"
import { useI18n } from "@/lib/i18n-context"

interface AnimatedHeroProps {
  locale: Locale
}

export function AnimatedHero({ locale }: AnimatedHeroProps) {
  const { section, tc } = useI18n()
  const hero = section("hero") as Record<string, string>
  const trust = section("trust") as Record<string, unknown>

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient" />

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-primary/10 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: "10%", left: "10%" }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full bg-glow-cyan/10 blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: "50%", right: "10%" }}
        />
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -60, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ bottom: "20%", left: "30%" }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(217 91% 60% / 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(217 91% 60% / 0.3) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center">
          {/* Tagline badge - country-specific */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{tc("hero.tagline")}</span>
          </motion.div>

          {/* Main headline - country-specific */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-gradient">{tc("hero.title")}</span>
          </motion.h1>

          {/* Subtitle - country-specific */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-10"
          >
            {tc("hero.subtitle")}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <GlowLink
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Chrome className="w-5 h-5" />
              {hero.cta}
            </GlowLink>
            <GlowLink
              href="#demo"
              variant="outline"
              size="lg"
              glow={false}
              className="w-full sm:w-auto"
            >
              <Play className="w-5 h-5" />
              {hero.secondary}
            </GlowLink>
          </motion.div>

          {/* Trust badges - country-specific */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>{(trust.items as Record<string, string>).free}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>{(trust.items as Record<string, string>).privacy}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{(trust.items as Record<string, string>).opensource}</span>
            </div>
          </motion.div>
        </div>

        {/* Video/Demo placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 md:mt-24"
          id="demo"
        >
          <div className="relative max-w-4xl mx-auto">
            {/* Glow behind the video */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-glow-cyan/20 to-primary/20 rounded-2xl blur-2xl opacity-50" />

            {/* Video container */}
            <div className="relative glass rounded-xl overflow-hidden aspect-video">
              {/* Placeholder content - replace with actual video */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer group"
                >
                  <Play className="w-8 h-8 text-primary group-hover:text-primary/80 transition-colors ml-1" />
                </motion.div>
                <p className="mt-4 text-muted-foreground">
                  {hero.videoTitle || "Watch Demo Video"}
                </p>
              </div>

              {/* Console mockup overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <ConsoleMockup />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
        >
          <motion.div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  )
}

// Console mockup component
function ConsoleMockup() {
  const logs = [
    { type: "log", message: "App initialized successfully", time: "10:23:45" },
    { type: "warn", message: "Deprecated API detected", time: "10:23:46" },
    { type: "error", message: "TypeError: Cannot read property 'map' of undefined", time: "10:23:47" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="console-bg backdrop-blur-sm rounded-lg border p-3 font-mono text-xs"
    >
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/30">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-2 text-muted-foreground">Console</span>
      </div>
      <div className="space-y-1">
        {logs.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4 + i * 0.2 }}
            className="flex items-start gap-2"
          >
            <span className="text-muted-foreground">{log.time}</span>
            <span className={
              log.type === "error" ? "log-error" :
              log.type === "warn" ? "log-warn" :
              "log-info"
            }>
              [{log.type.toUpperCase()}]
            </span>
            <span className="text-foreground/80 truncate">{log.message}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
