"use client"
import { useState, useEffect, useRef } from "react"
import { ArrowUp } from "lucide-react"
import { useRouter } from "next/navigation"

const suggestions = [
  "Show me #GRG0L2G's stats",
  "Best brawlers for Gem Grab",
  "Top players leaderboard",
]

function PlusMarker({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute z-10 text-zinc-400 dark:text-white/40 text-[14px] font-light select-none pointer-events-none leading-none ${className}`}
      style={{ transform: "translate(-50%, -50%)" }}
    >
      +
    </span>
  )
}

export default function Home() {
  const [userInput, setUserInput] = useState("")
  const [mounted, setMounted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setUserInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleSubmit() {
    const q = userInput.trim()
    if (!q) return
    router.push(`/chat?q=${encodeURIComponent(q)}`)
  }

  return (
    <main className={`flex-1 flex flex-col transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center border-y border-black/[0.08] dark:border-white/[0.08] px-6 sm:px-12 py-28 mx-auto w-full max-w-[1400px] border-x">
        
        {/* Vercel-style Vertical Grid Lines */}
        <div className="absolute inset-0 grid grid-cols-4 sm:grid-cols-10 pointer-events-none">
          {[...Array(9)].map((_, i) => (
            <div 
              key={i} 
              className="border-r border-black/[0.04] dark:border-white/[0.04] h-full" 
            />
          ))}
        </div>

        {/* Vercel-style Horizontal Grid Lines */}
        <div className="absolute inset-0 flex flex-col pointer-events-none">
           <div className="h-1/4 border-b border-black/[0.04] dark:border-white/[0.04]" />
           <div className="h-1/4 border-b border-black/[0.04] dark:border-white/[0.04]" />
           <div className="h-1/4 border-b border-black/[0.04] dark:border-white/[0.04]" />
           <div className="h-1/4" />
        </div>

        {/* Corner plus markers positioned exactly on the container borders */}
        <PlusMarker className="top-0 left-0" />
        <PlusMarker className="top-0 right-0" />
        <PlusMarker className="bottom-0 left-0" />
        <PlusMarker className="bottom-0 right-0" />

        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-[72px] font-black tracking-tight text-zinc-900 dark:text-white leading-[1.05] mb-5">
            Ask me anything<br className="hidden sm:block" />{" "}about{" "}
            <span style={{ fontFamily: "Nougat", color: "#e8a800", WebkitTextStroke: "2px rgba(0,0,0)" }}>BRAWL</span>
            {" "}
            <span style={{ fontFamily: "Nougat", WebkitTextStroke: "2px rgba(0,0,0)" }} className="text-red-500">STARS</span>
            .
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-zinc-500 dark:text-white/45 mb-10 max-w-sm">
            Stats, brawlers, maps, and leaderboards all in one place.
          </p>

          {/* Search area */}
          <div className="w-full max-w-xl">
            <div className="mb-3 flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setUserInput(s)}
                  className="text-[11px] text-zinc-500 border border-black/8 bg-black/[0.03] px-3 py-1.5 hover:text-zinc-800 hover:border-black/15 transition-colors dark:text-white/35 dark:border-white/8 dark:bg-white/[0.03] dark:hover:text-white/70 dark:hover:border-white/15"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="relative border border-black/10 bg-white/50 backdrop-blur-sm focus-within:border-black/20 transition-colors dark:border-white/10 dark:bg-black/20 dark:focus-within:border-white/20">
              <textarea
                ref={textareaRef}
                rows={1}
                value={userInput}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask about players, brawlers, maps, clubs..."
                className="w-full bg-transparent px-4 py-3.5 sm:py-4 pr-14 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none resize-none leading-relaxed max-h-40 overflow-y-auto dark:text-white dark:placeholder:text-white/20"
              />
              <button
                onClick={handleSubmit}
                disabled={!userInput.trim()}
                className="absolute right-3 bottom-2.5 sm:bottom-3 w-8 h-8 flex items-center justify-center bg-zinc-900 text-white disabled:bg-black/10 disabled:text-black/20 hover:bg-zinc-700 transition-colors dark:bg-white dark:text-black dark:disabled:bg-white/10 dark:disabled:text-white/20 dark:hover:bg-white/90"
              >
                <ArrowUp size={14} />
              </button>
            </div>
          </div>

        </div>
      </section>

    </main>
  )
}