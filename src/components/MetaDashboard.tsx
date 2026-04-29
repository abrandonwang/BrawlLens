"use client";

import { useState, useEffect, useMemo } from "react";

interface MapInfo {
  name: string;
  battles: number;
}

interface ModeInfo {
  mode: string;
  totalBattles: number;
  maps: MapInfo[];
}

interface SelectedMapInfo {
  name: string;
  imageUrl?: string;
  mode: string | null;
  isLive: boolean;
}

interface Props {
  modes: ModeInfo[];
  loading: boolean;
  selectedMode: string | null;
  mapSearch: string;
  onSelect: (map: SelectedMapInfo) => void;
}

type MapOrientation = "portrait" | "landscape";

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

function normalizeMapName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

const WIDE_MODE_HINTS = new Set(["knockout", "bounty", "siege"]);
const WIDE_MAP_NAME_HINTS = [
  "arena",
  "beach",
  "belle",
  "canyon",
  "crescendo",
  "dream",
  "excel",
  "flow",
  "hideout",
  "lane",
  "mirage",
  "out",
  "pass",
  "prairie",
  "shooting",
  "slayers",
  "snake",
  "split",
  "star",
  "temple",
  "yard",
];

function isWideMap(name: string, mode: string | null) {
  const normalized = normalizeMapName(name);
  return Boolean(
    mode && WIDE_MODE_HINTS.has(mode) ||
    WIDE_MAP_NAME_HINTS.some(hint => normalized.includes(hint))
  );
}

function MapPreview({ imageUrl, name, mode, modeColor }: { imageUrl?: string; name: string; mode: string | null; modeColor?: string }) {
  const [orientation, setOrientation] = useState<MapOrientation>(isWideMap(name, mode) ? "landscape" : "portrait");
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center gap-2.5 bg-[radial-gradient(circle_at_50%_50%,color-mix(in_srgb,var(--line-2)_55%,transparent),transparent_68%),var(--panel-2)] p-[18px] text-center text-[var(--ink-4)]">
        <div className="size-10 rounded-lg opacity-30" style={{ background: modeColor || "var(--line)" }} />
        <span className="max-w-full truncate text-[11px] font-semibold">{name}</span>
      </div>
    );
  }

  return (
    <div className={`grid w-full place-items-center bg-[radial-gradient(circle_at_50%_50%,color-mix(in_srgb,var(--line-2)_55%,transparent),transparent_68%),var(--panel-2)] ${orientation === "landscape" ? "aspect-[2.25/1]" : "aspect-[3/4]"}`}>
      <img
        src={imageUrl}
        alt={name}
        className={`block size-full transition-[transform,filter] duration-200 ${orientation === "landscape" ? "object-cover" : "object-contain"}`}
        loading="lazy"
        onLoad={(event) => {
          const img = event.currentTarget;
          if (img.naturalWidth > img.naturalHeight) setOrientation("landscape");
        }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function MetaDashboard({ modes, loading, selectedMode, mapSearch, onSelect }: Props) {
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
        lookup.set(normalizeMapName(map.name), map.imageUrl);
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
  const liveCount = displayedMaps.filter(map => rotationMapNames.has(map.name)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-5 animate-spin rounded-full border-2 border-[var(--line-2)] border-t-[var(--accent)]" />
      </div>
    );
  }

  if (modes.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="mb-2 text-[15px] font-semibold leading-snug text-[var(--ink-2)]">No battle data yet</p>
        <p className="text-[13.5px] leading-relaxed text-[var(--ink-4)]">The collector is still running. Check back soon.</p>
      </div>
    );
  }

  if (displayedMaps.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-5 py-[42px] text-center shadow-[var(--shadow-lift)]">
        <p className="mb-1.5 text-[15px] font-semibold leading-snug text-[var(--ink)]">No maps found</p>
        <p className="m-0 text-[13.5px] leading-relaxed text-[var(--ink-3)]">Try a different search or switch back to all modes.</p>
      </div>
    );
  }

  return (
    <div className="relative pt-1">
      <div className="mb-3.5 flex items-end justify-between gap-2.5 rounded-lg bg-[color-mix(in_srgb,var(--panel)_72%,transparent)] px-3.5 py-3">
        <div className="min-w-0">
          <div className="mb-1 text-[10px] font-bold tracking-[0.08em] text-[var(--ink-4)] uppercase">{selectedMode === null ? "All Maps" : MODE_CONFIG[selectedMode]?.label ?? selectedMode}</div>
          <div className="truncate text-[17px] leading-tight font-bold text-[var(--ink)]">
            {displayedMaps.length.toLocaleString()} {displayedMaps.length === 1 ? "map" : "maps"}
          </div>
        </div>
        <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5">
          <span className="inline-flex min-h-[26px] items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] px-2.5 text-[10.5px] font-semibold text-[var(--ink-3)] max-[420px]:px-2 max-[420px]:text-[10px]">{liveCount.toLocaleString()} live</span>
          <span className="inline-flex min-h-[26px] items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] px-2.5 text-[10.5px] font-semibold text-[var(--ink-3)] max-[420px]:px-2 max-[420px]:text-[10px]">Page {mapPage + 1} of {mapTotalPages}</span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] items-center gap-3.5 max-[520px]:grid-cols-2 max-[520px]:gap-2.5">
        {paginatedMaps.map(map => {
          const imageUrl = mapImageLookup.get(map.name) ?? mapImageLookup.get(normalizeMapName(map.name));
          const isLive = rotationMapNames.has(map.name);
          const mode = getModeForMap(modes, map.name);
          const modeColor = mode ? MODE_CONFIG[mode]?.color : undefined;

          return (
            <button
              key={map.name}
              onClick={() => onSelect({ name: map.name, imageUrl, mode, isLive })}
              className="group relative block w-full cursor-pointer overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)] p-0 text-left shadow-[var(--shadow-lift)] transition-[transform,border-color,box-shadow,background] duration-200 hover:-translate-y-0.5 hover:border-[var(--line-2)] hover:bg-[color-mix(in_srgb,var(--panel)_70%,var(--hover-bg))] hover:shadow-[0_22px_42px_-30px_rgba(0,0,0,0.75)] active:-translate-y-px"
            >
              <div className="relative overflow-hidden rounded-t-lg bg-[radial-gradient(circle_at_50%_46%,color-mix(in_srgb,var(--line-2)_42%,transparent),transparent_70%),var(--panel-2)]">
                <MapPreview imageUrl={imageUrl} name={map.name} mode={mode} modeColor={modeColor} />
                {modeColor && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${modeColor}, transparent)`, opacity: 0.6 }} />
                )}
              </div>

              <div className="border-t border-[var(--line)] px-3 pt-2.5 pb-3">
                <div className={`mb-1 truncate text-[12.5px] font-semibold ${isLive ? "text-[#49D47E]" : "text-[var(--ink)]"}`}>
                  {map.name}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] leading-snug tracking-[0.01em] text-[var(--ink-3)]">{map.battles.toLocaleString()} battles</span>
                  {mode && modeColor && (
                    <span className="text-[9.5px] font-semibold tracking-[0.04em] uppercase opacity-85" style={{ color: modeColor }}>
                      {MODE_CONFIG[mode]?.label || mode}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {mapTotalPages > 1 && (
        <div className="mt-0.5 flex items-center justify-center gap-1">
          <button
            onClick={() => setMapPage(p => p - 1)}
            disabled={mapPage === 0}
            className="grid size-[30px] cursor-pointer place-items-center rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_72%,transparent)] text-[12px] font-semibold text-[var(--ink-3)] transition hover:-translate-y-px hover:border-[var(--line-2)] hover:bg-[var(--hover-bg)] hover:text-[var(--ink)] disabled:cursor-default disabled:opacity-30 disabled:hover:translate-y-0"
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
                <span key={`e-${i}`} className="grid size-[30px] place-items-center rounded-lg text-[12px] font-semibold text-[var(--ink-4)]">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setMapPage(p as number)}
                  className={`grid size-[30px] cursor-pointer place-items-center rounded-lg text-[12px] font-semibold transition ${p === mapPage ? "border border-transparent bg-[var(--accent)] text-[#0A0A0B]" : "border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_72%,transparent)] text-[var(--ink-3)] hover:-translate-y-px hover:border-[var(--line-2)] hover:bg-[var(--hover-bg)] hover:text-[var(--ink)]"}`}
                >
                  {(p as number) + 1}
                </button>
              )
            );
          })()}

          <button
            onClick={() => setMapPage(p => p + 1)}
            disabled={mapPage === mapTotalPages - 1}
            className="grid size-[30px] cursor-pointer place-items-center rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_72%,transparent)] text-[12px] font-semibold text-[var(--ink-3)] transition hover:-translate-y-px hover:border-[var(--line-2)] hover:bg-[var(--hover-bg)] hover:text-[var(--ink)] disabled:cursor-default disabled:opacity-30 disabled:hover:translate-y-0"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
