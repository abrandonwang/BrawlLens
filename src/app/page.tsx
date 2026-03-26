"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import FluidBackground from "@/components/FluidBackground"

// Brawlify CDN portrait IDs
const BRAWLER_IDS = [
  16000000, 16000001, 16000002, 16000003, 16000006, 16000008,
  16000009, 16000011, 16000012, 16000013, 16000014, 16000015,
  16000016, 16000017, 16000018, 16000019, 16000020, 16000021,
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

  useEffect(() => {
    document.body.classList.add("home-page")
    return () => document.body.classList.remove("home-page")
  }, [])

  function handleSearch() {
    const tag = userInput.trim().replace(/^#/, "")
    if (tag) router.push(`/player/${tag}`)
  }

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden">

      <FluidBackground />


      {/* CONTENT LAYER */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-[640px] mx-auto text-center">

          {/* Headline */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="mb-8">
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
            className="text-zinc-600 text-base sm:text-lg font-medium leading-relaxed max-w-sm mx-auto mb-10"
          >
            Real-time stats and brawler analysis for competitive Brawl Stars players.
          </motion.p>

          {/* Search container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="group flex items-center bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-xl shadow-zinc-300/60 focus-within:border-zinc-400 focus-within:bg-white transition-all">
              <span className="text-zinc-400 font-black text-lg sm:text-xl mr-2 shrink-0">#</span>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter player tag"
                className="flex-1 min-w-0 bg-transparent py-1.5 sm:py-2 text-base sm:text-xl font-bold outline-none text-zinc-950 placeholder:text-zinc-300 placeholder:font-normal placeholder:tracking-normal tracking-tight"
              />
              <button
                onClick={handleSearch}
                className="bg-zinc-950 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-black active:scale-95 transition-all shrink-0"
              >
                Search
              </button>
            </div>
            <p className="mt-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] text-center">
              Tap your profile icon in-game to find your tag
            </p>
          </motion.div>

        </div>
      </section>

    </main>
  )
}