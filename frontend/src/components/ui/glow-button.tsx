"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
  glow?: boolean
  children: React.ReactNode
  asChild?: boolean
}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant = "primary", size = "md", glow = true, children, ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none"

    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    }

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg",
    }

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {/* Glow effect */}
        {glow && variant === "primary" && (
          <motion.div
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            animate={{
              boxShadow: [
                "0 0 20px hsl(217 91% 60% / 0.3)",
                "0 0 40px hsl(217 91% 60% / 0.4)",
                "0 0 20px hsl(217 91% 60% / 0.3)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </motion.button>
    )
  }
)

GlowButton.displayName = "GlowButton"

// Link variant for navigation
interface GlowLinkProps {
  variant?: "primary" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
  glow?: boolean
  children: React.ReactNode
  className?: string
  href?: string
  target?: string
  rel?: string
}

export const GlowLink = React.forwardRef<HTMLAnchorElement, GlowLinkProps>(
  ({ className, variant = "primary", size = "md", glow = true, children, href, target, rel }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background"

    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    }

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg",
    }

    return (
      <motion.a
        ref={ref}
        href={href}
        target={target}
        rel={rel}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {glow && variant === "primary" && (
          <motion.div
            className="absolute inset-0 rounded-lg opacity-50 dark:opacity-100"
            animate={{
              boxShadow: [
                "0 0 15px hsl(217 91% 60% / 0.2)",
                "0 0 25px hsl(217 91% 60% / 0.3)",
                "0 0 15px hsl(217 91% 60% / 0.2)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </motion.a>
    )
  }
)

GlowLink.displayName = "GlowLink"
