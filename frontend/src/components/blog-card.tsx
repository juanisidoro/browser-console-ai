"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import type { Locale } from "@/lib/i18n"

interface BlogCardProps {
  title: string
  excerpt: string
  date: string
  category: string
  slug: string
  locale: Locale
}

export function BlogCard({ title, excerpt, date, category, slug, locale }: BlogCardProps) {
  return (
    <motion.article
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors group"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">{category}</span>
          <time className="text-xs text-muted-foreground">{date}</time>
        </div>
        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
          <Link href={`/${locale}/blog/${slug}`}>{title}</Link>
        </h3>
        <p className="text-muted-foreground mb-4 line-clamp-2">{excerpt}</p>
        <Link
          href={`/${locale}/blog/${slug}`}
          className="inline-flex items-center text-primary hover:text-primary/80 transition-colors font-medium"
        >
          {locale === "en" ? "Read more" : "Leer más"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    </motion.article>
  )
}
