import { Trophy } from "lucide-react"

const REGIONS = [
  { code: "global", label: "Global" },
  { code: "US", label: "United States" },
  { code: "KR", label: "Korea" },
  { code: "BR", label: "Brazil" },
  { code: "DE", label: "Germany" },
  { code: "JP", label: "Japan" },
]

interface Player {
  tag: string
  name: string
  trophies: number
  rank: number
  club?: { name: string }
}

async function fetchLeaderboard(region: string): Promise<Player[]> {
  try {
    const res = await fetch(
      `https://api.brawlstars.com/v1/rankings/${region}/players`,
      {
        headers: { Authorization: `Bearer ${process.env.BRAWL_API_KEY}` },
        next: { revalidate: 300 },
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.items || []
  } catch {
    return []
  }
}

export default async function LeaderboardsPage() {
  const allData = await Promise.all(
    REGIONS.map(async (r) => ({ ...r, players: await fetchLeaderboard(r.code) }))
  )

  const global = allData[0]

  return (
    <div className="bg-black h-[calc(100dvh-52px)] flex flex-col lg:flex-row overflow-hidden">

      {/* Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 h-auto lg:h-full border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col lg:overflow-y-auto">
        <div className="px-4 pt-4 pb-3 lg:px-5 lg:pt-10 lg:pb-6">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Regions</p>
          <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
            {allData.map((r) => (
              <div key={r.code} className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-white/50 whitespace-nowrap">
                <span>{r.label}</span>
                <span className="text-white/25 text-[10px]">{r.players.length} players</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto pt-6 pb-6 px-8">

        <section className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">Leaderboards</h1>
          <p className="text-white/40 text-sm leading-relaxed">Top 200 players globally and by region, ranked by trophies.</p>
        </section>

        <div className="space-y-12">
          {allData.map((region) => (
            <section key={region.code}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-sm font-bold text-white/70 uppercase tracking-widest">{region.label}</h2>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {region.players.length === 0 ? (
                <p className="text-white/25 text-sm py-8">No data available.</p>
              ) : (
                <div className="space-y-1">
                  {/* Header */}
                  <div className="grid grid-cols-[32px_1fr_auto_auto] gap-4 px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                    <span>#</span>
                    <span>Player</span>
                    <span className="hidden sm:block">Club</span>
                    <span className="text-right">Trophies</span>
                  </div>

                  {region.players.slice(0, 50).map((player, i) => (
                    <div
                      key={player.tag}
                      className="grid grid-cols-[32px_1fr_auto_auto] gap-4 items-center px-3 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                    >
                      <span className={`text-xs font-black tabular-nums ${
                        i === 0 ? "text-[#FFD400]" : i === 1 ? "text-white/60" : i === 2 ? "text-orange-400/70" : "text-white/25"
                      }`}>
                        {i + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{player.name}</p>
                        <p className="text-[10px] text-white/25 font-mono">{player.tag}</p>
                      </div>

                      <span className="hidden sm:block text-xs text-white/30 truncate max-w-[140px]">
                        {player.club?.name ?? "—"}
                      </span>

                      <div className="flex items-center gap-1.5 justify-end">
                        <Trophy size={11} className="text-[#FFD400]/50 shrink-0" />
                        <span className="text-sm font-bold text-[#FFD400]/80 tabular-nums">
                          {player.trophies.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
