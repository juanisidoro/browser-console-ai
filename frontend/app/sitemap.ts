import type { MetadataRoute } from "next"
import { locales } from "@/lib/i18n"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://browserconsoleai.com"

  const routes = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/features", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/docs", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/docs/seo", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/pricing", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  ]

  const sitemapEntries = locales.flatMap((locale) =>
    routes.map((route) => ({
      url: `${baseUrl}/${locale}${route.path}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${baseUrl}/${l}${route.path}`])
        ),
      },
    })),
  )

  return sitemapEntries as MetadataRoute.Sitemap
}
