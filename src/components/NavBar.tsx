"use client";
import { useState, useEffect, useRef, useCallback, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Menu, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AssistantPopup from "./AssistantPopup";
import { sanitizePlayerTag } from "@/lib/validation";

const navItems = [
  { label: "Dashboard",    href: "/" },
  { label: "Brawlers",     href: "/brawlers" },
  { label: "Maps",         href: "/meta" },
  { label: "Leaderboards", href: "/leaderboards" },
  { label: "About",        href: "/about" },
];

const menuOverlayBackground = `
  linear-gradient(180deg, var(--bg) 0, var(--bg) 64px, color-mix(in srgb, var(--bg) 88%, #eff8ff 12%) 132px, color-mix(in srgb, var(--bg) 70%, transparent) 260px, transparent 520px),
  radial-gradient(ellipse 920px 520px at 68% 20%, rgba(186, 230, 253, 0.36) 0%, rgba(224, 242, 254, 0.22) 44%, transparent 76%),
  radial-gradient(ellipse 760px 560px at 8% 42%, rgba(221, 214, 254, 0.40) 0%, rgba(237, 233, 254, 0.22) 48%, transparent 78%),
  radial-gradient(ellipse 620px 560px at 92% 72%, rgba(207, 250, 254, 0.30) 0%, transparent 72%),
  linear-gradient(180deg, var(--bg) 0%, #f7f6fb 34%, #eef9fb 70%, #f4efff 100%)
`;

type CommandItem = {
  label: string;
  href: string;
  group: string;
  description: string;
  keywords: string[];
  accent: string;
  action?: "open-assistant";
};

const searchItems: CommandItem[] = [
  {
    label: "Ask AI",
    href: "#assistant",
    group: "Core",
    description: "Open the assistant popup to ask questions.",
    keywords: ["chat", "assistant", "question", "ai"],
    accent: "var(--hc-purple)",
    action: "open-assistant",
  },
  {
    label: "Dashboard",
    href: "/",
    group: "Core",
    description: "Open the BrawlLens dashboard.",
    keywords: ["home", "overview", "watchlist", "meta", "daily"],
    accent: "var(--accent)",
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
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [pendingAssistantQuery, setPendingAssistantQuery] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
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
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setIsSearchOpen(false); closeMenu(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeMenu]);

  useEffect(() => {
    function onOpenAssistant(e: Event) {
      const detail = (e as CustomEvent<{ query?: string }>).detail;
      setIsAssistantOpen(true);
      if (detail?.query) setPendingAssistantQuery(detail.query);
    }
    window.addEventListener("brawllens:open-assistant", onOpenAssistant);
    return () => window.removeEventListener("brawllens:open-assistant", onOpenAssistant);
  }, []);

  function toggleMenu() {
    if (isMenuOpen) closeMenu();
    else setIsMenuOpen(true);
  }

  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const playerTag = sanitizePlayerTag(trimmedQuery);
  const filtered = normalizedQuery ? searchItems.filter(i => commandMatches(i, normalizedQuery)) : [];
  const visibleItems = normalizedQuery ? filtered : searchItems.slice(0, 6);
  const hasPlayerLookup = Boolean(playerTag);
  const actionCount = visibleItems.length + (hasPlayerLookup ? 1 : 0);
  const groupedItems = visibleItems.reduce<Record<string, CommandItem[]>>((groups, item) => {
    groups[item.group] = groups[item.group] ? [...groups[item.group], item] : [item];
    return groups;
  }, {});

  useEffect(() => {
    setActiveIndex(0);
  }, [query, isSearchOpen]);

  function closeSearch() {
    setIsSearchOpen(false);
    setQuery("");
  }

  function openCommand(item: CommandItem) {
    if (item.action === "open-assistant") {
      setIsAssistantOpen(true);
    } else {
      router.push(item.href);
    }
    closeSearch();
  }

  function handlePlayerSearch() {
    if (playerTag) {
      router.push(`/player/${encodeURIComponent(playerTag)}`);
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
          <button
            className={`lovable-ai-button ${isAssistantOpen ? "is-active" : ""}`}
            onClick={() => setIsAssistantOpen(o => !o)}
            aria-label="Ask AI assistant"
            aria-expanded={isAssistantOpen}
          >
            <Image src="/ai-sparkle-512.png" alt="AI Assistant" width={32} height={32} />
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
            background: menuOverlayBackground,
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
                    className={`lovable-search-row ${activeIndex === 0 ? "is-active" : ""}`}
                  >
                    <span className="lovable-search-row-content">
                      <span className="lovable-search-row-title">
                        Open player <span style={{ fontWeight: 600 }}>#{playerTag}</span>
                      </span>
                      <span className="lovable-search-row-desc">Public profile lookup by tag.</span>
                    </span>
                  </button>
                </div>
              )}

              {Object.entries(groupedItems).map(([group, items]) => (
                <div key={group}>
                  {items.map(item => {
                    const itemIndex = commandIndex++;
                    const isActiveRow = activeIndex === itemIndex;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => openCommand(item)}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        className={`lovable-search-row ${isActiveRow ? "is-active" : ""}`}
                      >
                        <span className="lovable-search-row-content">
                          <span className="lovable-search-row-title">{item.label}</span>
                          <span className="lovable-search-row-desc">{item.description}</span>
                        </span>
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
          </div>
        </div>
      )}

      <AssistantPopup
        open={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        pendingQuery={pendingAssistantQuery}
        onPendingConsumed={() => setPendingAssistantQuery(null)}
      />
    </>
  );
}
