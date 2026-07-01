"use client";

import { useState, useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal, X } from "lucide-react";
import { BrawlImage } from "@/components/BrawlImage";
import { EmptyState, MapGridSkeleton, StateButton } from "@/components/PolishStates";
import { MODE_CONFIG } from "@/lib/modes";
import { normalizeMapName } from "@/lib/format";
import { formatRotationTimeRemaining, type RotationEvent } from "@/lib/rotation";

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
  onClearFilters?: () => void;
  filterControls?: ReactNode;
  searchControl?: ReactNode;
}

function getModeForMap(modes: ModeInfo[], mapName: string): string | null {
  for (const m of modes) {
    if (m.maps.some(map => map.name === mapName)) return m.mode;
  }
  return null;
}

function mapHref(name: string) {
  return `/meta/${encodeURIComponent(name)}`;
}

function mapInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const pages = new Set([0, totalPages - 1, currentPage - 1, currentPage, currentPage + 1]);
  const validPages = [...pages].filter(page => page >= 0 && page < totalPages).sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];

  validPages.forEach((page, index) => {
    const previous = validPages[index - 1];
    if (index > 0 && page - previous > 1) items.push("ellipsis");
    items.push(page);
  });

  return items;
}

function MapPreview({ imageUrl, name, modeColor, priority = false }: { imageUrl?: string; name: string; mode: string | null; modeColor?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>("1 / 1");
  const fallbackColor = modeColor || "var(--lb-accent, #FF6B6B)";

  if (!imageUrl || failed) {
    return (
      <div
        className="map-preview-frame map-preview-fallback relative grid w-full place-items-center overflow-hidden p-[18px] text-center"
        style={{ aspectRatio, "--map-accent": fallbackColor } as CSSProperties}
      >
        <div className="map-preview-fallback-mark" aria-hidden="true">{mapInitials(name)}</div>
        <span className="map-preview-fallback-name">{name}</span>
      </div>
    );
  }

  return (
    <div
      className="map-preview-frame relative grid w-full place-items-center rounded-t-[5px]"
      style={{ aspectRatio }}
    >
      <BrawlImage
        src={imageUrl}
        alt={name}
        fill
        sizes="(max-width: 520px) 50vw, 220px"
        className="block rounded-t-[5px] object-contain transition-[transform,filter] duration-200"
        {...(priority ? { priority: true } : { loading: "lazy" as const })}
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

export default function MetaDashboard({ modes, loading, selectedMode, mapSearch, onClearFilters, filterControls, searchControl }: Props) {
  const [mapImageLookup, setMapImageLookup] = useState<Map<string, string>>(new Map());
  const [rotationByMap, setRotationByMap] = useState<Map<string, RotationEvent>>(new Map());
  const [mapPage, setMapPage] = useState(0);
  const [liveOnly, setLiveOnly] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/rotation").then(r => r.json()).catch(() => []),
      fetch("https://api.brawlapi.com/v1/maps").then(r => r.json()).catch(() => ({ list: [] })),
    ]).then(([rotationData, mapsData]) => {
      const activeMaps = new Map<string, RotationEvent>();
      for (const slot of rotationData || []) {
        if (slot.event?.map) activeMaps.set(slot.event.map, slot);
      }
      setRotationByMap(activeMaps);

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
      const aLive = rotationByMap.has(a.name) ? 1 : 0;
      const bLive = rotationByMap.has(b.name) ? 1 : 0;
      if (bLive !== aLive) return bLive - aLive;
      return b.battles - a.battles;
    });
  }, [modes, selectedMode, rotationByMap, allUniqueMaps]);

  const displayedMaps = useMemo(() => {
    let list = sortedMaps;
    if (mapSearch) list = list.filter(m => m.name.toLowerCase().includes(mapSearch.toLowerCase()));
    if (liveOnly) list = list.filter(m => rotationByMap.has(m.name));
    return list;
  }, [sortedMaps, mapSearch, liveOnly, rotationByMap]);

  useEffect(() => { setMapPage(0); }, [displayedMaps]);

  useEffect(() => {
    if (!mapModalOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMapModalOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mapModalOpen]);

  const MAP_PAGE_SIZE = 12;
  const mapTotalPages = Math.ceil(displayedMaps.length / MAP_PAGE_SIZE);
  const paginatedMaps = displayedMaps.slice(mapPage * MAP_PAGE_SIZE, (mapPage + 1) * MAP_PAGE_SIZE);
  const liveCountAll = sortedMaps.filter(map => rotationByMap.has(map.name)).length;
  const liveCount = displayedMaps.filter(map => rotationByMap.has(map.name)).length;
  const paginationItems = getPaginationItems(mapPage, mapTotalPages);

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
      <div className="bl-tier-toolbar bl-meta-toolbar">
        <div className="bl-tier-selector-group">
          {filterControls}
          <div className="bl-meta-live-toggle-wrap">
            <button
              type="button"
              onClick={() => setLiveOnly(v => !v)}
              disabled={!liveOnly && liveCountAll === 0}
              aria-pressed={liveOnly}
              aria-label={liveOnly ? `Showing ${liveCount.toLocaleString()} live maps` : `Show ${liveCountAll.toLocaleString()} live maps`}
              className="bl-meta-live-toggle"
            >
              <span className="bl-meta-live-toggle-surface" aria-hidden="true">
                <span className="bl-meta-live-knob" />
                <span className="bl-meta-live-text bl-meta-live-text-left">Live</span>
                <span className="bl-meta-live-text bl-meta-live-text-right">{liveCountAll.toLocaleString()}</span>
              </span>
            </button>
          </div>
          <div className="bl-tier-selector-anchor">
            <div className="bl-tier-selector-wrap">
              <button
                type="button"
                className="bl-tier-selector bl-meta-count-pill"
                aria-haspopup="dialog"
                aria-expanded={mapModalOpen}
                onClick={() => setMapModalOpen(true)}
              >
                <span>{displayedMaps.length.toLocaleString()} maps</span>
              </button>
            </div>
          </div>
        </div>

        {searchControl}
      </div>

      <div className="mt-4 mb-5 grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2 max-[520px]:mt-3 max-[520px]:grid-cols-2 max-[520px]:gap-2">
        {paginatedMaps.map((map, index) => {
          const imageUrl = mapImageLookup.get(map.name) ?? mapImageLookup.get(normalizeMapName(map.name));
          const rotationSlot = rotationByMap.get(map.name);
          const rotationLabel = formatRotationTimeRemaining(rotationSlot?.endTime, now);
          const isLive = Boolean(rotationSlot);
          const mode = getModeForMap(modes, map.name);
          const modeColor = mode ? MODE_CONFIG[mode]?.color : undefined;

          return (
            <Link
              key={map.name}
              href={mapHref(map.name)}
              className="map-card group relative block w-full cursor-pointer overflow-hidden border border-[var(--line)] bg-[var(--panel)] p-0 text-left transition-[border-color,background] duration-150 hover:border-[var(--line-2)]"
            >
              <div className="relative z-[1] overflow-hidden rounded-t-[5px] bg-[var(--panel-2)]">
                <MapPreview imageUrl={imageUrl} name={map.name} mode={mode} modeColor={modeColor} priority={mapPage === 0 && index < 6} />
                {modeColor && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${modeColor}, transparent)`, opacity: 0.6 }} />
                )}
              </div>

              <div className="map-card-meta relative z-[1] border-t border-[var(--line)] px-3 pt-2.5 pb-3">
                <div className={`mb-1 truncate text-[15px] font-semibold tracking-[-0.016em] ${isLive ? "text-[var(--win)]" : "text-[var(--ink)]"}`}>
                  {map.name}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] leading-snug tracking-[-0.01em] text-[var(--ink-3)]">{rotationLabel ?? `${map.battles.toLocaleString()} battles`}</span>
                  {mode && modeColor && (
                    <span className="text-[9.5px] font-semibold tracking-[0.04em] uppercase opacity-85" style={{ color: modeColor }}>
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
        <nav className="bl-meta-pagination" aria-label="Map pages">
          <div className="bl-meta-page-rail">
            <button
              type="button"
              onClick={() => setMapPage(page => Math.max(0, page - 1))}
              disabled={mapPage === 0}
              className="bl-meta-page-control"
              aria-label="Go to previous page"
            >
              <ChevronLeft aria-hidden="true" />
            </button>

            <div className="bl-meta-page-list">
              {paginationItems.map((item, index) => {
                if (item === "ellipsis") {
                  return (
                    <span key={`ellipsis-${index}`} className="bl-meta-page-ellipsis" aria-hidden="true">
                      <MoreHorizontal aria-hidden="true" />
                    </span>
                  );
                }

                const active = item === mapPage;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMapPage(item)}
                    aria-label={`Go to page ${item + 1}`}
                    aria-current={active ? "page" : undefined}
                    className={`bl-meta-page-link ${active ? "is-active" : ""}`}
                  >
                    {item + 1}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setMapPage(page => Math.min(mapTotalPages - 1, page + 1))}
              disabled={mapPage === mapTotalPages - 1}
              className="bl-meta-page-control"
              aria-label="Go to next page"
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}

      {mapModalOpen && (
        <div
          className="bl-meta-modal-layer fixed inset-0 z-[1000] grid place-items-center bg-[rgba(0,0,0,0.54)] p-[18px] backdrop-blur-[10px]"
          role="presentation"
          onMouseDown={() => setMapModalOpen(false)}
        >
          <section
            className="bl-meta-map-modal w-[min(560px,calc(100vw-28px))] max-h-[min(680px,calc(100vh-56px))] overflow-hidden rounded-[12px] border border-[rgba(245,244,241,0.12)] bg-[rgba(13,13,17,0.98)] shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_26px_84px_-42px_rgba(0,0,0,0.92)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bl-meta-map-modal-title"
            onMouseDown={event => event.stopPropagation()}
          >
            <header className="bl-meta-map-modal-head flex items-center justify-between gap-[14px] border-b border-[rgba(245,244,241,0.075)] px-3 py-[11px]">
              <div>
                <h2 id="bl-meta-map-modal-title" className="m-0 text-[14px] font-[840] leading-none text-[#f5f4f1] [font-family:var(--font-heading)]">Maps</h2>
                <p className="m-0 mt-1 text-[10.5px] font-[760] leading-none text-[rgba(245,244,241,0.62)] [font-family:var(--font-label)]">{displayedMaps.length.toLocaleString()} maps in this view</p>
              </div>
              <button
                type="button"
                aria-label="Close maps list"
                onClick={() => setMapModalOpen(false)}
                className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-[8px] border border-transparent bg-transparent text-[rgba(245,244,241,0.62)] transition-colors hover:border-[rgba(245,244,241,0.10)] hover:bg-[rgba(245,244,241,0.045)] hover:text-[#f5f4f1] focus-visible:border-[rgba(245,244,241,0.10)] focus-visible:bg-[rgba(245,244,241,0.045)] focus-visible:text-[#f5f4f1] focus-visible:outline-none"
              >
                <X aria-hidden="true" className="size-[14px]" />
              </button>
            </header>
            <div className="bl-meta-map-modal-list max-h-[min(596px,calc(100vh-136px))] overflow-y-auto p-[5px]">
              {displayedMaps.map(map => {
                const mode = getModeForMap(modes, map.name);
                const modeColor = mode ? MODE_CONFIG[mode]?.color : undefined;

                return (
                  <Link
                    key={map.name}
                    href={mapHref(map.name)}
                    onClick={() => setMapModalOpen(false)}
                    className="bl-meta-map-modal-row grid min-h-[27px] grid-cols-[minmax(0,1fr)_88px_98px] items-center gap-[10px] rounded-[7px] px-[7px] py-[5px] text-[11.5px] font-[780] leading-none text-[rgba(245,244,241,0.78)] no-underline transition-colors hover:bg-[rgba(245,244,241,0.045)] hover:text-[#f5f4f1] focus-visible:bg-[rgba(245,244,241,0.045)] focus-visible:text-[#f5f4f1] focus-visible:outline-none max-[640px]:grid-cols-[minmax(0,1fr)_76px] [font-family:var(--font-label)]"
                  >
                    <span className="bl-meta-map-modal-name min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{map.name}</span>
                    {mode && (
                      <span className="bl-meta-map-modal-mode min-w-0 overflow-hidden text-right text-[10px] font-[820] text-ellipsis whitespace-nowrap opacity-85 max-[640px]:hidden" style={modeColor ? { color: modeColor } : undefined}>
                        {MODE_CONFIG[mode]?.label || mode}
                      </span>
                    )}
                    <span className="bl-meta-map-modal-count text-right text-[11px] font-[840] text-[rgba(245,244,241,0.72)] [font-family:var(--font-number,var(--font-geist-mono),ui-monospace,monospace)]">{map.battles.toLocaleString()}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
