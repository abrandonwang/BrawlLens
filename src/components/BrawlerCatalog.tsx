import type { Brawler } from "@/app/brawlers/page"
import type { CSSProperties } from "react"
import { Check, Plus } from "lucide-react"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { EmptyState } from "@/components/PolishStates"
import { winRateColor } from "@/lib/tiers"

function sanitizeColor(color: string): string {
  const match = color.match(/#[0-9a-fA-F]{3,6}/)
  return match ? match[0] : "#888"
}

function formatPicks(picks: number | null | undefined) {
  if (!picks) return "—"
  return picks >= 1000 ? `${(picks / 1000).toFixed(1)}k` : String(picks)
}

export interface CatalogBrawlerStats {
  picks: number
  wins: number
  winRate: number | null
  mapCount: number
  histogram: number[]
  bestMap: { name: string; mode: string; winRate: number; picks: number } | null
}

interface Props {
  brawlers: Brawler[]
  stats: Record<number, CatalogBrawlerStats>
  selectedForCompare: number[]
  onSelect: (b: Brawler) => void
  onToggleCompare: (b: Brawler) => void
}

const CARD_HEIGHT = 174

export default function BrawlerCatalog({ brawlers, stats, selectedForCompare, onSelect, onToggleCompare }: Props) {
  if (brawlers.length === 0) {
    return (
      <EmptyState
        title="No brawlers found"
        description="Try a different search or clear the filters."
      />
    )
  }

  const selectedSet = new Set(selectedForCompare)

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(124px,1fr))] gap-2.5 pt-1.5 max-[640px]:grid-cols-[repeat(auto-fill,minmax(108px,1fr))] max-[420px]:grid-cols-3 max-[360px]:grid-cols-2">
      {brawlers.map((brawler, index) => {
            const color = sanitizeColor(brawler.rarity.color)
            const stat = stats[brawler.id]
            const winRate = stat?.winRate
            const compareSelected = selectedSet.has(brawler.id)
            return (
              <article
                key={brawler.id}
                className="group relative block w-full min-w-0 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)] p-0 text-left no-underline shadow-[var(--shadow-lift)] transition-[transform,border-color,box-shadow,background] duration-200 hover:-translate-y-0.5 hover:border-[var(--line-2)] hover:bg-[color-mix(in_srgb,var(--panel)_70%,var(--hover-bg))] hover:shadow-[0_22px_42px_-30px_rgba(0,0,0,0.75)]"
                style={{
                  height: CARD_HEIGHT,
                  animationDelay: `${Math.min(index * 8, 90)}ms`,
                  "--rarity-color": color,
                } as CSSProperties}
              >
                <button
                  type="button"
                  aria-label={`${compareSelected ? "Remove" : "Add"} ${brawler.name} comparison`}
                  aria-pressed={compareSelected}
                  onClick={() => onToggleCompare(brawler)}
                  className={`absolute top-2 right-2 z-30 grid size-7 place-items-center rounded-md border shadow-sm backdrop-blur transition ${compareSelected ? "border-[var(--accent)] bg-[var(--accent)] text-black" : "border-white/15 bg-black/35 text-white/90 hover:bg-black/50"}`}
                >
                  {compareSelected ? <Check size={14} /> : <Plus size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(brawler)}
                  className="block h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left"
                  aria-label={`Open ${brawler.name}`}
                >
                <span className="absolute top-2 left-2 z-20 max-w-[calc(100%-44px)] truncate rounded-md border border-black/10 bg-black/30 px-1.5 py-0.5 text-[9.5px] font-bold text-white/90 backdrop-blur">
                  {brawler.class.name === "Unknown" ? brawler.rarity.name : brawler.class.name}
                </span>

                <div
                  className="relative grid h-[104px] place-items-center overflow-hidden rounded-t-lg after:absolute after:inset-x-2.5 after:bottom-2 after:h-3 after:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.28),transparent_70%)] after:opacity-55 after:transition-opacity group-hover:after:opacity-90"
                  style={{
                    background: `radial-gradient(circle at 50% 62%, color-mix(in srgb, ${color} 30%, transparent), transparent 68%), linear-gradient(180deg, color-mix(in srgb, var(--panel-2) 86%, ${color}), var(--panel))`,
                  }}
                >
                  <BrawlImage
                    className="relative z-10 h-[88%] w-[88%] object-contain object-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-[transform,filter] duration-200 group-hover:scale-[1.04] group-hover:drop-shadow-[0_8px_18px_rgba(0,0,0,0.48)]"
                    src={brawlerIconUrl(brawler.id)}
                    alt={brawler.name}
                    width={108}
                    height={108}
                    sizes="116px"
                    priority={index < 18}
                  />
                </div>
                <div className="border-t border-[var(--line)] px-2.5 pt-2 pb-2">
                  <span className="block truncate text-center text-[11.5px] font-semibold text-[var(--ink)]">
                    {brawler.name}
                  </span>
                  <div className="mt-2 grid grid-cols-2 items-end gap-2">
                    <div className="min-w-0">
                      <span className="block text-[9.5px] font-semibold uppercase tracking-normal text-[var(--ink-4)]">Win</span>
                      <strong className="block text-[11px] leading-tight" style={{ color: winRate != null ? winRateColor(winRate) : "var(--ink-4)" }}>
                        {winRate != null ? `${winRate.toFixed(1)}%` : "—"}
                      </strong>
                    </div>
                    <div className="min-w-0 text-right">
                      <span className="block text-[9.5px] font-semibold uppercase tracking-normal text-[var(--ink-4)]">Picks</span>
                      <strong className="block text-[11px] leading-tight text-[var(--ink-2)]">{formatPicks(stat?.picks)}</strong>
                    </div>
                  </div>
                </div>
                </button>
              </article>
            )
          })}
    </div>
  )
}
