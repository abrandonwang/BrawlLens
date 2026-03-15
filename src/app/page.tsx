"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import ScrambleText from "@/components/ScrambleText"
import { Trophy, Shield, BarChart2 } from "lucide-react"

const exampleTags = ["YP90U0YL", "2PP8LCQG", "QLCCRG20", "9RULJP8V"]

const features = [
  { icon: Trophy, label: "Trophy Tracking", desc: "Follow your trophy road progression in detail" },
  { icon: Shield, label: "Brawler Stats", desc: "Power, rank, gadgets and star powers for every brawler" },
  { icon: BarChart2, label: "Leaderboards", desc: "Global and regional rankings across all modes" },
]

export default function Home() {
  const router = useRouter()
  const [userInput, setUserInput] = useState("")
  const [playerData, setPlayerData] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)

  async function handleSearch() {
    if (!userInput.trim()) return
    setPlayerData(null)
    setNotFound(false)
    try {
      const response = await fetch(`/api/player?tag=${userInput}`)
      const data = await response.json()
      if (data.reason) {
        setNotFound(true)
      } else {
        setPlayerData(data)
        localStorage.setItem("savedPlayerTag", userInput.toUpperCase())
        if (data.icon?.id) localStorage.setItem("savedPlayerIconId", String(data.icon.id))
        window.dispatchEvent(new Event("playerSaved"))
      }
    } catch {
      setNotFound(true)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-[1200px] flex flex-col gap-3">

        {/* ── Hero ── */}
        <div className="rounded-3xl bg-[#1c1c1f] overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-cyan-500" />
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 px-6 py-10 sm:px-10 lg:px-14 lg:py-16">

            {/* Left: text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold tracking-[0.22em] text-blue-400/55 uppercase mb-4">
                Brawl Stars Analytics
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.06] mb-4">
                Your Brawl Stars<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  companion.
                </span>
              </h1>
              <p className="text-sm text-white/35 leading-relaxed max-w-sm mb-7">
                Deep stats, brawler breakdowns, leaderboards, and more. Built for players who want to improve.
              </p>
              <button className="px-6 py-3 bg-white text-[#111113] text-sm font-bold rounded-2xl hover:bg-white/90 active:scale-95 transition-all cursor-pointer">
                Sign in
              </button>
            </div>

            {/* Right: stat blocks — hidden on mobile */}
            <div className="hidden lg:flex shrink-0 flex-col gap-3 w-64">
              {[
                { value: "100+", label: "Brawlers tracked" },
                { value: "20", label: "Game modes covered" },
                { value: "Free", label: "Never requires a subscription" },
              ].map(({ value, label }) => (
                <div key={label} className="rounded-2xl bg-[#111113] border border-white/6 px-6 py-5">
                  <p className="text-3xl font-black text-white mb-0.5">{value}</p>
                  <p className="text-xs text-white/30 font-medium">{label}</p>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── Player Tag ── */}
        <div className="rounded-3xl bg-[#1c1c1f] px-6 py-7 sm:px-10 lg:px-14">
          <p className="text-xs font-bold tracking-[0.18em] text-white/30 uppercase mb-4">
            Find a Player
          </p>
          <div className="flex items-center bg-[#111113] border border-white/8 rounded-2xl focus-within:border-blue-500/50 transition-colors">
            <span className="text-base font-black text-blue-400 pl-5 select-none">#</span>
            <div className="relative flex-1">
              {userInput === "" && (
                <span className="absolute inset-0 flex items-center text-white/20 text-sm font-medium pointer-events-none px-3">
                  <ScrambleText texts={exampleTags} />
                </span>
              )}
              <input
                className="w-full py-4 px-3 text-sm font-semibold text-white outline-none bg-transparent"
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              className="m-1.5 px-4 sm:px-6 py-2.5 bg-blue-500 hover:bg-blue-400 active:scale-95 text-white text-xs font-bold tracking-widest rounded-xl transition-all cursor-pointer shrink-0"
            >
              SAVE
            </button>
          </div>

          {playerData && (
            <div className="mt-3 animate-[slideUp_0.3s_ease-out]">
              <div className="rounded-2xl bg-[#111113] border border-white/8 overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-base leading-tight">{playerData.name}</p>
                    <p className="text-white/30 text-xs font-medium mt-0.5">#{userInput.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black text-xl">{playerData.trophies.toLocaleString()}</p>
                    <p className="text-white/30 text-xs font-medium mt-0.5">trophies</p>
                  </div>
                </div>
                <div className="px-5 pb-4">
                  <button
                    onClick={() => router.push(`/player/${userInput}`)}
                    className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 active:scale-[0.98] text-white text-xs font-bold tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    VIEW PROFILE →
                  </button>
                </div>
              </div>
            </div>
          )}

          {notFound && (
            <div className="mt-3 animate-[slideUp_0.3s_ease-out]">
              <p className="text-center text-sm text-red-400/70 bg-red-500/8 px-5 py-3 rounded-2xl border border-red-500/12">
                Player not found. Check the tag and try again.
              </p>
            </div>
          )}
        </div>

        {/* ── Feature cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-3xl bg-[#1c1c1f] px-8 py-7">
              <Icon size={18} className="text-blue-400/70 mb-3" />
              <p className="text-sm font-bold text-white/70 mb-1">{label}</p>
              <p className="text-xs text-white/25 leading-snug">{desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
