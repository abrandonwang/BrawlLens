"use client";
import { useState, useEffect, useRef, useCallback, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Menu, Search, X } from "lucide-react";
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

const navMenuCopy: Record<string, string> = {
  Dashboard: "Daily signals and quick reads",
  Brawlers: "Stats, abilities, and meta context",
  Maps: "Modes, layouts, and matchup data",
  Leaderboards: "Players, clubs, and brawler rankings",
  About: "Docs, formulas, and contact",
};

const navIconButtonClass = "grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[var(--ink-3)] hover:text-[var(--ink)]";
const searchRowBaseClass = "flex w-full cursor-pointer items-center gap-3 rounded-[9px] border-0 bg-transparent px-2.5 py-[9px] text-left font-inherit text-[var(--ink)] transition-colors duration-100";

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
      <nav className="fixed top-0 left-0 z-[100] grid min-h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-[18px] bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] px-[max(16px,calc((100vw-1200px)/2))] backdrop-blur-[18px] backdrop-saturate-[145%] max-lg:grid-cols-[1fr_auto]">
        <Link href="/" className="inline-flex items-center gap-[9px] whitespace-nowrap text-[14px] font-semibold text-[var(--ink)] no-underline" aria-label="BrawlLens home">
          <span className="relative inline-block size-[22px] rounded-[7px] bg-[conic-gradient(from_var(--logo-angle),#f97316,#ec4899,#8b5cf6,#3b82f6,#14b8d6,#f97316)] animate-[logo-spin_8s_linear_infinite] after:absolute after:inset-[5px] after:rounded-[3px] after:bg-[#fcfbf8] after:content-['']" />
          <span>BrawlLens</span>
        </Link>
        <div className="flex min-w-0 items-center justify-center gap-0.5 max-lg:hidden">
          {navItems.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={`inline-flex min-h-9 items-center whitespace-nowrap rounded-lg px-3 text-[14px] leading-none no-underline ${isActive(item.href) ? "bg-[var(--hover-bg)] text-[var(--ink)]" : "text-[var(--ink-3)] hover:bg-[var(--hover-bg)] hover:text-[var(--ink)]"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1">
          <button className={navIconButtonClass} onClick={() => setIsSearchOpen(true)} aria-label="Search">
            <Search size={16} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => setIsAssistantOpen(o => !o)}
            className={`flex h-[34px] cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border-0 bg-[#1c1c1c] px-3.5 text-[13px] font-normal text-[#fcfbf8] shadow-[var(--shadow-lift)] transition-opacity duration-150 hover:opacity-85 max-[380px]:px-2.5 max-[380px]:text-[12px] ${isAssistantOpen ? "opacity-70" : ""}`}
            aria-label="Ask AI assistant"
            aria-expanded={isAssistantOpen}
          >
            <span>Brawl AI</span>
          </button>
          <button className={`${navIconButtonClass} p-0 lg:hidden`} onClick={toggleMenu} aria-label="Menu" aria-expanded={isMenuOpen}>
            {isMenuOpen ? <X size={15} strokeWidth={1.9} /> : <Menu size={17} strokeWidth={1.8} />}
          </button>
        </div>
      </nav>
      <div style={{ height: 64 }} />
      {menuVisible && (
        <div
          className="fixed inset-0 z-[90] bg-[color-mix(in_srgb,var(--bg)_72%,transparent)] px-3 pt-[76px] pb-4 backdrop-blur-[14px] backdrop-saturate-[140%]"
          style={{
            animation: menuClosing
              ? "menuOverlayOut 0.38s cubic-bezier(0.4,0,1,1) forwards"
              : "menuOverlayIn 0.32s cubic-bezier(0,0,0.2,1) forwards",
          }}
        >
          <div className="mx-auto flex max-h-[calc(100vh-92px)] max-w-[520px] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-2 shadow-[0_28px_70px_rgba(0,0,0,0.18)]">
            <div className="min-h-0 overflow-y-auto p-2">
              {navItems.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={`flex items-center justify-between gap-4 rounded-xl px-3 py-3 text-inherit no-underline transition-colors ${isActive(item.href) ? "bg-[var(--ink)] text-[#fcfbf8]" : "text-[var(--ink)] hover:bg-[var(--panel-2)]"}`}
                  style={{
                    animation: menuClosing
                      ? "menuItemOut 0.28s cubic-bezier(0.4,0,1,1) forwards"
                      : `menuItemIn 0.4s cubic-bezier(0,0,0.2,1) ${i * 45}ms both`,
                  }}
                >
                  <span className="min-w-0">
                    <span className={`block truncate text-[17px] font-semibold ${isActive(item.href) ? "text-[#fcfbf8]" : "text-[var(--ink)]"}`}>{item.label}</span>
                    <span className={`mt-0.5 block truncate text-[12px] ${isActive(item.href) ? "text-[#fcfbf8]/70" : "text-[var(--ink-4)]"}`}>{navMenuCopy[item.label]}</span>
                  </span>
                  <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[15px] ${isActive(item.href) ? "bg-[#fcfbf8]/14" : "bg-[var(--panel-2)] text-[var(--ink-3)]"}`}>&rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center bg-[color-mix(in_srgb,var(--bg)_55%,transparent)] px-4 pt-[12vh] pb-4 backdrop-blur-[10px] backdrop-saturate-[140%] animate-[searchFadeIn_0.18s_cubic-bezier(0.2,0,0,1)] max-[520px]:px-3 max-[520px]:pt-[8vh] max-[520px]:pb-3"
          onClick={closeSearch}
        >
          <div
            className="w-full max-w-[560px] overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--bg)] shadow-[0_32px_64px_-24px_rgba(28,28,28,0.22),0_8px_20px_-8px_rgba(28,28,28,0.08),rgba(255,255,255,0.4)_0_0.5px_0_0_inset] animate-[searchPanelIn_0.22s_cubic-bezier(0.2,0,0,1)] max-[520px]:rounded-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--line)] px-4">
              <Search size={15} strokeWidth={1.8} className="shrink-0 text-[var(--ink-3)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search pages, docs, or paste a #PlayerTag"
                className="min-w-0 flex-1 border-0 bg-transparent py-4 font-inherit text-[15px] tracking-[-0.005em] text-[var(--ink)] outline-none placeholder:text-[var(--ink-4)]"
              />
              <button onClick={closeSearch} className="shrink-0 cursor-pointer rounded-md border border-[var(--line)] bg-transparent px-[7px] py-[3px] font-mono text-[10px] font-semibold tracking-[0.02em] text-[var(--ink-4)] transition-colors duration-150 hover:border-[var(--line-2)] hover:text-[var(--ink)]">Esc</button>
            </div>

            <div className="max-h-[min(60vh,480px)] overflow-y-auto p-2">
              {hasPlayerLookup && (
                <div>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-[0.06em] text-[var(--ink-4)] uppercase">Player Lookup</div>
                  <button
                    type="button"
                    onClick={handlePlayerSearch}
                    onMouseEnter={() => setActiveIndex(0)}
                    className={`${searchRowBaseClass} ${activeIndex === 0 ? "bg-[var(--hover-bg)]" : ""}`}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-px">
                      <span className="block truncate text-[13.5px] font-medium tracking-[-0.005em] text-[var(--ink)]">
                        Open player <span style={{ fontWeight: 600 }}>#{playerTag}</span>
                      </span>
                      <span className="block truncate text-[11.5px] font-normal text-[var(--ink-3)] max-[520px]:hidden">Public profile lookup by tag.</span>
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
                        className={`${searchRowBaseClass} ${isActiveRow ? "bg-[var(--hover-bg)]" : ""}`}
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-px">
                          <span className="block truncate text-[13.5px] font-medium tracking-[-0.005em] text-[var(--ink)]">{item.label}</span>
                          <span className="block truncate text-[11.5px] font-normal text-[var(--ink-3)] max-[520px]:hidden">{item.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}

              {visibleItems.length === 0 && !hasPlayerLookup && (
                <p className="m-0 px-3 py-7 text-center text-[12px] text-[var(--ink-4)]">
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
