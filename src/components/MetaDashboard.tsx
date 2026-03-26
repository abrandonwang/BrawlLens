"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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

const MODE_LABELS: Record<string, string> = {
  brawlBall: "Brawl Ball",
  gemGrab: "Gem Grab",
  knockout: "Knockout",
  bounty: "Bounty",
  heist: "Heist",
  hotZone: "Hot Zone",
  wipeout: "Wipeout",
  duels: "Duels",
  soloShowdown: "Showdown",
  duoShowdown: "Duo SD",
  payload: "Payload",
};

function getModeName(mode: string): string {
  return MODE_LABELS[mode] || mode.charAt(0).toUpperCase() + mode.slice(1);
}

function getTierInfo(winRate: number): { label: string; color: string; bg: string } {
  if (winRate >= 58) return { label: "S", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" };
  if (winRate >= 54) return { label: "A", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20" };
  if (winRate >= 50) return { label: "B", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" };
  if (winRate >= 46) return { label: "C", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" };
  return { label: "D", color: "text-zinc-400", bg: "bg-zinc-400/10 border-zinc-400/20" };
}

function getBrawlerImage(brawlerId: number): string {
  return `https://cdn.brawlify.com/brawlers/borderless/${brawlerId}.png`;
}

function getMapImage(mapName: string): string {
  // This won't always match perfectly — we'd need event_id for exact mapping.
  // For now, we'll skip map images and just show names.
  return "";
}

export default function MetaDashboard() {
  const [modes, setModes] = useState<ModeInfo[]>([]);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [mapMeta, setMapMeta] = useState<MapMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMap, setLoadingMap] = useState(false);

  // Fetch modes + maps on mount
  useEffect(() => {
    fetch("/api/meta")
      .then((r) => r.json())
      .then((data) => {
        setModes(data.modes || []);
        if (data.modes?.length > 0) {
          setSelectedMode(data.modes[0].mode);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch brawler stats when a map is selected
  useEffect(() => {
    if (!selectedMap) {
      setMapMeta(null);
      return;
    }
    setLoadingMap(true);
    fetch(`/api/meta?map=${encodeURIComponent(selectedMap)}`)
      .then((r) => r.json())
      .then((data) => {
        setMapMeta(data);
        setLoadingMap(false);
      })
      .catch(() => setLoadingMap(false));
  }, [selectedMap]);

  const currentMode = modes.find((m) => m.mode === selectedMode);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (modes.length === 0) {
    return (
      <div className="text-center py-32">
        <p className="text-white/40 text-lg">
          No battle data yet — the collector is still running.
        </p>
        <p className="text-white/20 text-sm mt-2">
          Check back once the script finishes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => (
          <button
            key={m.mode}
            onClick={() => {
              setSelectedMode(m.mode);
              setSelectedMap(null);
            }}
            className={`
              px-4 py-2 rounded-full text-sm font-bold tracking-tight transition-all
              ${
                selectedMode === m.mode
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
              }
            `}
          >
            {getModeName(m.mode)}
            <span className="ml-2 text-xs opacity-50">
              {(m.totalBattles / 1000).toFixed(1)}k
            </span>
          </button>
        ))}
      </div>

      {currentMode && !selectedMap && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {currentMode.maps.map((map) => (
            <button
              key={map.name}
              onClick={() => setSelectedMap(map.name)}
              className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-left hover:bg-white/[0.06] hover:border-white/10 transition-all"
            >
              <h3 className="text-white font-bold text-sm truncate group-hover:text-white/90">
                {map.name}
              </h3>
              <p className="text-white/20 text-xs mt-1">
                {map.battles.toLocaleString()} battles
              </p>
            </button>
          ))}
        </div>
      )}

      {selectedMap && (
        <button
          onClick={() => setSelectedMap(null)}
          className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors text-sm font-bold"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back to {getModeName(selectedMode || "")} maps
        </button>
      )}

      {selectedMap && loadingMap && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {selectedMap && mapMeta && !loadingMap && (
        <div>
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{mapMeta.map}</h2>
              <p className="text-white/30 text-sm mt-1">
                {mapMeta.totalBattles.toLocaleString()} battles sampled
              </p>
            </div>
          </div>

          {mapMeta.brawlers.length === 0 ? (
            <p className="text-white/30 text-center py-16">
              Not enough data for this map yet.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[48px_1fr_80px_80px_100px] gap-3 px-4 py-2 text-xs font-bold text-white/20 uppercase tracking-wider">
                <span></span>
                <span>Brawler</span>
                <span className="text-right">Win Rate</span>
                <span className="text-right">Picks</span>
                <span className="text-right">Tier</span>
              </div>

              {mapMeta.brawlers
                .filter((b) => b.picks >= 10) // Only show brawlers with enough data
                .map((brawler, i) => {
                  const tier = getTierInfo(brawler.winRate);
                  return (
                    <div
                      key={brawler.brawlerId}
                      className="grid grid-cols-[48px_1fr_80px_80px_100px] gap-3 items-center px-4 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden flex items-center justify-center">
                        <img
                          src={getBrawlerImage(brawler.brawlerId)}
                          alt={brawler.name}
                          width={36}
                          height={36}
                          className="object-contain"
                          loading="lazy"
                        />
                      </div>

                      <span className="text-white font-semibold text-sm truncate">
                        {brawler.name.charAt(0) +
                          brawler.name.slice(1).toLowerCase()}
                      </span>

                      <span
                        className={`text-right font-bold text-sm ${tier.color}`}
                      >
                        {brawler.winRate.toFixed(1)}%
                      </span>

                      <span className="text-right text-white/30 text-sm">
                        {brawler.picks.toLocaleString()}
                      </span>

                      <div className="flex justify-end">
                        <span
                          className={`
                            inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-black
                            ${tier.bg} ${tier.color}
                          `}
                        >
                          {tier.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}