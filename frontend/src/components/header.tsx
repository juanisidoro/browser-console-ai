"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Chrome, ChevronDown, Globe } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { GlowLink } from "@/components/ui/glow-button"
import { locales, localeNames, type Locale, getMessages } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { UserMenu } from "@/features/auth"

export function Header({ locale }: { locale: Locale }) {
  const [isOpen, setIsOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const msgs = getMessages(locale)
  const nav = msgs.nav as Record<string, string>

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const navLinks = [
    { href: `/${locale}/features`, label: nav.features },
    { href: `/${locale}/docs`, label: nav.docs },
    { href: `/${locale}/blog`, label: nav.blog },
  ]

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-lg shadow-background/5"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-9 h-9"
          >
            <svg viewBox="0 0 128 128" className="w-full h-full">
              <rect x="4" y="4" width="120" height="120" rx="20" ry="20" fill="#1e293b"/>
              <clipPath id="logoTopClip">
                <rect x="4" y="4" width="120" height="30" rx="20" ry="20"/>
              </clipPath>
              <rect x="4" y="4" width="120" height="34" fill="#64748b" clipPath="url(#logoTopClip)"/>
              <rect x="4" y="24" width="120" height="10" fill="#64748b"/>
              <path
                d="M 40 52 L 82 78 L 40 104"
                fill="none"
                stroke="white"
                strokeWidth="13"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
          <span className="font-bold text-lg hidden sm:inline">
            Browser Console <span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-underline"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side: Language, Theme, CTA */}
        <div className="flex items-center gap-3">
          {/* Language Switcher - Dropdown */}
          <div className="hidden sm:block relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                "bg-secondary/50 hover:bg-secondary text-foreground"
              )}
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{locale}</span>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 transition-transform",
                  langOpen && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-40 py-2 bg-card border border-border rounded-lg shadow-lg"
                >
                  {locales.map((l) => (
                    <Link
                      key={l}
                      href={`/${l}`}
                      onClick={() => setLangOpen(false)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm transition-colors",
                        l === locale
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-secondary/50"
                      )}
                    >
                      <span className="uppercase w-6">{l}</span>
                      <span className="text-muted-foreground">
                        {localeNames[l]}
                      </span>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu / Login */}
          <UserMenu />

          {/* CTA Button */}
          <GlowLink
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Chrome className="w-4 h-4" />
            <span className="hidden lg:inline">{nav.installNow}</span>
            <span className="lg:hidden">Install</span>
          </GlowLink>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-secondary/50 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block py-3 px-3 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile Language Switcher - Grid */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="py-3 px-3"
              >
                <span className="text-sm text-muted-foreground mb-2 block">
                  Language
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {locales.map((l) => (
                    <Link
                      key={l}
                      href={`/${l}`}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "text-xs font-medium px-3 py-2 rounded-md transition-all text-center",
                        l === locale
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50 hover:bg-secondary text-foreground"
                      )}
                    >
                      {l.toUpperCase()}
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Mobile CTA */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-2"
              >
                <GlowLink
                  href="https://chrome.google.com/webstore"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                >
                  <Chrome className="w-4 h-4" />
                  {nav.installNow}
                </GlowLink>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
