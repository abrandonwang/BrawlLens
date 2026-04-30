"use client";
import { useState, useEffect, useRef, useCallback, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ArrowUp, ArrowDown, CornerDownLeft, Hash, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "Overview",     href: "/" },
  { label: "Brawlers",     href: "/brawlers" },
  { label: "Maps",         href: "/meta" },
  { label: "Leaderboards", href: "/leaderboards" },
  { label: "Ask AI",       href: "/chat" },
  { label: "About",        href: "/about" },
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
          className="lovable-search-backdrop"
          onClick={closeSearch}
        >
          <div
            className="lovable-search-panel"
            onClick={e => e.stopPropagation()}
          >
            <div className="lovable-search-input-row">
              <Search size={15} strokeWidth={1.8} className="lovable-search-input-icon" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search pages, docs, or paste a #PlayerTag"
                className="lovable-search-input"
              />
              <button onClick={closeSearch} className="lovable-search-esc">Esc</button>
            </div>

            <div className="lovable-search-body">
              {hasPlayerLookup && (
                <div className="lovable-search-section">
                  <div className="lovable-search-group-label">Player Lookup</div>
                  <button
                    type="button"
                    onClick={handlePlayerSearch}
                    onMouseEnter={() => setActiveIndex(0)}
                    aria-selected={activeIndex === 0}
                    className={`lovable-search-row ${activeIndex === 0 ? "is-active" : ""}`}
                  >
                    <span className="lovable-search-row-icon" style={{ background: "var(--ink)", color: "var(--bg)", borderColor: "transparent" }}>
                      <Hash size={13} strokeWidth={2.2} />
                    </span>
                    <span className="lovable-search-row-content">
                      <span className="lovable-search-row-title">
                        Open player <span style={{ fontWeight: 600 }}>#{trimmedQuery.replace(/^#/, "")}</span>
                      </span>
                      <span className="lovable-search-row-desc">Public profile lookup by tag.</span>
                    </span>
                    <CornerDownLeft size={13} strokeWidth={1.8} className="lovable-search-row-chevron" />
                  </button>
                </div>
              )}

              {Object.entries(groupedItems).map(([group, items]) => (
                <div key={group} className="lovable-search-section">
                  <div className="lovable-search-group-label">{group}</div>
                  {items.map(item => {
                    const itemIndex = commandIndex++;
                    const isActiveRow = activeIndex === itemIndex;
                    const isRecent = !normalizedQuery && recentItems.some(recent => recent.href === item.href);
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => openCommand(item)}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        aria-selected={isActiveRow}
                        className={`lovable-search-row ${isActiveRow ? "is-active" : ""}`}
                      >
                        <span
                          className="lovable-search-row-icon"
                          style={{ color: item.accent, borderColor: "var(--line)" }}
                        >
                          <span className="lovable-search-row-dot" style={{ background: item.accent }} />
                        </span>
                        <span className="lovable-search-row-content">
                          <span className="lovable-search-row-title">{item.label}</span>
                          <span className="lovable-search-row-desc">{item.description}</span>
                        </span>
                        {isRecent && <span className="lovable-search-row-badge">Recent</span>}
                        <CornerDownLeft size={13} strokeWidth={1.8} className="lovable-search-row-chevron" />
                      </button>
                    );
                  })}
                </div>
              ))}

              {visibleItems.length === 0 && !hasPlayerLookup && (
                <p className="lovable-search-empty">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}
            </div>

            <div className="lovable-search-footer">
              <span className="lovable-search-hint">
                <kbd className="lovable-kbd"><ArrowUp size={9} strokeWidth={2.4} /></kbd>
                <kbd className="lovable-kbd"><ArrowDown size={9} strokeWidth={2.4} /></kbd>
                navigate
              </span>
              <span className="lovable-search-hint">
                <kbd className="lovable-kbd"><CornerDownLeft size={9} strokeWidth={2.4} /></kbd>
                open
              </span>
              <span className="lovable-search-hint">
                <kbd className="lovable-kbd lovable-kbd-text">esc</kbd>
                close
              </span>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
