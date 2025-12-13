import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getPostBySlug, getPostsByLocale } from "@/lib/blog"
import type { Locale } from "@/lib/i18n"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateStaticParams({ params }: { params: { locale: Locale } }) {
  const { locale } = params
  const posts = getPostsByLocale(locale)
  return posts.map((post) => ({
    locale: locale,
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: { locale: Locale; slug: string } }): Promise<Metadata> {
  const { locale, slug } = params
  const post = getPostBySlug(slug, locale)

  if (!post) {
    return {
      title: "Not Found",
    }
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
  }
}

export default async function BlogPostPage({ params }: { params: { locale: Locale; slug: string } }) {
  const { locale, slug } = params
  const post = getPostBySlug(slug, locale)

  if (!post) {
    notFound()
  }

  return (
    <>
      <Header locale={locale} />
      <main className="pt-32 pb-20">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
                {post.category}
              </span>
              <time className="text-sm text-muted-foreground">{post.date}</time>
            </div>
            <h1 className="text-5xl font-bold mb-4">{post.title}</h1>
            <p className="text-xl text-muted-foreground">{post.excerpt}</p>
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {locale === "en" ? "By" : "Por"} <span className="font-semibold">{post.author}</span>
              </p>
            </div>
          </div>

          {/* Article Content */}
          <div className="prose prose-invert max-w-none mb-8">
            {post.content.split("\n\n").map((paragraph, idx) => {
              if (paragraph.startsWith("# ")) {
                return (
                  <h1 key={idx} className="text-3xl font-bold mt-8 mb-4">
                    {paragraph.replace("# ", "")}
                  </h1>
                )
              }
              if (paragraph.startsWith("## ")) {
                return (
                  <h2 key={idx} className="text-2xl font-bold mt-6 mb-3">
                    {paragraph.replace("## ", "")}
                  </h2>
                )
              }
              if (paragraph.startsWith("- ")) {
                return (
                  <ul key={idx} className="list-disc list-inside space-y-2 mb-4">
                    {paragraph.split("\n").map((item, itemIdx) => (
                      <li key={itemIdx} className="text-base leading-relaxed">
                        {item.replace("- ", "")}
                      </li>
                    ))}
                  </ul>
                )
              }
              return (
                <p key={idx} className="text-base leading-relaxed mb-4">
                  {paragraph}
                </p>
              )
            })}
          </div>

          {/* Tags */}
          <div className="border-t border-border pt-6 mt-8">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium px-3 py-1 bg-muted text-muted-foreground rounded-full hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </article>
      </main>
      <Footer locale={locale} />
    </>
  )
}
