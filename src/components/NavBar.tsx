"use client";
import { useState, useEffect, useRef } from "react";
import { Search, X, User, LayoutGrid, Map, Trophy, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const navItems = [
  { label: "Overview",     href: "/" },
  { label: "Brawlers",     href: "/brawlers" },
  { label: "Maps",         href: "/meta" },
  { label: "Leaderboards", href: "/leaderboards" },
  { label: "Ask AI",       href: "/chat" },
];

const searchItems = [
  { label: "Ask AI",       href: "/chat",         icon: MessageSquare },
  { label: "Brawlers",     href: "/brawlers",     icon: LayoutGrid },
  { label: "Maps",         href: "/meta",         icon: Map },
  { label: "Leaderboards", href: "/leaderboards", icon: Trophy },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isMenuOpen || menuClosing) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen, menuClosing]);

  useEffect(() => { closeMenu(); }, [pathname]);

  useEffect(() => {
    if (isSearchOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setIsSearchOpen(false); closeMenu(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function closeMenu() {
    if (!isMenuOpen) return;
    setMenuClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setMenuClosing(false);
    }, 380);
  }

  function toggleMenu() {
    if (isMenuOpen) closeMenu();
    else setIsMenuOpen(true);
  }

  const isTag = query.trim().startsWith("#") || /^[A-Z0-9]{3,}$/i.test(query.trim());
  const filtered = searchItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase()));

  function handlePlayerSearch() {
    const tag = query.trim().replace(/^#/, "");
    if (tag) { router.push(`/player/${tag}`); setIsSearchOpen(false); }
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const menuVisible = isMenuOpen || menuClosing;

  return (
    <>
      <nav style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: 6,
        background: "color-mix(in srgb, var(--panel) 80%, transparent)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid var(--line)",
        borderRadius: 999,
        boxShadow: "var(--shadow-lift)",
        whiteSpace: "nowrap",
      }}>

        {/* Logo */}
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 14px 6px 10px",
          borderRight: "1px solid var(--line)",
          marginRight: 4,
          textDecoration: "none",
        }}>
          <div className="bl-nav-logo">
            <div style={{ position: "absolute", inset: 4, background: "var(--panel)", borderRadius: 2 }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: "-0.02em", color: "var(--ink)" }}>
            BrawlLens
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden lg:flex" style={{ alignItems: "center", gap: 0 }}>
          {navItems.map(item => (
            <Link key={item.label} href={item.href}
              className={isActive(item.href) ? "bl-rainbow-border" : ""}
              style={{
                padding: "8px 14px", fontSize: 12.5, fontWeight: isActive(item.href) ? 600 : 500,
                color: isActive(item.href) ? "var(--ink)" : "var(--ink-2)",
                borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap",
                textDecoration: "none",
                background: isActive(item.href) ? "var(--elev)" : "transparent",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right controls — no left border on mobile (logo border-right is enough) */}
        <div style={{ display: "flex", gap: 4 }} className="nav-right-controls">
          <button onClick={() => setIsSearchOpen(true)} aria-label="Search"
            style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 999, color: "var(--ink-3)", background: "transparent", border: "none", cursor: "pointer" }}
          >
            <Search size={14} />
          </button>

          {mounted && (
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme"
              style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 999, color: "var(--ink-3)", background: "transparent", border: "none", cursor: "pointer" }}
            >
              <div style={{
                width: 12, height: 12,
                border: "1.75px solid var(--ink-3)",
                borderRadius: theme === "dark" ? 2 : 999,
                background: "transparent",
                transition: "border-radius 0.2s ease",
              }} />
            </button>
          )}

          {/* Two-line hamburger / X */}
          <div className="lg:hidden">
            <button onClick={toggleMenu} aria-label="Menu"
              style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 999, color: "var(--ink-3)", background: "transparent", border: "none", cursor: "pointer" }}
            >
              {isMenuOpen ? (
                <X size={15} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4.5, width: 15 }}>
                  <span style={{ display: "block", height: 1.5, borderRadius: 1, background: "var(--ink-3)" }} />
                  <span style={{ display: "block", height: 1.5, borderRadius: 1, background: "var(--ink-3)", width: "70%" }} />
                </div>
              )}
            </button>
          </div>
        </div>
      </nav>

      <div style={{ height: 80 }} />

      {/* Full-screen mobile menu */}
      {menuVisible && (
        <div
          className="lg:hidden"
          style={{
            position: "fixed", inset: 0, zIndex: 90,
            background: "var(--bg)",
            display: "flex", flexDirection: "column",
            animation: menuClosing
              ? "menuOverlayOut 0.38s cubic-bezier(0.4,0,1,1) forwards"
              : "menuOverlayIn 0.32s cubic-bezier(0,0,0.2,1) forwards",
          }}
        >
          {/* Spacer for navbar */}
          <div style={{ height: 80, flexShrink: 0 }} />

          {/* Links */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            justifyContent: "center", padding: "0 36px 80px",
            gap: 4,
          }}>
            {navItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                style={{
                  display: "block",
                  fontSize: 32,
                  fontWeight: 650,
                  letterSpacing: "-0.03em",
                  color: isActive(item.href) ? "var(--ink)" : "var(--ink-3)",
                  textDecoration: "none",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--line)",
                  animation: menuClosing
                    ? `menuItemOut 0.28s cubic-bezier(0.4,0,1,1) forwards`
                    : `menuItemIn 0.4s cubic-bezier(0,0,0.2,1) ${i * 55}ms both`,
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Bottom hint */}
          <div style={{
            padding: "24px 36px",
            animation: menuClosing
              ? "menuItemOut 0.24s cubic-bezier(0.4,0,1,1) forwards"
              : `menuItemIn 0.4s cubic-bezier(0,0,0.2,1) ${navItems.length * 55 + 40}ms both`,
          }}>
            <button
              onClick={() => { closeMenu(); setTimeout(() => setIsSearchOpen(true), 200); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "var(--panel)", border: "1px solid var(--line)",
                borderRadius: 14, padding: "12px 16px", width: "100%",
                cursor: "pointer", color: "var(--ink-3)", fontSize: 13,
                fontFamily: "inherit", fontWeight: 500,
              }}
            >
              <Search size={14} />
              Search or look up a player…
            </button>
          </div>
        </div>
      )}

      {/* Search modal */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center px-4"
          style={{ paddingTop: "12vh", background: "rgba(0,0,0,0.55)" }}
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            style={{
              width: "100%", maxWidth: 540,
              background: "var(--panel)", border: "1px solid var(--line-2)",
              borderRadius: 20, overflow: "hidden",
              boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 18px", borderBottom: "1px solid var(--line)" }}>
              <Search size={14} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && isTag && handlePlayerSearch()}
                placeholder="Search or paste a #PlayerTag…"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "18px 0", fontSize: 16, color: "var(--ink)", fontFamily: "inherit" }}
              />
              <button onClick={() => setIsSearchOpen(false)}
                style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-4)", border: "1px solid var(--line)", borderRadius: 5, padding: "2px 6px", background: "transparent", cursor: "pointer", fontFamily: "var(--font-geist-mono, monospace)" }}
              >
                Esc
              </button>
            </div>

            <div style={{ padding: 6 }}>
              {query && isTag && (
                <button onClick={handlePlayerSearch}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: "transparent", border: "none", cursor: "pointer", color: "var(--ink-2)", fontSize: 13, fontFamily: "inherit", textAlign: "left" }}
                  className="row-hover"
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-soft)", border: "1px solid var(--accent-line)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <User size={13} style={{ color: "var(--accent)" }} />
                  </div>
                  <span style={{ flex: 1 }}>
                    Search player <span style={{ color: "var(--accent)", fontWeight: 700 }}>#{query.replace(/^#/, "")}</span>
                  </span>
                  <ArrowRight size={13} style={{ color: "var(--ink-4)" }} />
                </button>
              )}

              {filtered.map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setIsSearchOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, color: "var(--ink-2)", fontSize: 13, textDecoration: "none" }}
                  className="row-hover"
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--panel-2)", border: "1px solid var(--line)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon size={13} style={{ color: "var(--ink-3)" }} />
                  </div>
                  <span style={{ flex: 1 }}>{label}</span>
                </Link>
              ))}

              {filtered.length === 0 && !isTag && (
                <p style={{ padding: "20px 12px", textAlign: "center", fontSize: 11, color: "var(--ink-4)" }}>
                  No results for &quot;{query}&quot;
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
}
