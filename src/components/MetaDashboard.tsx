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
  brawlBall:    { label: "Brawl Ball",    color: "#8CA0EB" },
  gemGrab:      { label: "Gem Grab",      color: "#9B59B6" },
  knockout:     { label: "Knockout",      color: "#F9C74F" },
  bounty:       { label: "Bounty",        color: "#2ECC71" },
  heist:        { label: "Heist",         color: "#E74C3C" },
  hotZone:      { label: "Hot Zone",      color: "#E67E22" },
  wipeout:      { label: "Wipeout",       color: "#1ABC9C" },
  duels:        { label: "Duels",         color: "#E84393" },
  siege:        { label: "Siege",         color: "#636E72" },
  soloShowdown: { label: "Showdown",      color: "#2ECC71" },
  duoShowdown:  { label: "Duo SD",        color: "#00B894" },
  trioShowdown: { label: "Trio SD",       color: "#55E6C1" },
  payload:      { label: "Payload",       color: "#6C5CE7" },
  basketBrawl:  { label: "Basket Brawl", color: "#E17055" },
  volleyBrawl:  { label: "Volley Brawl", color: "#FDCB6E" },
  botDrop:      { label: "Bot Drop",      color: "#636E72" },
  hunters:      { label: "Hunters",       color: "#D63031" },
  trophyEscape: { label: "Trophy Escape", color: "#00CEC9" },
  paintBrawl:   { label: "Paint Brawl",   color: "#A29BFE" },
  wipeout5V5:   { label: "5v5 Wipeout",   color: "#1ABC9C" },
};

function getModeForMap(modes: ModeInfo[], mapName: string): string | null {
  for (const m of modes) {
    if (m.maps.some(map => map.name === mapName)) return m.mode;
  }
  return null;
}

export default function MetaDashboard({ modes, loading, selectedMode, mapSearch }: Props) {
  const [mapImageLookup, setMapImageLookup] = useState<Map<string, string>>(new Map());
  const [rotationMapNames, setRotationMapNames] = useState<Set<string>>(new Set());
  const [mapPage, setMapPage] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/rotation").then(r => r.json()).catch(() => []),
      fetch("https://api.brawlify.com/v1/maps").then(r => r.json()).catch(() => ({ list: [] })),
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
    modes.forEach(m => m.maps.forEach(map => {
      if (!seen.has(map.name)) { seen.add(map.name); maps.push(map); }
    }));
    return maps;
  }, [modes]);

  const sortedMaps = useMemo(() => {
    const base = selectedMode === null
      ? allUniqueMaps
      : (modes.find(m => m.mode === selectedMode)?.maps ?? []);

    return [...base].sort((a, b) => {
      const aLive = rotationMapNames.has(a.name) ? 1 : 0;
      const bLive = rotationMapNames.has(b.name) ? 1 : 0;
      if (bLive !== aLive) return bLive - aLive;
      return b.battles - a.battles;
    });
  }, [modes, selectedMode, rotationMapNames, allUniqueMaps]);

  const displayedMaps = useMemo(() => {
    if (!mapSearch) return sortedMaps;
    return sortedMaps.filter(m => m.name.toLowerCase().includes(mapSearch.toLowerCase()));
  }, [sortedMaps, mapSearch]);

  useEffect(() => { setMapPage(0); }, [displayedMaps]);

  const MAP_PAGE_SIZE = 12;
  const mapTotalPages = Math.ceil(displayedMaps.length / MAP_PAGE_SIZE);
  const paginatedMaps = displayedMaps.slice(mapPage * MAP_PAGE_SIZE, (mapPage + 1) * MAP_PAGE_SIZE);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
        <div style={{ width: 20, height: 20, border: "2px solid var(--line-2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (modes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p className="bl-h3" style={{ color: "var(--ink-2)", marginBottom: 8 }}>No battle data yet</p>
        <p className="bl-body" style={{ color: "var(--ink-4)" }}>The collector is still running. Check back soon.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        {paginatedMaps.map(map => {
          const imageUrl = mapImageLookup.get(map.name);
          const isLive = rotationMapNames.has(map.name);
          const mode = getModeForMap(modes, map.name);
          const modeColor = mode ? MODE_CONFIG[mode]?.color : undefined;

          return (
            <Link
              key={map.name}
              href={`/meta/${encodeURIComponent(map.name)}`}
              className="bl-card"
              style={{ textDecoration: "none", padding: 0, display: "block" }}
            >
              <div style={{ position: "relative", background: "var(--panel-2)", borderRadius: "var(--r-lg) var(--r-lg) 0 0", overflow: "hidden" }}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={map.name}
                    style={{ width: "100%", height: "auto", display: "block" }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{ aspectRatio: "3/4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: modeColor || "var(--line)", opacity: 0.3 }} />
                  </div>
                )}


                {modeColor && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${modeColor}, transparent)`, opacity: 0.6 }} />
                )}
              </div>

              <div style={{ padding: "10px 12px 12px", borderTop: "1px solid var(--line)" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: isLive ? "#49D47E" : "var(--ink)", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>
                  {map.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="bl-caption">{map.battles.toLocaleString()} battles</span>
                  {mode && modeColor && (
                    <span style={{ fontSize: 9.5, fontWeight: 600, color: modeColor, opacity: 0.85, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      {MODE_CONFIG[mode]?.label || mode}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {mapTotalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 8 }}>
          <button
            onClick={() => setMapPage(p => p - 1)}
            disabled={mapPage === 0}
            style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: mapPage === 0 ? "default" : "pointer", opacity: mapPage === 0 ? 0.3 : 1, color: "var(--ink-3)", transition: "all 0.14s" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
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
                <span key={`e-${i}`} style={{ width: 30, height: 30, display: "grid", placeItems: "center", fontSize: 12, color: "var(--ink-4)" }}>…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setMapPage(p as number)}
                  style={{
                    width: 30, height: 30, fontSize: 12, fontWeight: 600,
                    borderRadius: 8,
                    border: p === mapPage ? "none" : "1px solid var(--line)",
                    background: p === mapPage ? "var(--accent)" : "transparent",
                    color: p === mapPage ? "#0A0A0B" : "var(--ink-3)",
                    cursor: "pointer",
                    transition: "all 0.14s",
                    fontFamily: "inherit",
                  }}
                >
                  {(p as number) + 1}
                </button>
              )
            );
          })()}

          <button
            onClick={() => setMapPage(p => p + 1)}
            disabled={mapPage === mapTotalPages - 1}
            style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: mapPage === mapTotalPages - 1 ? "default" : "pointer", opacity: mapPage === mapTotalPages - 1 ? 0.3 : 1, color: "var(--ink-3)", transition: "all 0.14s" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
