"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowDown, ArrowUp, ChevronDown, Search } from "lucide-react"
import type { CatalogBrawlerStats } from "@/components/BrawlerCatalog"
import HelpTooltip from "@/components/HelpTooltip"
import { BrawlImage } from "@/components/BrawlImage"
import { EmptyState } from "@/components/PolishStates"
import TierlistSubNav from "@/components/TierlistSubNav"
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

type CatalogSort = "name" | "winRate" | "picks" | "recentBuffs"

const CATALOG_SORT_OPTIONS: { value: CatalogSort; label: string; description: string }[] = [
  { value: "winRate", label: "Win rate", description: "Highest first" },
  { value: "picks", label: "Picks", description: "Most played" },
  { value: "name", label: "Name", description: "A to Z" },
  { value: "recentBuffs", label: "Recent buffs", description: "Changed kits" },
]

const DEFAULT_SORT_DIRECTIONS: Record<CatalogSort, "asc" | "desc"> = {
  winRate: "desc",
  picks: "desc",
  name: "asc",
  recentBuffs: "desc",
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

function getTier(stat: CatalogBrawlerStats | undefined) {
  const winRate = stat?.winRate
  const picks = stat?.picks ?? 0
  if (winRate == null || picks < 10) return { label: "-", color: "var(--lb-text-4)" }
  if (winRate >= 58) return { label: "S+", color: "#f0d373" }
  if (winRate >= 54) return { label: "S", color: "#b99cff" }
  if (winRate >= 51) return { label: "A", color: "#8bd7ff" }
  if (winRate >= 48) return { label: "B", color: "#cbd0dc" }
  if (winRate >= 45) return { label: "C", color: "#ff9f6e" }
  return { label: "D", color: "#ef6a6a" }
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

function getBrawlerClassName(brawler: Brawler) {
  if (brawler.class.name && brawler.class.name !== "Unknown") return brawler.class.name
  return BRAWLER_CLASS_OVERRIDES_BY_ID[brawler.id]
    ?? BRAWLER_CLASS_OVERRIDES_BY_NAME[brawler.name.toUpperCase()]
    ?? "Unclassified"
}

function HeaderHelp({ label, help }: { label: string; help: string }) {
  return (
    <span className="bl-help-label">
      <span>{label}</span>
      <HelpTooltip label={`${label} explained`}>
        {help}
      </HelpTooltip>
    </span>
  )
}

export default function BrawlerPageClient({ brawlers }: { brawlers: Brawler[] }) {
  const [activeRarity, setActiveRarity] = useState<string | null>(null)
  const [activeClass, setActiveClass] = useState<string | null>(null)
  const [catalogSort, setCatalogSort] = useState<CatalogSort>("winRate")
  const [catalogSortDir, setCatalogSortDir] = useState<"asc" | "desc">("desc")
  const [search, setSearch] = useState("")
  const [catalogStats, setCatalogStats] = useState<Record<number, CatalogBrawlerStats>>({})
  const [searchOpen, setSearchOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [rarityOpen, setRarityOpen] = useState(false)
  const [classOpen, setClassOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const rarityDropdownRef = useRef<HTMLDivElement>(null)
  const classDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.add("landing-bg")
    return () => document.documentElement.classList.remove("landing-bg")
  }, [])

  useEffect(() => {
    fetch("/api/brawlers/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.stats) setCatalogStats(d.stats) })
      .catch(() => {})
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
  const averageWinRate = (() => {
    const values = Object.values(catalogStats).filter(stat => stat.winRate != null && stat.picks > 0)
    if (values.length === 0) return null
    return values.reduce((total, stat) => total + (stat.winRate ?? 0), 0) / values.length
  })()
  const filteredBrawlers = brawlers
    .filter(b => {
      const matchesRarity = !activeRarity || b.rarity.name === activeRarity
      const matchesClass = !activeClass || getBrawlerClassName(b) === activeClass
      const matchesSearch = !searchTerm || b.name.toLowerCase().includes(searchTerm)
      return matchesRarity && matchesClass && matchesSearch
    })
    .sort((a, b) => {
      const direction = catalogSortDir === "asc" ? 1 : -1
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
  const analyzedLabel = totalAnalyzedGames > 0 ? formatInteger(totalAnalyzedGames) : formatInteger(brawlers.length)

  return (
    <>
      <main className="bl-tier-shell">
        <TierlistSubNav active="brawlers" />
        <div className="bl-tier-content">
          <section className="bl-tier-intro-card" aria-labelledby="brawlers-title">
            <h1 id="brawlers-title">Brawlers Tierlist: Season 50</h1>
            <div className="bl-tier-analyzed">
              <span>BRAWLERS ANALYZED</span>
              <strong>{analyzedLabel}</strong>
              <HelpTooltip label="How BrawlLens calculates brawler stats">
                This count comes from the current tracked brawler dataset. Rankings use win rate, pick volume, and
                small-sample guardrails rather than a hand-written tier list.
              </HelpTooltip>
            </div>
            <p>
              Compare tracked brawler performance with compact rankings based on win rate, pick volume, and current
              roster filters.
            </p>
          </section>

          <section className="bl-tier-board" aria-label="Brawler tierlist">
            <div className="bl-tier-toolbar">
              <div className="bl-tier-selector-group">
                <div ref={rarityDropdownRef} className="bl-tier-selector-wrap">
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
                  <div className={`bl-tier-menu bl-tier-menu-list ${rarityOpen ? "is-open" : ""}`} role="listbox">
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

                <div ref={classDropdownRef} className="bl-tier-selector-wrap">
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
                  <div className={`bl-tier-menu bl-tier-menu-list ${classOpen ? "is-open" : ""}`} role="listbox">
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

                <div ref={sortDropdownRef} className="bl-tier-selector-wrap">
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
                  <div className={`bl-tier-menu bl-tier-menu-list ${sortOpen ? "is-open" : ""}`} role="listbox">
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

              <div className="bl-tier-search">
                <Search size={15} />
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={e => { setSearch(e.target.value); setSearchOpen(true) }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search brawler..."
                />
                {searchOpen && searchMatches.length > 0 && (
                  <div ref={searchDropdownRef} className="bl-tier-search-menu">
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

            <div className="bl-tier-table-scroll">
              <div className="bl-tier-table">
                <div className="bl-tier-table-head" role="row">
                  <span>Rank</span>
                  <span>Brawler</span>
                  <span>Rarity</span>
                  <span>Class</span>
                  <HeaderHelp label="Tier" help="Tier is derived from tracked win rate with a minimum sample guardrail, so tiny lucky samples do not jump to the top." />
                  <HeaderHelp label="Winrate" help="Wins divided by tracked picks for that brawler across the eligible map dataset." />
                  <HeaderHelp label="Pickrate" help="This brawler's tracked picks divided by the total tracked brawler picks in the current dataset." />
                  <HeaderHelp label="Games" help="The raw tracked pick count used as the sample size for this brawler row." />
                </div>

                {filteredCount === 0 ? (
                  <div className="bl-tier-empty">
                    <EmptyState title="No brawlers found" description="Try a different search or clear the filters." />
                  </div>
                ) : (
                  filteredBrawlers.map((brawler, index) => {
                    const stat = catalogStats[brawler.id]
                    const winRate = stat?.winRate ?? null
                    const pickRate = totalAnalyzedGames > 0 && stat?.picks ? (stat.picks / totalAnalyzedGames) * 100 : null
                    const winDelta = averageWinRate != null && winRate != null ? winRate - averageWinRate : null
                    const tier = getTier(stat)
                    const className = getBrawlerClassName(brawler)
                    return (
                      <Link
                        key={brawler.id}
                        href={brawlerHref(brawler.id)}
                        className="bl-tier-row"
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
                          </span>
                        </span>
                        <span className="bl-tier-rarity">{brawler.rarity.name}</span>
                        <span className="bl-tier-muted">{formatFilterLabel(className)}</span>
                        <span className="bl-tier-tier" style={{ color: tier.color }}>{tier.label}</span>
                        <span className="bl-tier-metric">
                          <strong style={{ color: winRate != null ? winRateColor(winRate) : "var(--lb-text-4)" }}>{formatPercent(winRate)}</strong>
                          <small className={winDelta != null && winDelta < 0 ? "is-negative" : "is-positive"}>
                            {winDelta == null ? "-" : `${winDelta >= 0 ? "+" : ""}${winDelta.toFixed(1)}%`}
                          </small>
                        </span>
                        <span className="bl-tier-metric">
                          <strong>{formatPercent(pickRate)}</strong>
                        </span>
                        <span className="bl-tier-games">{formatInteger(stat?.picks)}</span>
                      </Link>
                    )
                  })
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
