import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BlogCard } from "@/components/blog-card"
import { getPostsByLocale } from "@/lib/blog"
import type { Locale } from "@/lib/i18n"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog - Browser Console AI",
  description:
    "Read articles about debugging, AI-powered development, and best practices for using Browser Console AI.",
}

export default async function BlogPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params
  const posts = getPostsByLocale(locale)

  return (
    <>
      <Header locale={locale} />
      <main className="pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4">{locale === "en" ? "Blog" : "Blog"}</h1>
            <p className="text-lg text-muted-foreground">
              {locale === "en"
                ? "Latest articles about debugging, AI integration, and development tips"
                : "Últimos artículos sobre depuración, integración de IA y consejos de desarrollo"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard
                key={post.slug}
                title={post.title}
                excerpt={post.excerpt}
                date={post.date}
                category={post.category}
                slug={post.slug}
                locale={locale}
              />
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{locale === "en" ? "No posts yet" : "Sin posts todavía"}</p>
            </div>
          )}
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
