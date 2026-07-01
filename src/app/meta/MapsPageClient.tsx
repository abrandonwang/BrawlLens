"use client"

import { useState, useEffect, useRef, useMemo, type CSSProperties } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { PulsingBorder } from "@paper-design/shaders-react"
import { ChevronDown, Search } from "lucide-react"
import HelpTooltip from "@/components/HelpTooltip"
import MetaDashboard from "@/components/MetaDashboard"
import { BrawlImage } from "@/components/BrawlImage"
import { formatBrawlerName, normalizeMapName } from "@/lib/format"
import { getModeName } from "@/lib/modes"
import { useClickOutside } from "@/lib/useClickOutside"

interface ModeInfo {
  mode: string
  totalBattles: number
  maps: { name: string; battles: number }[]
}

interface CatalogBrawlerStat {
  id: number
  name: string
  picks: number
  wins: number
  winRate: number | null
}

function mapHref(name: string) {
  return `/meta/${encodeURIComponent(name)}`
}

function formatFullNumber(value: number) {
  return value.toLocaleString("en-US")
}

const MAP_INTRO_BORDER_COLORS = ["#FF6B6B", "#5aeed0", "#ff6099", "#f5d75e", "#FF6B6B"]
const MAP_INTRO_BORDER_STYLE: CSSProperties = {
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

function browserSupportsWebGL() {
  try {
    const canvas = document.createElement("canvas")
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
  } catch {
    return false
  }
}

export default function MapsPageClient() {
  const [modes, setModes] = useState<ModeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [mapSearch, setMapSearch] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  const [spotlightTopBrawler, setSpotlightTopBrawler] = useState<{ id: number; name: string; picks: number; winRate: number } | null>(null)
  const [spotlightBrawlerLoaded, setSpotlightBrawlerLoaded] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [modeOpen, setModeOpen] = useState(false)
  const [introBorderReady, setIntroBorderReady] = useState(false)
  const [mapImageLookup, setMapImageLookup] = useState<Map<string, string>>(new Map())
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const modeDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.add("landing-bg")
    return () => document.documentElement.classList.remove("landing-bg")
  }, [])

  useEffect(() => {
    setIntroBorderReady(browserSupportsWebGL())
  }, [])

  useEffect(() => {
    fetch("https://api.brawlapi.com/v1/maps")
      .then(r => r.ok ? r.json() : { list: [] })
      .then(data => {
        const lookup = new Map<string, string>()
        for (const m of data.list || []) {
          lookup.set(m.name, m.imageUrl)
          lookup.set(normalizeMapName(m.name), m.imageUrl)
        }
        setMapImageLookup(lookup)
      })
      .catch(() => {})
  }, [])

  useClickOutside([searchDropdownRef, searchInputRef], () => setSearchOpen(false), searchOpen)
  useClickOutside(modeDropdownRef, () => setModeOpen(false), modeOpen)

  useEffect(() => {
    fetch("/api/meta")
      .then(r => r.json())
      .then(data => {
        const raw: ModeInfo[] = data.modes || []
        const cleaned = raw
          .filter(m => m.mode.toLowerCase() !== "unknown")
          .map(m => ({ ...m, maps: m.maps.filter(map => map.name.toLowerCase() !== "unknown") }))
          .filter(m => m.maps.length > 0)
        setModes(cleaned)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!modes.length) return
    const modeParam = searchParams.get("mode")
    if (!modeParam) {
      setSelectedMode(null)
      return
    }
    const normalized = modeParam.toLowerCase()
    const match = modes.find(mode =>
      mode.mode.toLowerCase() === normalized
      || getModeName(mode.mode).toLowerCase() === normalized
    )
    if (match) setSelectedMode(match.mode)
  }, [modes, searchParams])

  const [autoOpenHandled, setAutoOpenHandled] = useState(false)
  useEffect(() => {
    const openName = searchParams.get("open")
    if (!openName || loading || autoOpenHandled) return
    setAutoOpenHandled(true)
    router.replace(mapHref(openName))
  }, [loading, searchParams, autoOpenHandled, router])

  const spotlightMap = useMemo(() => {
    let best: { name: string; mode: string; battles: number } | null = null
    for (const m of modes) {
      for (const map of m.maps) {
        if (!best || map.battles > best.battles) best = { name: map.name, mode: m.mode, battles: map.battles }
      }
    }
    return best
  }, [modes])

  const totalBattlesAnalyzed = useMemo(() => {
    return modes.reduce((total, mode) => total + mode.totalBattles, 0)
  }, [modes])

  const totalUniqueMapCount = useMemo(() => {
    const seen = new Set<string>()
    for (const mode of modes) {
      for (const map of mode.maps) seen.add(map.name)
    }
    return seen.size
  }, [modes])

  const allMapsList = useMemo(() => {
    const seen = new Set<string>()
    const list: { name: string; mode: string }[] = []
    for (const m of modes) {
      for (const map of m.maps) {
        if (!seen.has(map.name)) {
          seen.add(map.name)
          list.push({ name: map.name, mode: m.mode })
        }
      }
    }
    return list
  }, [modes])

  const searchMatches = useMemo(() => {
    const q = mapSearch.trim().toLowerCase()
    if (!q) return allMapsList
    return allMapsList.filter(m => m.name.toLowerCase().includes(q))
  }, [allMapsList, mapSearch])

  useEffect(() => {
    setSpotlightTopBrawler(null)
    setSpotlightBrawlerLoaded(false)
    fetch("/api/brawlers/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const stats = Object.values(d?.stats ?? {}) as CatalogBrawlerStat[]
        const top = stats
          .filter(brawler => brawler.winRate != null && brawler.picks > 0)
          .sort((a, b) => (b.winRate ?? -1) - (a.winRate ?? -1))[0]
        if (top && top.winRate != null) setSpotlightTopBrawler({ id: top.id, name: top.name, picks: top.picks, winRate: top.winRate })
      })
      .catch(() => {})
      .finally(() => setSpotlightBrawlerLoaded(true))
  }, [])

  function selectMode(mode: string | null) {
    setSelectedMode(mode)
    setModeOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    if (mode) params.set("mode", mode)
    else params.delete("mode")
    params.delete("open")
    const query = params.toString()
    router.replace(query ? `/meta?${query}` : "/meta", { scroll: false })
  }

  const analyzedLabel = totalBattlesAnalyzed > 0 ? formatFullNumber(totalBattlesAnalyzed) : loading ? "Loading..." : "-"

  return (
    <>
      <main className="bl-tier-shell">
        <div className="bl-tier-content">
          <section
            className="relative isolate mb-4 overflow-visible rounded-[10px] max-[560px]:mb-3"
            aria-labelledby="maps-title"
          >
            {introBorderReady && (
              <PulsingBorder
                aria-hidden="true"
                className="bl-tier-hero-border-shader"
                style={MAP_INTRO_BORDER_STYLE}
                colors={MAP_INTRO_BORDER_COLORS}
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

            <div className="relative z-[2] min-h-[132px] rounded-[10px] border-[2.5px] border-[#FF6B6B] bg-[#101015] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] max-[760px]:px-4 max-[760px]:py-4">
              <div className="mx-auto grid max-w-[1040px] justify-items-center text-center">
                <h1
                  id="maps-title"
                  className="m-0 text-[clamp(18px,2.52vw,29px)] font-[820] leading-[1.02] tracking-[0] text-[#f5f4f1] [font-family:var(--font-heading)]"
                >
                  Maps &amp; Modes Top 1000, S50
                </h1>

                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[clamp(11px,1.2vw,13px)] leading-none">
                  <span className="font-[720] uppercase tracking-[0.02em] text-[rgba(245,244,241,0.82)]">BATTLES ANALYZED</span>
                  <strong className="font-[900] text-[#f2de8a] [font-family:var(--font-number,var(--font-geist-mono),ui-monospace,monospace)]">
                    {analyzedLabel}
                  </strong>
                  <HelpTooltip label="How map stats are summarized">
                    Battle counts come from the tracked map dataset. Map pages are grouped by mode and ranked by
                    current battle volume so live rotation and high-sample layouts stay easy to scan.
                  </HelpTooltip>
                </div>

                <p className="m-0 mt-4 max-w-[960px] text-[clamp(11px,1.14vw,13px)] font-[560] leading-[1.42] text-[rgba(245,244,241,0.78)]">
                  The best brawlers for every Brawl Stars map, ranked by live battle data.
                  <span className="mt-2 block text-[rgba(245,244,241,0.78)]">
                    {totalUniqueMapCount ? `${formatFullNumber(totalUniqueMapCount)} maps · ${formatFullNumber(modes.length)} modes` : "Loading map coverage"}
                    <span aria-hidden="true"> · </span>
                    Popular: <strong className="font-semibold text-[#f5f4f1]">{spotlightMap ? `${spotlightMap.name} (${getModeName(spotlightMap.mode)})` : "Loading..."}</strong>
                    <span aria-hidden="true"> · </span>
                    Best brawler: <strong className="font-semibold text-[#f5f4f1]">{spotlightTopBrawler ? `${formatBrawlerName(spotlightTopBrawler.name)} ${spotlightTopBrawler.winRate.toFixed(1)}%` : spotlightBrawlerLoaded ? "Unavailable" : "Loading..."}</strong>
                  </span>
                </p>
              </div>
            </div>
          </section>

        <MetaDashboard
          modes={modes}
          loading={loading}
          selectedMode={selectedMode}
          mapSearch={mapSearch}
          onClearFilters={() => { setMapSearch(""); selectMode(null) }}
          filterControls={(
            <div className="bl-tier-selector-anchor">
              <div
                ref={modeDropdownRef}
                className="bl-tier-selector-wrap"
                onPointerEnter={event => {
                  if (event.pointerType !== "mouse") return
                  setModeOpen(true)
                  setSearchOpen(false)
                }}
                onPointerLeave={event => {
                  if (event.pointerType === "mouse") setModeOpen(false)
                }}
                onFocus={() => {
                  setModeOpen(true)
                  setSearchOpen(false)
                }}
                onBlur={event => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setModeOpen(false)
                }}
              >
                <button
                  type="button"
                  className="bl-tier-selector"
                  aria-haspopup="listbox"
                  aria-expanded={modeOpen}
                  onClick={() => {
                    setModeOpen(open => !open)
                    setSearchOpen(false)
                  }}
                >
                  <span>{selectedMode ? getModeName(selectedMode) : "All modes"}</span>
                  <ChevronDown size={14} className={modeOpen ? "rotate-180" : ""} />
                </button>
                <div className={`bl-tier-menu bl-tier-menu-list ${modeOpen ? "is-open" : ""}`} role="listbox">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedMode === null}
                    className={`bl-tier-menu-card bl-tier-menu-card-all ${selectedMode === null ? "is-active" : ""}`}
                    onClick={() => selectMode(null)}
                  >
                    All modes
                  </button>
                  {modes.map(mode => {
                    const active = selectedMode === mode.mode
                    return (
                      <button
                        type="button"
                        key={mode.mode}
                        role="option"
                        aria-selected={active}
                        className={`bl-tier-menu-card ${active ? "is-active" : ""}`}
                        onClick={() => selectMode(mode.mode)}
                      >
                        {getModeName(mode.mode)}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          searchControl={(
            <div className="bl-tier-search-anchor">
              <div className="bl-tier-search">
                <div className="bl-tier-search-bar">
                  <Search size={15} />
                  <input
                    ref={searchInputRef}
                    value={mapSearch}
                    onChange={e => {
                      setMapSearch(e.target.value)
                      setSearchOpen(e.target.value.trim().length > 0)
                      setModeOpen(false)
                    }}
                    onFocus={() => {
                      setSearchOpen(mapSearch.trim().length > 0)
                      setModeOpen(false)
                    }}
                    aria-label="Search maps"
                    autoComplete="off"
                    placeholder="Search maps..."
                  />
                </div>

                {searchOpen && mapSearch.trim().length > 0 && searchMatches.length > 0 && (
                  <div ref={searchDropdownRef} className="bl-tier-search-menu">
                    {searchMatches.slice(0, 12).map(m => {
                      const imageUrl = mapImageLookup.get(m.name) ?? mapImageLookup.get(normalizeMapName(m.name))
                      return (
                        <Link
                          key={m.name}
                          href={mapHref(m.name)}
                          onClick={() => {
                            setMapSearch("")
                            setSearchOpen(false)
                          }}
                        >
                          {imageUrl && (
                            <BrawlImage src={imageUrl} alt={m.name} width={28} height={28} className="size-7 object-cover" sizes="28px" />
                          )}
                          <span>
                            <strong>{m.name}</strong>
                            <small>{getModeName(m.mode)}</small>
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        />
      </div>
      </main>
    </>
  )
}
