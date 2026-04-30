"use client";

import { useState, useEffect, useMemo } from "react";
import { BrawlImage } from "@/components/BrawlImage";
import { EmptyState, MapGridSkeleton, StateButton } from "@/components/PolishStates";
import { MODE_CONFIG } from "@/lib/modes";
import { normalizeMapName } from "@/lib/format";

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
  onClearFilters?: () => void;
}

function getModeForMap(modes: ModeInfo[], mapName: string): string | null {
  for (const m of modes) {
    if (m.maps.some(map => map.name === mapName)) return m.mode;
  }
  return null;
}

function MapPreview({ imageUrl, name, modeColor }: { imageUrl?: string; name: string; mode: string | null; modeColor?: string }) {
  const [failed, setFailed] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>("1 / 1");

  if (!imageUrl || failed) {
    return (
      <div className="map-preview-frame relative grid aspect-square w-full place-items-center gap-2.5 p-[18px] text-center text-[var(--ink-4)]">
        <div className="size-10 rounded-lg opacity-30" style={{ background: modeColor || "var(--line)" }} />
        <span className="max-w-full truncate text-[11px] font-semibold">{name}</span>
      </div>
    );
  }

  return (
    <div
      className="map-preview-frame relative grid w-full place-items-center"
      style={{ aspectRatio }}
    >
      <BrawlImage
        src={imageUrl}
        alt={name}
        fill
        sizes="(max-width: 520px) 50vw, 220px"
        className="block object-contain transition-[transform,filter] duration-200"
        loading="lazy"
        onLoad={(event) => {
          const img = event.currentTarget;
          if (img.naturalWidth && img.naturalHeight) {
            setAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
          }
        }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function MetaDashboard({ modes, loading, selectedMode, mapSearch, onSelect, onClearFilters }: Props) {
  const [mapImageLookup, setMapImageLookup] = useState<Map<string, string>>(new Map());
  const [rotationMapNames, setRotationMapNames] = useState<Set<string>>(new Set());
  const [mapPage, setMapPage] = useState(0);
  const [liveOnly, setLiveOnly] = useState(false);

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
    let list = sortedMaps;
    if (mapSearch) list = list.filter(m => m.name.toLowerCase().includes(mapSearch.toLowerCase()));
    if (liveOnly) list = list.filter(m => rotationMapNames.has(m.name));
    return list;
  }, [sortedMaps, mapSearch, liveOnly, rotationMapNames]);

  useEffect(() => { setMapPage(0); }, [displayedMaps]);

  const MAP_PAGE_SIZE = 12;
  const mapTotalPages = Math.ceil(displayedMaps.length / MAP_PAGE_SIZE);
  const paginatedMaps = displayedMaps.slice(mapPage * MAP_PAGE_SIZE, (mapPage + 1) * MAP_PAGE_SIZE);
  const liveCountAll = sortedMaps.filter(map => rotationMapNames.has(map.name)).length;
  const liveCount = displayedMaps.filter(map => rotationMapNames.has(map.name)).length;

  if (loading) {
    return <MapGridSkeleton />;
  }

  if (modes.length === 0) {
    return (
      <EmptyState
        title="No battle data yet"
        description="The collector has not returned map stats for this view. Try refreshing in a moment."
        action={<StateButton onClick={() => window.location.reload()}>Retry</StateButton>}
      />
    );
  }

  if (displayedMaps.length === 0) {
    return (
      <EmptyState
        title="No maps found"
        description="Your search or selected mode filtered everything out."
        action={onClearFilters ? <StateButton onClick={onClearFilters}>Show all maps</StateButton> : undefined}
      />
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
          <button
            type="button"
            onClick={() => setLiveOnly(v => !v)}
            disabled={!liveOnly && liveCountAll === 0}
            aria-pressed={liveOnly}
            className={`inline-flex min-h-[26px] cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[10.5px] font-semibold transition-colors max-[420px]:px-2 max-[420px]:text-[10px] disabled:cursor-default disabled:opacity-40 ${liveOnly ? "border-[#49D47E66] bg-[rgba(73,212,126,0.12)] text-[#49D47E]" : "border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] text-[var(--ink-3)] hover:text-[var(--ink)]"}`}
          >
            <span className={`size-1.5 rounded-full ${liveOnly ? "bg-[#49D47E]" : "bg-[var(--ink-4)]"}`} />
            {liveOnly ? `${liveCount.toLocaleString()} live · on` : `${liveCountAll.toLocaleString()} live`}
          </button>
          <span className="inline-flex min-h-[26px] items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] px-2.5 text-[10.5px] font-semibold text-[var(--ink-3)] max-[420px]:px-2 max-[420px]:text-[10px]">Page {mapPage + 1} of {mapTotalPages}</span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3.5 max-[520px]:grid-cols-2 max-[520px]:gap-2.5">
        {paginatedMaps.map(map => {
          const imageUrl = mapImageLookup.get(map.name) ?? mapImageLookup.get(normalizeMapName(map.name));
          const isLive = rotationMapNames.has(map.name);
          const mode = getModeForMap(modes, map.name);
          const modeColor = mode ? MODE_CONFIG[mode]?.color : undefined;

          return (
            <button
              key={map.name}
              onClick={() => onSelect({ name: map.name, imageUrl, mode, isLive })}
              className="map-card group relative block w-full cursor-pointer overflow-hidden border border-[var(--line)] bg-[var(--panel)] p-0 text-left shadow-[var(--shadow-lift)] transition-[transform,border-color,box-shadow,background] duration-200 hover:-translate-y-0.5 hover:border-[var(--line-2)] hover:bg-[color-mix(in_srgb,var(--panel)_70%,var(--hover-bg))] hover:shadow-[0_22px_42px_-30px_rgba(0,0,0,0.75)] active:-translate-y-px"
            >
              <div className="relative z-[1] overflow-hidden rounded-t-lg bg-[radial-gradient(circle_at_50%_46%,color-mix(in_srgb,var(--line-2)_42%,transparent),transparent_70%),var(--panel-2)]">
                <MapPreview imageUrl={imageUrl} name={map.name} mode={mode} modeColor={modeColor} />
                {modeColor && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${modeColor}, transparent)`, opacity: 0.6 }} />
                )}
              </div>

              <div className="map-card-meta relative z-[1] border-t border-[var(--line)] px-3 pt-2.5 pb-3">
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
