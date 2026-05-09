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
  if (!picks) return "-"
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

const CARD_HEIGHT = 178

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
    <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-2 pt-1 max-[640px]:grid-cols-[repeat(auto-fill,minmax(122px,1fr))] max-[420px]:grid-cols-2">
      {brawlers.map((brawler, index) => {
            const color = sanitizeColor(brawler.rarity.color)
            const stat = stats[brawler.id]
            const winRate = stat?.winRate
            const compareSelected = selectedSet.has(brawler.id)
            return (
              <article
                key={brawler.id}
                className="group relative block w-full min-w-0 overflow-hidden rounded-[5px] border border-[rgba(247,244,237,0.065)] bg-[#1b1d22] p-1.5 text-left no-underline shadow-[rgba(255,255,255,0.032)_0_1px_0_0_inset] transition-colors duration-150 hover:border-[rgba(247,244,237,0.13)] hover:bg-[#202329]"
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
                  className={`absolute top-2 right-2 z-30 grid size-5 place-items-center rounded-[5px] border transition ${compareSelected ? "border-[#f0d373] bg-[#f0d373] text-[#171007]" : "border-white/[0.14] bg-[#101113] text-[var(--ink-2)] hover:border-white/[0.28] hover:text-[var(--ink)]"}`}
                >
                  {compareSelected ? <Check size={10} /> : <Plus size={10} />}
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(brawler)}
                  className="block h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left"
                  aria-label={`Open ${brawler.name}`}
                >
                <span className="absolute top-2 left-2 z-20 flex h-5 max-w-[calc(100%-40px)] items-center truncate rounded-[5px] border border-white/[0.10] bg-[#101113] px-2 text-[9.5px] font-semibold leading-none text-[var(--ink-2)]">
                  {brawler.class.name === "Unknown" ? brawler.rarity.name : brawler.class.name}
                </span>

                <div className="relative grid h-[104px] place-items-center rounded-[5px] bg-[#15171a] px-2 pt-7 pb-1">
                  <div className="relative z-10 size-[84px] overflow-hidden rounded-[5px] border border-white/[0.12] bg-[#101113] transition-transform duration-150 group-hover:scale-[1.015]">
                    <BrawlImage
                      className="size-full object-cover object-center"
                      src={brawler.imageUrl2}
                      alt={brawler.name}
                      width={148}
                      height={148}
                      sizes="160px"
                      priority={index < 18}
                    />
                  </div>
                </div>
                <div className="px-1 pt-2 pb-2">
                  <span className="block truncate text-center text-[13px] font-bold tracking-normal text-[var(--ink)]">
                    {brawler.name}
                  </span>
                  <div className="mt-1 grid grid-cols-2 items-end gap-2">
                    <div className="min-w-0">
                      <span className="block text-[10px] font-normal tracking-[-0.01em] text-[var(--ink-4)]">Win</span>
                      <strong className="block text-[12px] leading-tight" style={{ color: winRate != null ? winRateColor(winRate) : "var(--ink-4)" }}>
                        {winRate != null ? `${winRate.toFixed(1)}%` : "-"}
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
