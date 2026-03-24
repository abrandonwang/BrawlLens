"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const [userInput, setUserInput] = useState("")
  const router = useRouter()

  function handleSearch() {
    const tag = userInput.trim().replace(/^#/, "")
    if (tag) router.push(`/player/${tag}`)
  }

  return (
    <main className="flex-1 bg-[#fcfdfe] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-10 pt-24 pb-6">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          {/* LEFT: HEADLINE */}
          <div className="lg:col-span-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-6">
              Brawl Stars Analytics
            </p>
            <h1 className="text-[72px] md:text-[96px] font-black leading-[0.88] tracking-tighter text-zinc-900">
              Master the Arena.
            </h1>
            <div className="w-10 h-[3px] bg-[#FFD400] rounded-full my-7" />
            <p className="text-zinc-400 text-base font-medium leading-relaxed">
              Real-time stats, rankings, and brawler analysis<br />for competitive Brawl Stars players.
            </p>
          </div>

          {/* RIGHT: SEARCH + CARDS */}
          <div className="lg:col-span-6 space-y-6">

            {/* SEARCH BOX */}
            <div>
              <div className="flex items-center bg-white border border-zinc-200 rounded-2xl px-5 py-3 shadow-sm focus-within:border-zinc-400 transition-colors">
                <span className="text-zinc-400 font-black text-xl mr-2">#</span>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Enter player tag"
                  className="flex-1 bg-transparent py-2 text-lg font-bold outline-none text-zinc-950 placeholder:text-zinc-300 tracking-tight"
                />
                <button
                  onClick={handleSearch}
                  className="bg-[#FFD400] text-zinc-900 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ECC000] transition-colors shrink-0"
                >
                  Search
                </button>
              </div>
              <p className="mt-3 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">
                Tap your profile icon in-game to find your tag
              </p>
            </div>

            {/* STATS CARDS */}
            <div className="flex gap-4 pt-2">

              {/* Win Rate */}
              <div className="flex-1 bg-white p-5 rounded-[28px] border border-zinc-100 shadow-sm">
                <div className="h-20 bg-[#FFD400]/15 rounded-xl flex flex-col justify-end p-3 mb-4">
                  <span className="text-3xl font-black text-zinc-800 leading-none">85%</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-0.5">Win Rate</span>
                </div>
                <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Top Brawlers</p>
                <div className="flex -space-x-2">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 border-2 border-white" />
                  <div className="w-9 h-9 rounded-xl bg-zinc-200 border-2 border-white" />
                </div>
              </div>

              {/* Meta */}
              <div className="flex-1 bg-white p-5 rounded-[28px] border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 mb-3">
                  <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#FFF5C0" strokeWidth="4" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#FFD400" strokeWidth="4" strokeDasharray="65, 100" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-[9px] font-black uppercase text-zinc-300 tracking-widest">Current Meta</span>
                <span className="text-sm font-black text-zinc-700 mt-0.5">Duo Showdown</span>
              </div>

              {/* Global Rank */}
              <div className="flex-1 bg-white p-5 rounded-[28px] border border-zinc-100 shadow-sm">
                <div className="h-10 bg-[#FFD400] rounded-xl flex items-center justify-center text-xs font-black tracking-widest mb-5">
                  TOP 5%
                </div>
                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Global Rank</span>
                <div className="mt-2 w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">🏆</div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
