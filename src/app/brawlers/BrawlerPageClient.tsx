"use client"

import { useState, useEffect, useRef, type CSSProperties } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { PulsingBorder } from "@paper-design/shaders-react"
import { ArrowDown, ArrowUp, ChevronDown, Search } from "lucide-react"
import HelpTooltip from "@/components/HelpTooltip"
import { BrawlImage } from "@/components/BrawlImage"
import { EmptyState, SkeletonBlock } from "@/components/PolishStates"
import { BUFFIES } from "@/data/buffies"
import { winRateColor } from "@/lib/tiers"
import { useClickOutside } from "@/lib/useClickOutside"
import type { Brawler } from "./page"

const RARITY_ORDER = [
  "Starting Brawler", "Common", "Rare", "Super Rare",
  "Epic", "Mythic", "Legendary", "Ultra Legendary",
]

function sanitizeColor(color: string): string {
  const match = color.match(/#[0-9a-fA-F]{3,6}/)
  return match ? match[0] : "#888"
}

type CatalogSort = "metaScore" | "name" | "winRate" | "picks" | "recentBuffs"
type DropdownHeightState = Record<"rarity" | "class" | "sort" | "search", number>

interface CatalogBrawlerStats {
  picks: number
  wins: number
  winRate: number | null
  winRateDeltaDay?: number | null
  mapCount: number
  histogram: number[]
  bestMap: { name: string; mode: string; winRate: number; picks: number } | null
}

const CATALOG_SORT_OPTIONS: { value: CatalogSort; label: string; description: string }[] = [
  { value: "metaScore", label: "Meta score", description: "Confidence-adjusted" },
  { value: "winRate", label: "Win rate", description: "Highest first" },
  { value: "picks", label: "Picks", description: "Most played" },
  { value: "name", label: "Name", description: "A to Z" },
  { value: "recentBuffs", label: "Recent buffs", description: "Changed kits" },
]

const DEFAULT_SORT_DIRECTIONS: Record<CatalogSort, "asc" | "desc"> = {
  metaScore: "desc",
  winRate: "desc",
  picks: "desc",
  name: "asc",
  recentBuffs: "desc",
}

const TIER_INTRO_BORDER_COLORS = ["#7c5cff", "#5aeed0", "#ff6099", "#f5d75e", "#7c5cff"]
const TIER_INTRO_BORDER_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 3,
  boxSizing: "border-box",
  width: "100%",
  height: "100%",
  borderRadius: "inherit",
  pointerEvents: "none",
  opacity: 0.88,
}

const BRAWLER_CLASS_OVERRIDES_BY_ID: Record<number, string> = {
  16000089: "Controller",
  16000090: "Tank",
  16000092: "Controller",
  16000093: "Support",
  16000094: "Assassin",
  16000095: "Assassin",
  16000096: "Tank",
  16000097: "Damage Dealer",
  16000098: "Controller",
  16000099: "Marksman",
  16000100: "Assassin",
  16000101: "Support",
  16000102: "Controller",
  16000103: "Damage Dealer",
  16000104: "Tank",
  16000105: "Assassin",
  16000106: "Tank",
}

const BRAWLER_CLASS_OVERRIDES_BY_NAME: Record<string, string> = {
  MEEPLE: "Controller",
  OLLIE: "Tank",
  FINX: "Controller",
  "JAE-YONG": "Support",
  KAZE: "Assassin",
  ALLI: "Assassin",
  TRUNK: "Tank",
  MINA: "Damage Dealer",
  ZIGGY: "Controller",
  PIERCE: "Marksman",
  GIGI: "Assassin",
  GLOWY: "Support",
  GLOWLY: "Support",
  SIRIUS: "Controller",
  NAJIA: "Damage Dealer",
  DAMIAN: "Tank",
  "STARR NOVA": "Assassin",
  BOLT: "Tank",
  "BUZZ LIGHTYEAR": "Damage Dealer",
}

function formatInteger(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "-"
  return Math.round(value).toLocaleString()
}

function formatPercent(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return "-"
  return `${value.toFixed(digits)}%`
}

function getWilsonLowerBound(stat: CatalogBrawlerStats) {
  const n = stat.picks
  const p = stat.wins / n
  const z = 1.96
  const z2 = z * z
  const denominator = 1 + z2 / n
  const center = p + z2 / (2 * n)
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)

  return Math.max(0, Math.min(1, (center - margin) / denominator))
}

function getMetaScore(stat: CatalogBrawlerStats | undefined, totalAnalyzedGames = 0) {
  if (!stat || stat.winRate == null || stat.picks < 10 || stat.wins < 0) return null

  const confidenceWinRate = getWilsonLowerBound(stat) * 100
  const sampleScore = Math.min(1, Math.log10(stat.picks + 1) / 6) * 9
  const coverageScore = Math.min(1, stat.mapCount / 16) * 8
  const pickShare = totalAnalyzedGames > 0 ? stat.picks / totalAnalyzedGames : 0
  const demandScore = Math.min(1, pickShare * 12) * 5

  return Math.max(0, Math.min(100, confidenceWinRate * 0.78 + sampleScore + coverageScore + demandScore))
}

function getTier(stat: CatalogBrawlerStats | undefined, totalAnalyzedGames = 0) {
  const score = getMetaScore(stat, totalAnalyzedGames)
  if (score == null) return { label: "-", color: "var(--lb-text-4)" }
  if (score >= 64) return { label: "S+", color: "#f5d75e" }
  if (score >= 60) return { label: "S", color: "#a78bff" }
  if (score >= 56) return { label: "A", color: "#7dd3fc" }
  if (score >= 52) return { label: "B", color: "#e2e6ee" }
  if (score >= 48) return { label: "C", color: "#ffb38a" }
  return { label: "D", color: "#ff7878" }
}

function hasRecentBuffs(brawler: Brawler) {
  const buffy = BUFFIES[brawler.id]
  return Boolean(buffy?.hypercharge || Object.keys(buffy?.gadgets ?? {}).length || Object.keys(buffy?.starPowers ?? {}).length)
}

function formatFilterLabel(name: string) {
  return name.replace(/-/g, " ")
}

function brawlerHref(id: number) {
  return `/brawlers/${id}`
}

function browserSupportsWebGL() {
  try {
    const canvas = document.createElement("canvas")
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
  } catch {
    return false
  }
}

function getBrawlerClassName(brawler: Brawler) {
  if (brawler.class.name && brawler.class.name !== "Unknown") return brawler.class.name
  return BRAWLER_CLASS_OVERRIDES_BY_ID[brawler.id]
    ?? BRAWLER_CLASS_OVERRIDES_BY_NAME[brawler.name.toUpperCase()]
    ?? "Unclassified"
}

export default function BrawlerPageClient({ brawlers }: { brawlers: Brawler[] }) {
  const [activeRarity, setActiveRarity] = useState<string | null>(null)
  const [activeClass, setActiveClass] = useState<string | null>(null)
  const [catalogSort, setCatalogSort] = useState<CatalogSort>("metaScore")
  const [catalogSortDir, setCatalogSortDir] = useState<"asc" | "desc">("desc")
  const [search, setSearch] = useState("")
  const [catalogStats, setCatalogStats] = useState<Record<number, CatalogBrawlerStats>>({})
  const [catalogStatsLoaded, setCatalogStatsLoaded] = useState(false)
  const [introBorderReady, setIntroBorderReady] = useState(false)
  const [tableScrollHint, setTableScrollHint] = useState({ left: false, right: false })
  const [searchOpen, setSearchOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [rarityOpen, setRarityOpen] = useState(false)
  const [classOpen, setClassOpen] = useState(false)
  const [dropdownMaxHeights, setDropdownMaxHeights] = useState<DropdownHeightState>({
    rarity: 318,
    class: 318,
    sort: 318,
    search: 318,
  })
  const searchParams = useSearchParams()
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const rarityDropdownRef = useRef<HTMLDivElement>(null)
  const classDropdownRef = useRef<HTMLDivElement>(null)
  const tableScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.add("landing-bg")
    return () => document.documentElement.classList.remove("landing-bg")
  }, [])

  useEffect(() => {
    setIntroBorderReady(browserSupportsWebGL())
  }, [])

  useEffect(() => {
    setCatalogStatsLoaded(false)
    fetch("/api/brawlers/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.stats) setCatalogStats(d.stats) })
      .catch(() => {})
      .finally(() => setCatalogStatsLoaded(true))
  }, [])

  useEffect(() => {
    const openId = searchParams.get("open")
    if (openId && brawlers.some(b => String(b.id) === openId)) router.replace(brawlerHref(Number(openId)))
  }, [searchParams, brawlers, router])

  const searchTerm = search.trim().toLowerCase()
  const searchMatches = searchTerm
    ? brawlers.filter(b => b.name.toLowerCase().includes(searchTerm))
    : brawlers
  const classes = Array.from(new Set(brawlers.map(getBrawlerClassName).filter(name => name !== "Unclassified"))).sort()
  const selectedSortOption = CATALOG_SORT_OPTIONS.find(option => option.value === catalogSort) ?? CATALOG_SORT_OPTIONS[0]
  const totalAnalyzedGames = Object.values(catalogStats).reduce((total, stat) => total + (stat?.picks ?? 0), 0)
  const filteredBrawlers = brawlers
    .filter(b => {
      const matchesRarity = !activeRarity || b.rarity.name === activeRarity
      const matchesClass = !activeClass || getBrawlerClassName(b) === activeClass
      const matchesSearch = !searchTerm || b.name.toLowerCase().includes(searchTerm)
      return matchesRarity && matchesClass && matchesSearch
    })
    .sort((a, b) => {
      const direction = catalogSortDir === "asc" ? 1 : -1
      if (catalogSort === "metaScore") {
        return ((getMetaScore(catalogStats[a.id], totalAnalyzedGames) ?? -1) - (getMetaScore(catalogStats[b.id], totalAnalyzedGames) ?? -1)) * direction || a.name.localeCompare(b.name)
      }
      if (catalogSort === "winRate") {
        return ((catalogStats[a.id]?.winRate ?? -1) - (catalogStats[b.id]?.winRate ?? -1)) * direction || a.name.localeCompare(b.name)
      }
      if (catalogSort === "picks") {
        return ((catalogStats[a.id]?.picks ?? 0) - (catalogStats[b.id]?.picks ?? 0)) * direction || a.name.localeCompare(b.name)
      }
      if (catalogSort === "recentBuffs") {
        return (Number(hasRecentBuffs(a)) - Number(hasRecentBuffs(b))) * direction || a.name.localeCompare(b.name)
      }
      return a.name.localeCompare(b.name) * direction
    })

  useClickOutside([searchDropdownRef, searchInputRef], () => setSearchOpen(false), searchOpen)
  useClickOutside(sortDropdownRef, () => setSortOpen(false), sortOpen)
  useClickOutside(rarityDropdownRef, () => setRarityOpen(false), rarityOpen)
  useClickOutside(classDropdownRef, () => setClassOpen(false), classOpen)

  const rarities = RARITY_ORDER.filter(name => brawlers.some(b => b.rarity.name === name))
  const filteredCount = filteredBrawlers.length

  useEffect(() => {
    const getBelowMaxHeight = (trigger: Element | null, fallback = 318) => {
      if (!trigger) return fallback

      const triggerRect = trigger.getBoundingClientRect()
      const viewportInset = 12
      const spaceBelow = Math.floor(window.innerHeight - triggerRect.bottom - viewportInset)

      return Math.max(72, Math.min(fallback, spaceBelow))
    }

    let frame = 0
    const updateDropdownHeights = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        setDropdownMaxHeights(current => {
          const next: DropdownHeightState = { ...current }

          if (rarityOpen) {
            next.rarity = getBelowMaxHeight(rarityDropdownRef.current?.querySelector(".bl-tier-selector") ?? null, 318)
          }
          if (classOpen) {
            next.class = getBelowMaxHeight(classDropdownRef.current?.querySelector(".bl-tier-selector") ?? null, 318)
          }
          if (sortOpen) {
            next.sort = getBelowMaxHeight(sortDropdownRef.current?.querySelector(".bl-tier-selector") ?? null, 240)
          }
          if (searchOpen && searchTerm.length > 0) {
            next.search = getBelowMaxHeight(searchInputRef.current?.closest(".bl-tier-search") ?? null, 318)
          }

          return Object.keys(next).every(key =>
            next[key as keyof DropdownHeightState] === current[key as keyof DropdownHeightState]
          ) ? current : next
        })
        frame = 0
      })
    }

    updateDropdownHeights()
    window.addEventListener("resize", updateDropdownHeights)
    window.addEventListener("scroll", updateDropdownHeights, true)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", updateDropdownHeights)
      window.removeEventListener("scroll", updateDropdownHeights, true)
    }
  }, [rarityOpen, classOpen, sortOpen, searchOpen, searchTerm])

  useEffect(() => {
    const scroller = tableScrollRef.current
    if (!scroller) return

    let frame = 0
    const updateScrollHint = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
        const next = {
          left: scroller.scrollLeft > 4,
          right: scroller.scrollLeft < maxScrollLeft - 4,
        }

        setTableScrollHint(current =>
          current.left === next.left && current.right === next.right ? current : next
        )
        frame = 0
      })
    }

    updateScrollHint()
    scroller.addEventListener("scroll", updateScrollHint, { passive: true })
    window.addEventListener("resize", updateScrollHint)

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(updateScrollHint)
      : null
    resizeObserver?.observe(scroller)
    if (scroller.firstElementChild) resizeObserver?.observe(scroller.firstElementChild)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      scroller.removeEventListener("scroll", updateScrollHint)
      window.removeEventListener("resize", updateScrollHint)
      resizeObserver?.disconnect()
    }
  }, [catalogStatsLoaded, filteredCount])

  const analyzedLabel = totalAnalyzedGames > 0
    ? formatInteger(totalAnalyzedGames)
    : catalogStatsLoaded
      ? `${formatInteger(brawlers.length)} brawlers`
      : "Loading..."
  return (
    <>
      <main className="bl-tier-shell">
        <div className="bl-tier-content">
          <section
            className="relative isolate mb-4 overflow-visible rounded-[10px] max-[560px]:mb-3"
            aria-labelledby="brawlers-title"
          >
            {introBorderReady && (
              <PulsingBorder
                aria-hidden="true"
                className="bl-tier-hero-border-shader"
                style={TIER_INTRO_BORDER_STYLE}
                colors={TIER_INTRO_BORDER_COLORS}
                colorBack="#00000000"
                roundness={0.08}
                thickness={0.08}
                softness={0.72}
                intensity={0.22}
                bloom={0.22}
                spots={5}
                spotSize={0.48}
                pulse={0.22}
                smoke={0.28}
                smokeSize={0.64}
                speed={0.82}
                scale={1}
              />
            )}

            <div className="relative z-[2] min-h-[132px] rounded-[10px] border border-[rgba(245,244,241,0.105)] bg-[#101015] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] max-[760px]:px-4 max-[760px]:py-4">
              <div className="mx-auto grid max-w-[1040px] justify-items-center text-center">
                <h1
                  id="brawlers-title"
                  className="m-0 text-[clamp(18px,2.52vw,29px)] font-[820] leading-[1.02] tracking-[0] text-[#f5f4f1] [font-family:var(--font-heading)]"
                >
                  Tierlist &amp; Builds Top 1000, S50
                </h1>

                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[clamp(11px,1.2vw,13px)] leading-none">
                  <span className="font-[720] uppercase tracking-[0.02em] text-[rgba(245,244,241,0.82)]">BRAWLERS ANALYZED</span>
                  <strong className="font-[900] text-[#f2de8a] [font-family:var(--font-number,var(--font-geist-mono),ui-monospace,monospace)]">
                    {analyzedLabel}
                  </strong>
                  <HelpTooltip label="How BrawlLens calculates brawler stats">
                    This count comes from the current tracked brawler dataset. Rankings use a Wilson confidence score,
                    win rate, pick volume, and map coverage rather than a hand-written tier list.
                  </HelpTooltip>
                </div>

                <p className="m-0 mt-4 max-w-[960px] text-[clamp(11px,1.14vw,13px)] font-[560] leading-[1.42] text-[rgba(245,244,241,0.78)]">
                  The current Brawl Stars meta ranked by live win rate and pick data.
                </p>
              </div>
            </div>
          </section>

          <section className="bl-tier-board" aria-label="Brawler tierlist">
            <div className="bl-tier-toolbar">
              <div className="bl-tier-selector-group">
                <div className="bl-tier-selector-anchor">
                <div
                  ref={rarityDropdownRef}
                  className="bl-tier-selector-wrap"
                  onPointerEnter={event => {
                    if (event.pointerType !== "mouse") return
                    setRarityOpen(true)
                    setClassOpen(false)
                    setSortOpen(false)
                    setSearchOpen(false)
                  }}
                  onPointerLeave={event => {
                    if (event.pointerType === "mouse") setRarityOpen(false)
                  }}
                  onFocus={() => {
                    setRarityOpen(true)
                    setClassOpen(false)
                    setSortOpen(false)
                    setSearchOpen(false)
                  }}
                  onBlur={event => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setRarityOpen(false)
                  }}
                >
                  <button
                    type="button"
                    className="bl-tier-selector"
                    aria-haspopup="listbox"
                    aria-expanded={rarityOpen}
                    onClick={() => {
                      setRarityOpen(open => !open)
                      setClassOpen(false)
                      setSortOpen(false)
                    }}
                  >
                    <span>{activeRarity ?? "All rarities"}</span>
                    <ChevronDown size={14} className={rarityOpen ? "rotate-180" : ""} />
                  </button>
                  <div
                    className={`bl-tier-menu bl-tier-menu-list ${rarityOpen ? "is-open" : ""}`}
                    role="listbox"
                    style={{ maxHeight: dropdownMaxHeights.rarity }}
                  >
                    {rarities.map(rarity => {
                      const active = activeRarity === rarity
                      return (
                        <button
                          key={rarity}
                          type="button"
                          role="option"
                          aria-selected={active}
                          className={`bl-tier-menu-card ${active ? "is-active" : ""}`}
                          onClick={() => {
                            setActiveRarity(rarity)
                            setRarityOpen(false)
                          }}
                        >
                          <span>{rarity}</span>
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      role="option"
                      aria-selected={activeRarity === null}
                      className={`bl-tier-menu-card bl-tier-menu-card-all ${activeRarity === null ? "is-active" : ""}`}
                      onClick={() => {
                        setActiveRarity(null)
                        setRarityOpen(false)
                      }}
                    >
                      All rarities
                    </button>
                  </div>
                </div>
                </div>

                <div className="bl-tier-selector-anchor">
                <div
                  ref={classDropdownRef}
                  className="bl-tier-selector-wrap"
                  onPointerEnter={event => {
                    if (event.pointerType !== "mouse") return
                    setClassOpen(true)
                    setRarityOpen(false)
                    setSortOpen(false)
                    setSearchOpen(false)
                  }}
                  onPointerLeave={event => {
                    if (event.pointerType === "mouse") setClassOpen(false)
                  }}
                  onFocus={() => {
                    setClassOpen(true)
                    setRarityOpen(false)
                    setSortOpen(false)
                    setSearchOpen(false)
                  }}
                  onBlur={event => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setClassOpen(false)
                  }}
                >
                  <button
                    type="button"
                    className="bl-tier-selector"
                    aria-haspopup="listbox"
                    aria-expanded={classOpen}
                    onClick={() => {
                      setClassOpen(open => !open)
                      setRarityOpen(false)
                      setSortOpen(false)
                    }}
                  >
                    <span>{activeClass ? formatFilterLabel(activeClass) : "All classes"}</span>
                    <ChevronDown size={14} className={classOpen ? "rotate-180" : ""} />
                  </button>
                  <div
                    className={`bl-tier-menu bl-tier-menu-list ${classOpen ? "is-open" : ""}`}
                    role="listbox"
                    style={{ maxHeight: dropdownMaxHeights.class }}
                  >
                    {classes.map(name => {
                      const active = activeClass === name
                      return (
                        <button
                          key={name}
                          type="button"
                          role="option"
                          aria-selected={active}
                          className={`bl-tier-menu-card ${active ? "is-active" : ""}`}
                          onClick={() => {
                            setActiveClass(name)
                            setClassOpen(false)
                          }}
                        >
                          {formatFilterLabel(name)}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      role="option"
                      aria-selected={activeClass === null}
                      className={`bl-tier-menu-card bl-tier-menu-card-all ${activeClass === null ? "is-active" : ""}`}
                      onClick={() => {
                        setActiveClass(null)
                        setClassOpen(false)
                      }}
                    >
                      All classes
                    </button>
                  </div>
                </div>
                </div>

                <div className="bl-tier-selector-anchor">
                <div
                  ref={sortDropdownRef}
                  className="bl-tier-selector-wrap"
                  onPointerEnter={event => {
                    if (event.pointerType !== "mouse") return
                    setSortOpen(true)
                    setRarityOpen(false)
                    setClassOpen(false)
                    setSearchOpen(false)
                  }}
                  onPointerLeave={event => {
                    if (event.pointerType === "mouse") setSortOpen(false)
                  }}
                  onFocus={() => {
                    setSortOpen(true)
                    setRarityOpen(false)
                    setClassOpen(false)
                    setSearchOpen(false)
                  }}
                  onBlur={event => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSortOpen(false)
                  }}
                >
                  <button
                    type="button"
                    className="bl-tier-selector"
                    aria-haspopup="listbox"
                    aria-expanded={sortOpen}
                    onClick={() => {
                      setSortOpen(open => !open)
                      setRarityOpen(false)
                      setClassOpen(false)
                    }}
                  >
                    <span>{selectedSortOption.label}</span>
                    {catalogSortDir === "desc"
                      ? <ArrowDown size={13} aria-hidden="true" />
                      : <ArrowUp size={13} aria-hidden="true" />
                    }
                    <ChevronDown size={14} className={sortOpen ? "rotate-180" : ""} />
                  </button>
                  <div
                    className={`bl-tier-menu bl-tier-menu-list ${sortOpen ? "is-open" : ""}`}
                    role="listbox"
                    style={{ maxHeight: dropdownMaxHeights.sort }}
                  >
                    {CATALOG_SORT_OPTIONS.map(option => {
                      const active = catalogSort === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={active}
                          className={`bl-tier-menu-row ${active ? "is-active" : ""}`}
                          onClick={() => {
                            if (catalogSort === option.value) {
                              setCatalogSortDir(current => current === "desc" ? "asc" : "desc")
                            } else {
                              setCatalogSort(option.value)
                              setCatalogSortDir(DEFAULT_SORT_DIRECTIONS[option.value])
                            }
                            setSortOpen(false)
                          }}
                        >
                          <strong>{option.label}</strong>
                          {active && (
                            catalogSortDir === "desc"
                              ? <ArrowDown size={13} aria-label="Highest first" />
                              : <ArrowUp size={13} aria-label="Lowest first" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
                </div>
              </div>

              <div className="bl-tier-search-anchor">
              <div className="bl-tier-search">
                <div className="bl-tier-search-bar">
                <Search size={15} />
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={e => {
                    const nextSearch = e.target.value
                    setSearch(nextSearch)
                    setSearchOpen(nextSearch.trim().length > 0)
                    setRarityOpen(false)
                    setClassOpen(false)
                    setSortOpen(false)
                  }}
                  onFocus={() => {
                    setSearchOpen(search.trim().length > 0)
                    setRarityOpen(false)
                    setClassOpen(false)
                    setSortOpen(false)
                  }}
                  aria-label="Search brawlers"
                  autoComplete="off"
                  placeholder="Search brawler..."
                />
                </div>
                {searchOpen && searchTerm.length > 0 && searchMatches.length > 0 && (
                  <div
                    ref={searchDropdownRef}
                    className="bl-tier-search-menu"
                    style={{ maxHeight: dropdownMaxHeights.search }}
                  >
                    {searchMatches.slice(0, 12).map(brawler => (
                      <Link
                        key={brawler.id}
                        href={brawlerHref(brawler.id)}
                        onClick={() => setSearchOpen(false)}
                      >
                        <BrawlImage
                          src={brawler.imageUrl2}
                          alt={brawler.name}
                          width={28}
                          height={28}
                          className="size-7 object-cover"
                          sizes="28px"
                        />
                        <span>
                          <strong>{brawler.name}</strong>
                          <small style={{ color: sanitizeColor(brawler.rarity.color) }}>{brawler.rarity.name}</small>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              </div>
            </div>

            <div className={`bl-tier-table-scroll-shell ${tableScrollHint.left ? "has-scroll-left" : ""} ${tableScrollHint.right ? "has-scroll-right" : ""}`}>
              <div ref={tableScrollRef} className="bl-tier-table-scroll">
                <div className="bl-tier-table">
                <div className="bl-tier-table-head" role="row">
                  <span>Rank</span>
                  <span>Brawler</span>
                  <span>Tier</span>
                  <span>Meta score</span>
                  <span>Win rate</span>
                  <span>Pick rate</span>
                  <span>Best map</span>
                  <span>Sample</span>
                </div>

                {!catalogStatsLoaded ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="bl-tier-row" aria-hidden="true">
                      <SkeletonBlock className="mx-auto h-4 w-5" />
                      <span className="bl-tier-brawler-cell">
                        <SkeletonBlock className="bl-tier-brawler-icon rounded-[5px]" />
                        <span className="min-w-0 space-y-1.5">
                          <SkeletonBlock className="h-3.5 w-28" />
                          <SkeletonBlock className="h-2.5 w-16" />
                        </span>
                      </span>
                      <SkeletonBlock className="mx-auto h-5 w-7" />
                      <SkeletonBlock className="mx-auto h-3.5 w-14" />
                      <SkeletonBlock className="mx-auto h-3.5 w-16" />
                      <SkeletonBlock className="mx-auto h-3.5 w-16" />
                      <SkeletonBlock className="h-3.5 w-28" />
                      <SkeletonBlock className="mx-auto h-3.5 w-20" />
                    </div>
                  ))
                ) : filteredCount === 0 ? (
                  <div className="bl-tier-empty">
                    <EmptyState title="No brawlers found" description="Try a different search or clear the filters." />
                  </div>
                ) : (
                  filteredBrawlers.map((brawler, index) => {
                    const stat = catalogStats[brawler.id]
                    const winRate = stat?.winRate ?? null
                    const pickRate = totalAnalyzedGames > 0 && stat?.picks ? (stat.picks / totalAnalyzedGames) * 100 : null
                    const winDelta = stat?.winRateDeltaDay ?? null
                    const tier = getTier(stat, totalAnalyzedGames)
                    const className = getBrawlerClassName(brawler)
                    const metaScore = getMetaScore(stat, totalAnalyzedGames)
                    return (
                      <Link
                        key={brawler.id}
                        href={brawlerHref(brawler.id)}
                        className={`bl-tier-row ${index < 3 ? "is-podium" : ""}`}
                      >
                        <span className="bl-tier-rank">{index + 1}</span>
                        <span className="bl-tier-brawler-cell">
                          <BrawlImage
                            src={brawler.imageUrl2}
                            alt={brawler.name}
                            width={46}
                            height={46}
                            className="bl-tier-brawler-icon"
                            sizes="46px"
                            priority={index < 12}
                          />
                          <span className="min-w-0">
                            <strong>{brawler.name}</strong>
                            <small>{brawler.rarity.name} · {formatFilterLabel(className)}</small>
                          </span>
                        </span>
                        <span className="bl-tier-tier" style={{ color: tier.color }}>{tier.label}</span>
                        <span className="bl-tier-score">{metaScore == null ? "-" : metaScore.toFixed(1)}</span>
                        <span className="bl-tier-metric">
                          <strong style={{ color: winRate != null ? winRateColor(winRate) : "var(--lb-text-4)" }}>{formatPercent(winRate)}</strong>
                          {winDelta != null && <small className="is-delta">{`${winDelta >= 0 ? "+" : ""}${winDelta.toFixed(1)}%`}</small>}
                        </span>
                        <span className="bl-tier-metric">
                          <strong>{formatPercent(pickRate)}</strong>
                        </span>
                        <span className="bl-tier-best-map">
                          <strong>{stat?.bestMap?.name ?? "-"}</strong>
                          {stat?.bestMap && <small>{stat.bestMap.mode} · {formatPercent(stat.bestMap.winRate)} WR</small>}
                        </span>
                        <span className="bl-tier-sample">
                          <strong>{formatInteger(stat?.picks)}</strong>
                        </span>
                      </Link>
                    )
                  })
                )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
