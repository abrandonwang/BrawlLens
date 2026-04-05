"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

interface MapInfo {
  name: string;
  battles: number;
}

interface ModeInfo {
  mode: string;
  totalBattles: number;
  maps: MapInfo[];
}

interface BrawlerStat {
  brawlerId: number;
  name: string;
  picks: number;
  wins: number;
  winRate: number;
}

interface MapMeta {
  map: string;
  totalBattles: number;
  brawlers: BrawlerStat[];
}

const MODE_CONFIG: Record<string, { label: string; color: string }> = {
  brawlBall: { label: "Brawl Ball", color: "#8CA0EB" },
  gemGrab: { label: "Gem Grab", color: "#9B59B6" },
  knockout: { label: "Knockout", color: "#F9C74F" },
  bounty: { label: "Bounty", color: "#2ECC71" },
  heist: { label: "Heist", color: "#E74C3C" },
  hotZone: { label: "Hot Zone", color: "#E67E22" },
  wipeout: { label: "Wipeout", color: "#1ABC9C" },
  duels: { label: "Duels", color: "#E84393" },
  siege: { label: "Siege", color: "#636E72" },
  soloShowdown: { label: "Showdown", color: "#2ECC71" },
  duoShowdown: { label: "Duo SD", color: "#00B894" },
  trioShowdown: { label: "Trio SD", color: "#55E6C1" },
  payload: { label: "Payload", color: "#6C5CE7" },
  basketBrawl: { label: "Basket Brawl", color: "#E17055" },
  volleyBrawl: { label: "Volley Brawl", color: "#FDCB6E" },
  botDrop: { label: "Bot Drop", color: "#636E72" },
  hunters: { label: "Hunters", color: "#D63031" },
  trophyEscape: { label: "Trophy Escape", color: "#00CEC9" },
  paintBrawl: { label: "Paint Brawl", color: "#A29BFE" },
  wipeout5V5: { label: "5v5 Wipeout", color: "#1ABC9C" },
};

function getModeName(mode: string): string {
  return MODE_CONFIG[mode]?.label || mode.charAt(0).toUpperCase() + mode.slice(1).replace(/([A-Z])/g, " $1");
}

function getModeColor(mode: string): string {
  return MODE_CONFIG[mode]?.color || "#ffffff";
}

function getTierInfo(winRate: number) {
  if (winRate >= 58) return { label: "S", color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" };
  if (winRate >= 54) return { label: "A", color: "#FB923C", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" };
  if (winRate >= 50) return { label: "B", color: "#FACC15", bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.2)" };
  if (winRate >= 46) return { label: "C", color: "#60A5FA", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)" };
  return { label: "D", color: "#71717A", bg: "rgba(113,113,122,0.08)", border: "rgba(113,113,122,0.2)" };
}

function getBarWidth(winRate: number): number {
  return Math.max(0, Math.min(100, ((winRate - 30) / 40) * 100));
}

function getBrawlerImage(brawlerId: number): string {
  return `https://cdn.brawlify.com/brawlers/borderless/${brawlerId}.png`;
}

function formatBrawlerName(name: string): string {
  return name.split(" ").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

interface Props {
  modes: ModeInfo[];
  loading: boolean;
  selectedMode: string | null;
  mapSearch: string;
}

export default function MetaDashboard({ modes, loading, selectedMode, mapSearch }: Props) {
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [mapMeta, setMapMeta] = useState<MapMeta | null>(null);
  const [loadingMap, setLoadingMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [minPicks, setMinPicks] = useState(10);
  const [mapImageLookup, setMapImageLookup] = useState<Map<string, string>>(new Map());
  const [rotationMapNames, setRotationMapNames] = useState<Set<string>>(new Set());
  const [mapPage, setMapPage] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/rotation").then((r) => r.json()).catch(() => []),
      fetch("https://api.brawlify.com/v1/maps").then((r) => r.json()).catch(() => ({ list: [] })),
    ]).then(([rotationData, mapsData]) => {
      const activeNames = new Set<string>();
      for (const slot of rotationData || []) {
        if (slot.event?.map) activeNames.add(slot.event.map);
      }
      setRotationMapNames(activeNames);

      const lookup = new Map<string, string>();
      for (const map of mapsData.list || []) {
        lookup.set(map.name, map.imageUrl);
      }
      setMapImageLookup(lookup);
    });
  }, []);

  const allUniqueMaps = useMemo(() => {
    const seen = new Set<string>();
    const maps: MapInfo[] = [];
    modes.forEach((m) => m.maps.forEach((map) => {
      if (!seen.has(map.name)) { seen.add(map.name); maps.push(map); }
    }));
    return maps;
  }, [modes]);

  const sortedMaps = useMemo(() => {
    const base = selectedMode === null
      ? allUniqueMaps
      : (modes.find((m) => m.mode === selectedMode)?.maps ?? []);

    return [...base].sort((a, b) => {
      const aLive = rotationMapNames.has(a.name) ? 1 : 0;
      const bLive = rotationMapNames.has(b.name) ? 1 : 0;
      if (bLive !== aLive) return bLive - aLive;
      return b.battles - a.battles;
    });
  }, [modes, selectedMode, rotationMapNames, allUniqueMaps]);

  const displayedMaps = useMemo(() => {
    if (!mapSearch) return sortedMaps;
    return sortedMaps.filter((m) => m.name.toLowerCase().includes(mapSearch.toLowerCase()));
  }, [sortedMaps, mapSearch]);

  useEffect(() => { setMapPage(0); }, [displayedMaps]);

  const MAP_PAGE_SIZE = 8;
  const mapTotalPages = Math.ceil(displayedMaps.length / MAP_PAGE_SIZE);
  const paginatedMaps = displayedMaps.slice(mapPage * MAP_PAGE_SIZE, (mapPage + 1) * MAP_PAGE_SIZE);

  const handleMapClick = useCallback((mapName: string) => {
    setSelectedMap(mapName);
    setMapMeta(null);
    setLoadingMap(true);
    setSearchQuery("");

    fetch(`/api/meta?map=${encodeURIComponent(mapName)}`)
      .then((r) => r.json())
      .then((data) => { setMapMeta(data); setLoadingMap(false); })
      .catch(() => setLoadingMap(false));
  }, []);

  const filteredBrawlers = useMemo(() => {
    if (!mapMeta) return [];
    return mapMeta.brawlers.filter((b) => {
      if (b.picks < minPicks) return false;
      if (searchQuery && !formatBrawlerName(b.name).toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [mapMeta, searchQuery, minPicks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-5 h-5 border-2 border-black/20 border-t-zinc-900 rounded-full animate-spin dark:border-white/20 dark:border-t-white" />
      </div>
    );
  }

  if (modes.length === 0) {
    return (
      <div className="text-center py-32">
        <p className="text-zinc-500 text-lg font-medium dark:text-white/40">No battle data yet</p>
        <p className="text-zinc-400 text-sm mt-2 dark:text-white/20">The collector is still running. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Map Grid */}
      {!selectedMap && (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {paginatedMaps.map((map) => {
            const imageUrl = mapImageLookup.get(map.name);
            const isLive = rotationMapNames.has(map.name);
            return (
              <button
                key={map.name}
                onClick={() => handleMapClick(map.name)}
                className="group relative text-left transition-all duration-200 hover:opacity-90"
              >
                <div className="relative bg-black/[0.03] border border-black/[0.06] overflow-hidden dark:bg-white/[0.03] dark:border-white/[0.06]">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={map.name}
                      className="w-full h-auto object-contain group-hover:opacity-90 transition-opacity duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="aspect-[3/4] w-full flex items-center justify-center">
                      <div className="w-12 h-12 opacity-20" style={{ backgroundColor: getModeColor(selectedMode || "") }} />
                    </div>
                  )}

                  {isLive && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 border border-green-500/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 text-[9px] font-bold uppercase tracking-wider">Live</span>
                    </div>
                  )}
                </div>
                <div className="px-2 py-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                  <h3 className="text-zinc-900 dark:text-white font-bold text-xs truncate leading-tight">{map.name}</h3>
                  <p className="text-zinc-400 dark:text-white/40 text-[10px] mt-0.5">{map.battles.toLocaleString()} battles</p>
                </div>
              </button>
            );
          })}
        </div>

        {mapTotalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-4">
            <button
              onClick={() => setMapPage(p => p - 1)}
              disabled={mapPage === 0}
              className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded dark:text-white/40 dark:hover:text-white dark:hover:bg-white/5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            {(() => {
              const pages: (number | "...")[] = [];
              for (let i = 0; i < mapTotalPages; i++) {
                if (i === 0 || i === mapTotalPages - 1 || (i >= mapPage - 1 && i <= mapPage + 1)) {
                  pages.push(i);
                } else if (pages[pages.length - 1] !== "...") {
                  pages.push("...");
                }
              }
              return pages.map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-zinc-400 dark:text-white/30">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setMapPage(p)}
                    className={`w-7 h-7 text-xs font-semibold rounded transition-colors ${
                      p === mapPage
                        ? "bg-red-500 text-white dark:bg-[#FFD400] dark:text-black"
                        : "text-zinc-400 hover:text-zinc-900 hover:bg-black/5 dark:text-white/40 dark:hover:text-white dark:hover:bg-white/5"
                    }`}
                  >
                    {p + 1}
                  </button>
                )
              );
            })()}
            <button
              onClick={() => setMapPage(p => p + 1)}
              disabled={mapPage === mapTotalPages - 1}
              className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded dark:text-white/40 dark:hover:text-white dark:hover:bg-white/5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        )}
        </>
      )}

      {/* Map Detail */}
      {selectedMap && (
        <div>
          <div className="flex items-start gap-4 mb-6">
            {mapImageLookup.get(selectedMap) && (
              <div className="w-20 overflow-hidden shrink-0 border border-black/10 dark:border-white/10">
                <img src={mapImageLookup.get(selectedMap)!} alt={selectedMap} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <button
                onClick={() => { setSelectedMap(null); setMapMeta(null); }}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 dark:text-white/30 dark:hover:text-white/60 transition-colors text-xs font-bold uppercase tracking-wider mb-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
                </svg>
                {selectedMode ? getModeName(selectedMode) : "All Maps"}
              </button>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">{selectedMap}</h2>
              {mapMeta && (
                <p className="text-zinc-400 dark:text-white/40 text-sm mt-1">{mapMeta.totalBattles.toLocaleString()} battles sampled</p>
              )}
            </div>
          </div>

          {loadingMap && (
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 border-2 border-black/20 border-t-zinc-900 rounded-full animate-spin dark:border-white/20 dark:border-t-white" />
            </div>
          )}

          {mapMeta && !loadingMap && (
            <div>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-white/20">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.34-4.34" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search brawler..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/[0.04] border border-black/[0.08] dark:bg-white/[0.04] dark:border-white/[0.08] pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/20 focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-white/50">
                  <span className="whitespace-nowrap font-medium">Min picks:</span>
                  <select
                    value={minPicks}
                    onChange={(e) => setMinPicks(Number(e.target.value))}
                    className="bg-black/[0.04] border border-black/[0.08] dark:bg-white/[0.04] dark:border-white/[0.08] px-2.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors"
                  >
                    <option value={5}>5+</option>
                    <option value={10}>10+</option>
                    <option value={25}>25+</option>
                    <option value={50}>50+</option>
                    <option value={100}>100+</option>
                  </select>
                </div>
              </div>

              <p className="text-zinc-400 dark:text-white/30 text-xs mb-4">{filteredBrawlers.length} brawlers</p>

              {filteredBrawlers.length === 0 ? (
                <p className="text-zinc-400 dark:text-white/30 text-center py-16">No brawlers match your filters.</p>
              ) : (
                <div className="space-y-1">
                  <div className="grid grid-cols-[44px_1fr_100px_70px_36px] sm:grid-cols-[44px_1fr_120px_80px_80px_36px] gap-3 px-3 py-2 text-[10px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">
                    <span></span>
                    <span>Brawler</span>
                    <span>Win Rate</span>
                    <span className="text-right hidden sm:block">Wins</span>
                    <span className="text-right">Picks</span>
                    <span></span>
                  </div>

                  {filteredBrawlers.map((brawler) => {
                    const tier = getTierInfo(brawler.winRate);
                    return (
                      <div
                        key={brawler.brawlerId}
                        className="grid grid-cols-[44px_1fr_100px_70px_36px] sm:grid-cols-[44px_1fr_120px_80px_80px_36px] gap-3 items-center px-3 py-2.5 bg-black/[0.02] hover:bg-black/[0.04] dark:bg-white/[0.02] dark:hover:bg-white/[0.04] transition-all duration-150"
                      >
                        <div className="w-9 h-9 bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden flex items-center justify-center">
                          <img src={getBrawlerImage(brawler.brawlerId)} alt={brawler.name} width={32} height={32} className="object-contain" loading="lazy" />
                        </div>
                        <span className="text-zinc-900 dark:text-white font-semibold text-sm truncate">{formatBrawlerName(brawler.name)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: tier.color }}>{brawler.winRate.toFixed(1)}%</span>
                          <div className="flex-1 h-1 bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden hidden sm:block">
                            <div className="h-full transition-all duration-500" style={{ width: `${getBarWidth(brawler.winRate)}%`, backgroundColor: tier.color, opacity: 0.5 }} />
                          </div>
                        </div>
                        <span className="text-right text-zinc-400 dark:text-white/40 text-sm tabular-nums hidden sm:block">{brawler.wins.toLocaleString()}</span>
                        <span className="text-right text-zinc-400 dark:text-white/40 text-sm tabular-nums">{brawler.picks.toLocaleString()}</span>
                        <div className="flex justify-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 text-[10px] font-black" style={{ color: tier.color, backgroundColor: tier.bg, borderWidth: 1, borderColor: tier.border }}>{tier.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
