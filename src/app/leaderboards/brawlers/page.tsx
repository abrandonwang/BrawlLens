import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface Brawler {
  id: number
  name: string
  imageUrl2: string
  rarity: { id: number; name: string; color: string }
}

const RARITY_ORDER = [
  "Starting Brawler", "Common", "Rare", "Super Rare",
  "Epic", "Mythic", "Legendary", "Ultra Legendary",
]

export default async function BrawlerLeaderboardsPage() {
  const res = await fetch("https://api.brawlify.com/v1/brawlers", { cache: "no-store" })
  const data = await res.json()
  const brawlers: Brawler[] = data.list ?? []

  const grouped = RARITY_ORDER.reduce((acc, rarity) => {
    acc[rarity] = brawlers.filter(b => b.rarity.name === rarity)
    return acc
  }, {} as Record<string, Brawler[]>)

  return (
    <main className="flex-1 px-8 pt-6 pb-16 lg:px-12">
      <Link href="/leaderboards" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 dark:text-white/30 hover:text-zinc-700 dark:hover:text-white/60 transition-colors mb-6">
        <ArrowLeft size={12} /> Leaderboards
      </Link>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Brawler Rankings</h1>
      <p className="text-sm text-zinc-500 dark:text-white/40 mb-10">Select a brawler to see the top 200 global players.</p>

      <div className="space-y-10">
        {RARITY_ORDER.map(rarity => {
          const group = grouped[rarity]
          if (!group?.length) return null
          const color = group[0].rarity.color

          return (
            <section key={rarity}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                <h2 className="text-sm font-semibold text-zinc-700 dark:text-white/70">{rarity}</h2>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                {group.map(brawler => (
                  <Link
                    key={brawler.id}
                    href={`/leaderboards/brawlers/${brawler.id}`}
                    className="group bg-zinc-100 border border-black/5 rounded-md overflow-hidden hover:border-black/20 transition-all duration-100 dark:bg-zinc-900 dark:border-white/5 dark:hover:border-white/20"
                  >
                    <div className="aspect-square p-1.5">
                      <img src={brawler.imageUrl2} alt={brawler.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="px-2 pb-2 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <p className="text-[10px] font-medium text-zinc-600 truncate dark:text-white/70">{brawler.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
