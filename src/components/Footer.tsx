"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"

export default function Footer() {
  const pathname = usePathname()
  if (pathname === "/" || pathname.startsWith("/chat")) return null

  return (
    <footer style={{ width: "100%", borderTop: "1px solid var(--line)", background: "color-mix(in srgb, var(--panel) 90%, transparent)", backdropFilter: "blur(12px)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p className="bl-caption" style={{ color: "var(--ink-3)" }}>© 2025 BrawlLens.</p>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Link href="/about?section=privacy-policy" style={{ textDecoration: "none" }}>
            <span className="bl-nav-item" style={{ padding: "6px 10px", fontSize: 11.5 }}>Privacy</span>
          </Link>
          <Link href="/about?section=contact" style={{ textDecoration: "none" }}>
            <span className="bl-nav-item" style={{ padding: "6px 10px", fontSize: 11.5 }}>Contact</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
