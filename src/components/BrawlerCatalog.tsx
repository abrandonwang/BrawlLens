import type { Brawler } from "@/app/brawlers/page"
import type { CSSProperties } from "react"

function sanitizeColor(color: string): string {
  const match = color.match(/#[0-9a-fA-F]{3,6}/)
  return match ? match[0] : "#888"
}

const RARITY_ORDER = [
  "Starting Brawler", "Common", "Rare", "Super Rare",
  "Epic", "Mythic", "Legendary", "Ultra Legendary",
]

interface Props {
  brawlers: Brawler[]
  activeRarity: string | null
  search: string
  onSelect: (b: Brawler) => void
}

export default function BrawlerCatalog({ brawlers, activeRarity, search, onSelect }: Props) {
  const filtered = brawlers.filter(b => {
    const matchesRarity = !activeRarity || b.rarity.name === activeRarity
    const matchesSearch = !search || b.name.toLowerCase().includes(search.toLowerCase())
    return matchesRarity && matchesSearch
  })

  const grouped = RARITY_ORDER.reduce((acc, rarity) => {
    acc[rarity] = filtered.filter(b => b.rarity.name === rarity)
    return acc
  }, {} as Record<string, Brawler[]>)

  if (filtered.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-5 py-[42px] text-center shadow-[var(--shadow-lift)]">
        <p className="mb-1.5 text-[15px] font-semibold leading-snug text-[var(--ink)]">No brawlers found</p>
        <p className="m-0 text-[13.5px] leading-relaxed text-[var(--ink-3)]">Try a different search or clear the rarity filter.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[34px] pt-1.5">
      {RARITY_ORDER.map((rarity, sectionIndex) => {
        const group = grouped[rarity]
        if (!group.length) return null
        const color = sanitizeColor(group[0]?.rarity.color ?? "#888")

        return (
          <section
            key={rarity}
            className="transition"
            style={{ animationDelay: `${Math.min(sectionIndex * 35, 180)}ms`, "--rarity-color": color } as CSSProperties}
          >
            <div className="mb-3.5 inline-flex min-h-7 max-w-full items-center gap-2.5 rounded-full bg-[color-mix(in_srgb,var(--panel)_72%,transparent)] py-1.5 pr-2 pl-1.5">
              <span className="block size-2.5 shrink-0 rounded-[3px] bg-[var(--rarity-color)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--rarity-color)_14%,transparent)]" />
              <span className="text-[13px] font-semibold leading-snug text-[var(--ink)]">{rarity}</span>
              <span className="whitespace-nowrap rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_76%,transparent)] px-2 py-1 text-[10.5px] leading-none text-[var(--ink-3)]">
                {group.length} brawlers
              </span>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(86px,1fr))] gap-2.5 max-[1100px]:grid-cols-[repeat(auto-fill,minmax(82px,1fr))] max-[900px]:grid-cols-[repeat(auto-fill,minmax(78px,1fr))] max-md:grid-cols-[repeat(auto-fill,minmax(74px,1fr))] max-[500px]:grid-cols-4 max-[500px]:gap-2 max-[360px]:grid-cols-3">
              {group.map((brawler, index) => (
                <button
                  key={brawler.id}
                  onClick={() => onSelect(brawler)}
                  className="group relative block w-full min-w-0 cursor-pointer overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)] p-0 text-left no-underline shadow-[var(--shadow-lift)] transition-[transform,border-color,box-shadow,background] duration-200 hover:-translate-y-0.5 hover:border-[var(--line-2)] hover:bg-[color-mix(in_srgb,var(--panel)_70%,var(--hover-bg))] hover:shadow-[0_22px_42px_-30px_rgba(0,0,0,0.75)] active:-translate-y-px"
                  style={{ animationDelay: `${Math.min(index * 18, 220)}ms` }}
                >
                  <div
                    className="relative grid aspect-square place-items-center overflow-hidden rounded-t-lg after:absolute after:inset-x-2.5 after:bottom-2 after:h-3 after:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.28),transparent_70%)] after:opacity-55 after:transition-opacity group-hover:after:opacity-90"
                    style={{
                      background: `radial-gradient(circle at 50% 62%, color-mix(in srgb, ${color} 30%, transparent), transparent 68%), linear-gradient(180deg, color-mix(in srgb, var(--panel-2) 86%, ${color}), var(--panel))`,
                    }}
                  >
                    <img
                      className="relative z-10 h-[88%] w-[88%] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-[transform,filter] duration-200 group-hover:scale-[1.06] group-hover:drop-shadow-[0_8px_18px_rgba(0,0,0,0.48)]"
                      src={brawler.imageUrl2}
                      alt={brawler.name}
                    />
                  </div>
                  <div className="border-t border-[var(--line)] px-2 pt-2 pb-[9px] text-center">
                    <span className="block truncate text-[11.5px] font-semibold text-[var(--ink)]">
                      {brawler.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
