"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

const marqueeItems = [
  "Real-time Stats",
  "80+ Brawlers",
  "No Account Required",
  "Live Rankings",
  "Free Forever",
  "Brawl Stars API",
  "All Rarities",
  "Trophy Tracking",
]

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

const slideUp = {
  hidden: { y: "110%", opacity: 0 },
  show: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.8, ease: "easeOut" as const },
  },
}

export default function Home() {
  const [userInput, setUserInput] = useState("")
  const router = useRouter()

  function handleSearch() {
    const tag = userInput.trim().replace(/^#/, "")
    if (tag) router.push(`/player/${tag}`)
  }

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden bg-[#fcfdfe]">

      {/* Ambient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* HERO */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20">
        <div className="w-full max-w-[640px] mx-auto text-center">

          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-zinc-200 bg-white/70 backdrop-blur-sm mb-10"
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
              Live · Brawl Stars API
            </span>
          </motion.div>

          {/* Headline — per-line stagger */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="mb-8"
          >
            {["Master the", "Arena."].map((line, i) => (
              <div key={i} className="overflow-hidden leading-none">
                <motion.h1
                  variants={slideUp}
                  className="text-[72px] sm:text-[96px] md:text-[118px] font-black tracking-tighter text-zinc-950 leading-[0.88] block"
                >
                  {line}
                </motion.h1>
              </div>
            ))}
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-zinc-400 text-base sm:text-lg font-medium leading-relaxed max-w-sm mx-auto mb-10"
          >
            Real-time stats and brawler analysis for competitive Brawl Stars players.
          </motion.p>

          {/* Search container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center bg-white border border-zinc-200 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-sm focus-within:border-zinc-400 transition-colors">
              <span className="text-zinc-400 font-black text-lg sm:text-xl mr-2 shrink-0">#</span>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter player tag"
                className="flex-1 min-w-0 bg-transparent py-1.5 sm:py-2 text-base sm:text-xl font-bold outline-none text-zinc-950 placeholder:text-zinc-300 tracking-tight"
              />
              <button
                onClick={handleSearch}
                className="bg-zinc-950 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-black active:scale-95 transition-all shrink-0"
              >
                Search
              </button>
            </div>
            <p className="mt-3 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] text-center">
              Tap your profile icon in-game to find your tag
            </p>
          </motion.div>

        </div>
      </section>

      {/* Marquee strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="relative z-10 border-t border-zinc-100 overflow-hidden py-4"
      >
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#fcfdfe] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#fcfdfe] to-transparent z-10" />

        <div className="marquee-outer flex">
          <div className="marquee-inner flex items-center gap-10 shrink-0">
            {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
              <div key={i} className="flex items-center gap-3 shrink-0">
                <div className="w-1 h-1 rounded-full bg-zinc-300" />
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-400 whitespace-nowrap">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

    </main>
  )
}
