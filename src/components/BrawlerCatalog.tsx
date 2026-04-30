import type { Brawler } from "@/app/brawlers/page"
import type { CSSProperties } from "react"
import { Check, Plus } from "lucide-react"
import { BrawlImage } from "@/components/BrawlImage"
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

const CARD_HEIGHT = 210

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
    <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-5 pt-1 max-[640px]:grid-cols-[repeat(auto-fill,minmax(132px,1fr))] max-[420px]:grid-cols-2">
      {brawlers.map((brawler, index) => {
            const color = sanitizeColor(brawler.rarity.color)
            const stat = stats[brawler.id]
            const winRate = stat?.winRate
            const compareSelected = selectedSet.has(brawler.id)
            return (
              <article
                key={brawler.id}
                className="group relative block w-full min-w-0 overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--panel)] p-2 text-left no-underline transition-[transform,border-color,background] duration-200 hover:-translate-y-px hover:border-[var(--line-2)]"
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
                  className={`absolute top-3 right-3 z-30 grid size-5 place-items-center rounded-full border transition ${compareSelected ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]" : "border-[rgba(28,28,28,0.4)] bg-[var(--panel)] text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)]"}`}
                >
                  {compareSelected ? <Check size={10} /> : <Plus size={10} />}
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(brawler)}
                  className="block h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left"
                  aria-label={`Open ${brawler.name}`}
                >
                <span className="absolute top-3 left-3 z-20 flex h-5 max-w-[calc(100%-44px)] items-center truncate rounded-full border border-[rgba(28,28,28,0.4)] bg-[var(--ink)] px-2 text-[9.5px] font-semibold leading-none text-[var(--bg)]">
                  {brawler.class.name === "Unknown" ? brawler.rarity.name : brawler.class.name}
                </span>

                <div className="relative grid h-[130px] place-items-center rounded-[10px] bg-[var(--panel)] px-3 pt-8 pb-1">
                  <BrawlImage
                    className="relative z-10 h-[104px] w-[104px] rounded-[7px] border border-[rgba(28,28,28,0.62)] object-contain object-center transition-transform duration-200 group-hover:scale-[1.025]"
                    src={brawler.imageUrl2}
                    alt={brawler.name}
                    width={148}
                    height={148}
                    sizes="160px"
                    priority={index < 18}
                  />
                </div>
                <div className="px-1 pt-1 pb-2">
                  <span className="block truncate text-center text-[14px] font-semibold tracking-[-0.016em] text-[var(--ink)]">
                    {brawler.name}
                  </span>
                  <div className="mt-1.5 grid grid-cols-2 items-end gap-3">
                    <div className="min-w-0">
                      <span className="block text-[10px] font-normal tracking-[-0.01em] text-[var(--ink-4)]">Win</span>
                      <strong className="block text-[12px] leading-tight" style={{ color: winRate != null ? winRateColor(winRate) : "var(--ink-4)" }}>
                        {winRate != null ? `${winRate.toFixed(1)}%` : "—"}
                      </strong>
                    </div>
                    <div className="min-w-0 text-right">
                      <span className="block text-[10px] font-normal tracking-[-0.01em] text-[var(--ink-4)]">Picks</span>
                      <strong className="block text-[12px] leading-tight text-[var(--ink-2)]">{formatPicks(stat?.picks)}</strong>
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
