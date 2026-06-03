"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { HelpCircle } from "lucide-react"

const footerLinks: { label: string; href: string; icon?: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { label: "Help", href: "/help", icon: HelpCircle },
]

const HIDDEN_PATHS = new Set(["/"])

export default function Footer() {
  const pathname = usePathname()
  if (pathname.startsWith("/account")) return null
  if (HIDDEN_PATHS.has(pathname)) return null

  return (
    <footer className="bl-footer app-footer" aria-label="Site footer">
      <div className="bl-footer-divider" aria-hidden="true" />
      <div className="bl-footer-inner">
        <div className="bl-footer-brand">
          <span className="bl-footer-mark">
            <Image
              src="/brawllens-mark.svg"
              alt=""
              width={28}
              height={28}
              className="bl-footer-mark-img"
              unoptimized
            />
          </span>
          <div className="bl-footer-brand-copy">
            <span className="bl-footer-brand-name">BrawlLens</span>
            <span className="bl-footer-brand-meta">&copy; 2026 · All rights reserved</span>
          </div>
        </div>

        <nav className="bl-footer-links" aria-label="Footer links">
          {footerLinks.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className="bl-footer-link" prefetch={false}>
              {Icon && <Icon size={13} className="bl-footer-link-icon" />}
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
