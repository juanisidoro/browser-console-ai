"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Github, Twitter, Chrome } from "lucide-react"
import { type Locale, getMessages } from "@/lib/i18n"

export function Footer({ locale }: { locale: Locale }) {
  const year = new Date().getFullYear()
  const msgs = getMessages(locale)
  const t = msgs.footer as Record<string, string>

  return (
    <footer className="relative border-t border-border bg-card/50 backdrop-blur-sm">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand column - takes 2 cols on lg */}
          <div className="lg:col-span-2">
            <Link href={`/${locale}`} className="flex items-center gap-2 group mb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative w-8 h-8 rounded-lg overflow-hidden"
              >
                <div className="absolute inset-0 flex flex-col">
                  <div className="h-1/3 bg-slate" />
                  <div className="h-2/3 bg-navy flex items-center justify-center">
                    <span className="text-white font-bold text-sm">&gt;</span>
                  </div>
                </div>
              </motion.div>
              <span className="font-bold text-lg">
                Browser Console <span className="text-primary">AI</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              {t.tagline}
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              <motion.a
                href="https://github.com/browserconsoleai"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-9 h-9 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors"
              >
                <Github className="w-4 h-4" />
                <span className="sr-only">GitHub</span>
              </motion.a>
              <motion.a
                href="https://twitter.com/browserconsoleai"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-9 h-9 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors"
              >
                <Twitter className="w-4 h-4" />
                <span className="sr-only">Twitter</span>
              </motion.a>
              <motion.a
                href="https://chrome.google.com/webstore"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-9 h-9 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors"
              >
                <Chrome className="w-4 h-4" />
                <span className="sr-only">Chrome Web Store</span>
              </motion.a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              {t.product}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href={`/${locale}/features`}
                  className="text-foreground/80 hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  {t.features}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/pricing`}
                  className="text-foreground/80 hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  {t.pricing}
                </Link>
              </li>
              <li>
                <a
                  href="https://chrome.google.com/webstore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  {t.chromeStore}
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              {t.resources}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href={`/${locale}/docs`}
                  className="text-foreground/80 hover:text-primary transition-colors"
                >
                  {t.docs}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/blog`}
                  className="text-foreground/80 hover:text-primary transition-colors"
                >
                  {t.blog}
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/browserconsoleai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 hover:text-primary transition-colors"
                >
                  {t.github}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              {t.legal}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="text-foreground/80 hover:text-primary transition-colors"
                >
                  {t.privacy}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className="text-foreground/80 hover:text-primary transition-colors"
                >
                  {t.terms}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contact@browserconsoleai.com"
                  className="text-foreground/80 hover:text-primary transition-colors"
                >
                  {t.contact}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {year} Browser Console AI. {t.rights}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            {t.madeWith}{" "}
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              className="text-red-500"
            >
              ♥
            </motion.span>{" "}
            {t.forDevelopers}
          </p>
        </div>
      </div>
    </footer>
  )
}
