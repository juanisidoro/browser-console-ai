import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { AuthProvider } from "@/features/auth"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://browserconsoleai.com"),
  title: "Browser Console AI - Debug with AI in Real Time",
  description:
    "Connect your browser console directly to AI assistants like Claude. Capture logs, analyze errors, and debug faster with Browser Console AI - the developer extension for smarter debugging.",
  keywords:
    "browser console, AI debugging, chrome extension, claude code, web development, developer tools, console logs, MCP protocol",
  authors: [{ name: "Browser Console AI Team" }],
  creator: "Browser Console AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://browserconsoleai.com",
    siteName: "Browser Console AI",
    title: "Browser Console AI - Debug with AI in Real Time",
    description: "Connect your browser console directly to AI assistants. Capture, analyze, and debug faster.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Browser Console AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Browser Console AI - Debug with AI in Real Time",
    description: "Connect your browser console directly to AI assistants like Claude",
    images: ["/twitter-image.png"],
  },
  robots: "index, follow",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport = {
  themeColor: "#0f1b2d",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
