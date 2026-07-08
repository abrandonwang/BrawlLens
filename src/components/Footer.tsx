"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

const footerLinks: { label: string; href: string }[] = [
  { label: "About", href: "/about" },
  { label: "Help", href: "/help" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
]

const HIDDEN_PATHS = new Set(["/"])

export default function Footer() {
  const pathname = usePathname()
  if (pathname.startsWith("/account")) return null
  if (HIDDEN_PATHS.has(pathname)) return null

  return (
    <footer className="bl-footer app-footer" aria-label="Site footer">
      <div className="bl-footer-bar">
        <span className="bl-footer-copy">&copy; 2026 BrawlLens</span>
        <nav className="bl-footer-links" aria-label="Footer links">
          {footerLinks.map(({ label, href }) => (
            <Link key={href} href={href} className="bl-footer-link" prefetch={false}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
