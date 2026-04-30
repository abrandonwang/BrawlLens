"use client";
import { useState, useEffect, useRef, useCallback, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ChevronsUpDown, Menu, Search, X } from "lucide-react";
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

type CommandItem = {
  label: string;
  href: string;
  group: string;
  description: string;
  keywords: string[];
  accent: string;
};

const SEARCH_RECENT_KEY = "brawllens:recent-search";

const searchItems: CommandItem[] = [
  {
    label: "Ask AI",
    href: "/chat",
    group: "Core",
    description: "Ask questions about players, maps, brawlers, and rankings.",
    keywords: ["chat", "assistant", "question"],
    accent: "var(--hc-purple)",
  },
  {
    label: "Brawlers",
    href: "/brawlers",
    group: "Core",
    description: "Browse brawler stats, abilities, rarities, and performance.",
    keywords: ["meta", "stats", "catalog"],
    accent: "var(--accent)",
  },
  {
    label: "Maps",
    href: "/meta",
    group: "Core",
    description: "Explore tracked maps, modes, live rotation, and map stats.",
    keywords: ["meta", "rotation", "modes"],
    accent: "var(--r-rare)",
  },
  {
    label: "Player Leaderboards",
    href: "/leaderboards/players",
    group: "Leaderboards",
    description: "Compare top players by region and trophies.",
    keywords: ["rankings", "players", "global", "trophies"],
    accent: "var(--hc-cyan)",
  },
  {
    label: "Club Leaderboards",
    href: "/leaderboards/clubs",
    group: "Leaderboards",
    description: "Browse the highest trophy clubs.",
    keywords: ["clubs", "rankings", "teams"],
    accent: "var(--r-superrare)",
  },
  {
    label: "Brawler Rankings",
    href: "/leaderboards/brawlers",
    group: "Leaderboards",
    description: "Open brawler-specific trophy rankings.",
    keywords: ["brawler trophies", "rankings"],
    accent: "var(--r-ultra)",
  },
  {
    label: "About BrawlLens",
    href: "/about",
    group: "Docs",
    description: "Read the project overview and how the site works.",
    keywords: ["docs", "documentation", "intro"],
    accent: "var(--ink-3)",
  },
  {
    label: "Calculations",
    href: "/about#calculations",
    group: "Docs",
    description: "See how win rate, best overall, and map highlights are computed.",
    keywords: ["formula", "score", "metrics"],
    accent: "var(--r-mythic)",
  },
  {
    label: "Search Help",
    href: "/about#search-help",
    group: "Docs",
    description: "Learn command search, player lookup, and keyboard shortcuts.",
    keywords: ["palette", "commands", "keyboard"],
    accent: "var(--hc-blue)",
  },
  {
    label: "Contact",
    href: "/about#contact",
    group: "Docs",
    description: "Send bugs, feature requests, or confusing data reports.",
    keywords: ["email", "support", "feedback"],
    accent: "var(--r-legendary)",
  },
];

function commandMatches(item: CommandItem, q: string) {
  const haystack = [item.label, item.description, item.group, ...item.keywords].join(" ").toLowerCase();
  return haystack.includes(q);
}

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<CommandItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousPathnameRef = useRef(pathname);

  const closeMenu = useCallback(() => {
    if (!isMenuOpen) return;
    setMenuClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setMenuClosing(false);
    }, 380);
  }, [isMenuOpen]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isMenuOpen || menuClosing) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen, menuClosing]);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      closeMenu();
    }
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (isSearchOpen) {
      setQuery("");
      setActiveIndex(0);
      try {
        const raw = window.localStorage.getItem(SEARCH_RECENT_KEY);
        const hrefs = raw ? (JSON.parse(raw) as string[]) : [];
        setRecentItems(hrefs.map(href => searchItems.find(item => item.href === href)).filter(Boolean) as CommandItem[]);
      } catch {
        setRecentItems([]);
      }
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
  }, [closeMenu]);

  function toggleMenu() {
    if (isMenuOpen) closeMenu();
    else setIsMenuOpen(true);
  }

  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const isTag = trimmedQuery.startsWith("#") || /^[A-Z0-9]{3,}$/i.test(trimmedQuery);
  const filtered = normalizedQuery ? searchItems.filter(i => commandMatches(i, normalizedQuery)) : [];
  const visibleItems = normalizedQuery ? filtered : recentItems.length ? recentItems : searchItems.slice(0, 6);
  const hasPlayerLookup = Boolean(trimmedQuery && isTag);
  const actionCount = visibleItems.length + (hasPlayerLookup ? 1 : 0);
  const groupedItems = visibleItems.reduce<Record<string, CommandItem[]>>((groups, item) => {
    groups[item.group] = groups[item.group] ? [...groups[item.group], item] : [item];
    return groups;
  }, {});

  useEffect(() => {
    setActiveIndex(0);
  }, [query, isSearchOpen]);

  function rememberSearchItem(item: CommandItem) {
    const next = [item.href, ...recentItems.filter(recent => recent.href !== item.href).map(recent => recent.href)].slice(0, 5);
    try {
      window.localStorage.setItem(SEARCH_RECENT_KEY, JSON.stringify(next));
    } catch {
      // Recent search history is a small enhancement; navigation should still work without storage.
    }
    setRecentItems(next.map(href => searchItems.find(searchItem => searchItem.href === href)).filter(Boolean) as CommandItem[]);
  }

  function closeSearch() {
    setIsSearchOpen(false);
    setQuery("");
  }

  function openCommand(item: CommandItem) {
    rememberSearchItem(item);
    router.push(item.href);
    closeSearch();
  }

  function handlePlayerSearch() {
    const tag = trimmedQuery.replace(/^#/, "");
    if (tag) {
      router.push(`/player/${tag}`);
      closeSearch();
    }
  }

  function handleSearchKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && actionCount > 0) {
      e.preventDefault();
      setActiveIndex(index => (index + 1) % actionCount);
      return;
    }

    if (e.key === "ArrowUp" && actionCount > 0) {
      e.preventDefault();
      setActiveIndex(index => (index - 1 + actionCount) % actionCount);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (hasPlayerLookup && activeIndex === 0) {
        handlePlayerSearch();
        return;
      }
      const item = visibleItems[activeIndex - (hasPlayerLookup ? 1 : 0)];
      if (item) openCommand(item);
      return;
    }

    if (e.key === "Escape") {
      closeSearch();
    }
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const menuVisible = isMenuOpen || menuClosing;
  let commandIndex = hasPlayerLookup ? 1 : 0;

  return (
    <>
      <nav className="lovable-nav">
        <Link href="/" className="lovable-nav-brand" aria-label="BrawlLens home">
          <span className="lovable-brand-mark" />
          <span>BrawlLens</span>
        </Link>
        <div className="lovable-nav-links">
          {navItems.map(item => (
            <Link key={item.label} href={item.href} className={isActive(item.href) ? "is-active" : ""}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="lovable-nav-actions">
          <button onClick={() => setIsSearchOpen(true)} aria-label="Search">
            <Search size={16} strokeWidth={1.8} />
          </button>
          {mounted && (
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
              <ChevronsUpDown size={16} strokeWidth={1.8} />
            </button>
          )}
          <button className="lovable-menu-button" onClick={toggleMenu} aria-label="Menu" aria-expanded={isMenuOpen}>
            {isMenuOpen ? <X size={15} strokeWidth={1.9} /> : <Menu size={17} strokeWidth={1.8} />}
          </button>
        </div>
      </nav>
      <div style={{ height: 64 }} />
      {menuVisible && (
        <div
          className="nav-menu-overlay"
          style={{
            position: "fixed", inset: 0, zIndex: 90,
            background: "var(--bg)",
            display: "flex", flexDirection: "column",
            animation: menuClosing
              ? "menuOverlayOut 0.38s cubic-bezier(0.4,0,1,1) forwards"
              : "menuOverlayIn 0.32s cubic-bezier(0,0,0.2,1) forwards",
          }}
        >
          <div style={{ height: 80, flexShrink: 0 }} />
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
              <Search size={14} strokeWidth={1.8} />
              Search or look up a player…
            </button>
          </div>
        </div>
      )}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center px-4"
          style={{ paddingTop: "12vh", background: "rgba(0,0,0,0.55)" }}
          onClick={closeSearch}
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
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search pages, docs, or paste a #PlayerTag…"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "18px 0", fontSize: 16, color: "var(--ink)", fontFamily: "inherit" }}
              />
              <button onClick={closeSearch}
                style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-4)", border: "1px solid var(--line)", borderRadius: 5, padding: "2px 6px", background: "transparent", cursor: "pointer", fontFamily: "var(--font-geist-mono, monospace)" }}
              >
                Esc
              </button>
            </div>

            <div style={{ padding: 8 }}>
              {hasPlayerLookup && (
                <button
                  onClick={handlePlayerSearch}
                  onMouseEnter={() => setActiveIndex(0)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 12,
                    background: activeIndex === 0 ? "var(--hover-bg)" : "transparent",
                    border: "1px solid transparent", cursor: "pointer",
                    color: "var(--ink-2)", fontSize: 13, fontFamily: "inherit", textAlign: "left",
                  }}
                  className="interactive-row"
                >
                  <div style={{ width: 5, height: 34, borderRadius: 999, background: "var(--accent)", flexShrink: 0 }} />
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-soft)", border: "1px solid var(--accent-line)", display: "grid", placeItems: "center", flexShrink: 0, color: "var(--accent)", fontSize: 12, fontWeight: 800 }}>
                    #
                  </div>
                  <span style={{ flex: 1 }}>
                    Search player <span style={{ color: "var(--accent)", fontWeight: 700 }}>#{trimmedQuery.replace(/^#/, "")}</span>
                    <span style={{ display: "block", marginTop: 2, color: "var(--ink-4)", fontSize: 11 }}>Open a public player profile by tag.</span>
                  </span>
                </button>
              )}

              {Object.entries(groupedItems).map(([group, items]) => (
                <div key={group} style={{ paddingTop: hasPlayerLookup || group !== Object.keys(groupedItems)[0] ? 6 : 0 }}>
                  {items.map(item => {
                    const itemIndex = commandIndex++;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => openCommand(item)}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 12px", borderRadius: 12,
                          background: activeIndex === itemIndex ? "var(--hover-bg)" : "transparent",
                          border: "1px solid transparent", cursor: "pointer",
                          color: "var(--ink-2)", fontSize: 13, fontFamily: "inherit", textAlign: "left",
                        }}
                        className="interactive-row"
                      >
                        <div style={{ width: 5, height: 34, borderRadius: 999, background: item.accent, flexShrink: 0, opacity: activeIndex === itemIndex ? 1 : 0.72 }} />
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ display: "block", color: "var(--ink)", fontWeight: 650 }}>{item.label}</span>
                          <span style={{ display: "block", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink-4)", fontSize: 11 }}>{item.description}</span>
                        </span>
                        {!normalizedQuery && recentItems.some(recent => recent.href === item.href) && (
                          <span style={{ border: "1px solid var(--line)", borderRadius: 999, padding: "2px 7px", color: "var(--ink-4)", fontSize: 10, fontWeight: 700 }}>
                            Recent
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {visibleItems.length === 0 && !hasPlayerLookup && (
                <p style={{ padding: "20px 12px", textAlign: "center", fontSize: 11, color: "var(--ink-4)" }}>
                  No results for &quot;{query}&quot;
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--line)", marginTop: 8, padding: "10px 12px 2px", color: "var(--ink-4)", fontSize: 10 }}>
                <span>Up/Down navigate</span>
                <span>Enter open</span>
                <span>Esc close</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
