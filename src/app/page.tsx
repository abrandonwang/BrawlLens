"use client"
import { useState, useEffect, useRef } from "react"
import { ArrowUp } from "lucide-react"
import { useRouter } from "next/navigation"

const suggestions = [
  "Show me #GRG0L2G's stats",
  "Best brawlers for Gem Grab",
  "Top players leaderboard",
]

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
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-5xl rounded-3xl overflow-hidden flex flex-col items-center text-center px-6 sm:px-12 py-14 sm:py-20"
          style={{ backgroundImage: "url('/fonts/brawl-bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.5)" }}>
            Ask me anything{" "}
            <span className="text-white/80">about</span>
            <br />
            <span style={{ fontFamily: "Nougat", color: "#e8a800", textShadow: "0 2px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.6)" }}>BRAWL</span>{" "}
            <span style={{ fontFamily: "Nougat", textShadow: "0 2px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.6)" }} className="text-red-400">STARS</span>
          </h1>

          <p className="text-lg text-white mb-10" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>
            Stats, brawlers, maps, and leaderboards all in one place.
          </p>

          <div className="w-full max-w-2xl">
            <div className="mb-4 flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setUserInput(s)}
                  className="text-xs text-white/80 bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 hover:bg-white/30 hover:border-white/50 hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={1}
                value={userInput}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 sm:px-6 py-3 sm:py-[18px] pr-12 sm:pr-14 text-sm sm:text-base md:text-lg text-white placeholder:text-white/55 outline-none resize-none leading-5 overflow-hidden focus:border-white/50 focus:bg-white/25 transition-all"
              />
              <button
                onClick={handleSubmit}
                disabled={!userInput.trim()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/90 text-blue-600 rounded-lg disabled:bg-white/20 disabled:text-white/30 disabled:cursor-not-allowed hover:bg-white hover:scale-105 active:scale-95 transition-all"
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
