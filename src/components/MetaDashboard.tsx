"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface MapInfo {
  name: string;
  battles: number;
}

interface ModeInfo {
  mode: string;
  totalBattles: number;
  maps: MapInfo[];
}

interface Props {
  modes: ModeInfo[];
  loading: boolean;
  selectedMode: string | null;
  mapSearch: string;
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

function getModeColor(mode: string): string {
  return MODE_CONFIG[mode]?.color || "#ffffff";
}

export default function MetaDashboard({ modes, loading, selectedMode, mapSearch }: Props) {
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
        <p className="text-zinc-500 text-lg font-medium dark:text-white/60">No battle data yet</p>
        <p className="text-zinc-400 text-sm mt-2 dark:text-white/60">The collector is still running. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {paginatedMaps.map((map) => {
          const imageUrl = mapImageLookup.get(map.name);
          const isLive = rotationMapNames.has(map.name);
          return (
            <Link
              key={map.name}
              href={`/meta/${encodeURIComponent(map.name)}`}
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
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 border border-green-500/40">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-[9px] font-bold uppercase tracking-wider">Live</span>
                  </div>
                )}
              </div>
              <div className="px-2 py-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                <h3 className="text-zinc-900 dark:text-white font-bold text-xs truncate leading-tight">{map.name}</h3>
                <p className="text-zinc-400 dark:text-white/60 text-[10px] mt-0.5">{map.battles.toLocaleString()} battles</p>
              </div>
            </Link>
          );
        })}
      </div>

      {mapTotalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          <button
            onClick={() => setMapPage(p => p - 1)}
            disabled={mapPage === 0}
            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5"
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
                      : "text-zinc-400 hover:text-zinc-900 hover:bg-black/5 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5"
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
            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
