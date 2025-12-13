import { blogPosts } from "@/lib/blog"

export function GET() {
  if (!blogPosts || blogPosts.length === 0) {
    return new Response("No blog posts available", { status: 404 })
  }

  const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Browser Console AI Blog</title>
    <link>https://browserconsoleai.com/blog</link>
    <description>Latest articles about AI-powered debugging and web development</description>
    <language>en-us</language>
    ${blogPosts
      .filter((post) => post.locale === "en")
      .map(
        (post) => `
    <item>
      <title>${post.title}</title>
      <link>https://browserconsoleai.com/en/blog/${post.slug}</link>
      <description>${post.excerpt}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <author>${post.author}</author>
      <category>${post.category}</category>
    </item>
    `,
      )
      .join("")}
  </channel>
</rss>`

  return new Response(rssContent, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
