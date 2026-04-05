import Link from "next/link"
import { ArrowRight } from "lucide-react"

const categories = [
  {
    label: "Players",
    desc: "Top 200 trophy earners across 6 regions.",
    href: "/leaderboards/players",
  },
  {
    label: "Clubs",
    desc: "Top 200 clubs by combined trophies.",
    href: "/leaderboards/clubs",
  },
  {
    label: "Brawlers",
    desc: "Top 200 players per brawler, globally.",
    href: "/leaderboards/brawlers",
  },
]

export default function LeaderboardsHub() {
  return (
    <main className="flex-1 px-8 pt-8 pb-16 lg:px-12 lg:pt-12">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Leaderboards</h1>
      <p className="text-sm text-zinc-500 dark:text-white/40 mb-12">Rankings across players, clubs, and brawlers.</p>

      <div className="flex flex-col border border-black/[0.08] dark:border-white/[0.08] divide-y divide-black/[0.08] dark:divide-white/[0.08] mb-12">
        {categories.map(({ label, desc, href }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center justify-between px-6 py-5 bg-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
          >
            <div>
              <p className="text-base font-bold text-zinc-900 dark:text-white">{label}</p>
              <p className="text-xs text-zinc-500 dark:text-white/40 mt-0.5">{desc}</p>
            </div>
            <ArrowRight size={15} className="text-zinc-400 dark:text-white/30 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>
      <div className="border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-8 max-w-2xl mx-auto text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-white/30 mb-4">About Leaderboards</p>
        <p className="text-sm text-zinc-500 dark:text-white/40 leading-relaxed">
          BrawlLens leaderboards track the top 200 players, clubs, and brawler-specific rankings using real-time data refreshed every 30 minutes. Rankings are available across six regions: Global, United States, Korea, Brazil, Germany, and Japan.
        </p>
      </div>
    </main>
  )
}
