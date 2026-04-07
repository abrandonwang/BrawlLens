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
    <main className="flex-1 flex flex-col overflow-hidden">
      <section className={`flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>

        <div className="w-full max-w-xl px-0 sm:px-8 py-6 sm:py-10">
        <div className="mb-6 sm:mb-8 text-center">
          <p className="text-sm sm:text-base font-medium text-zinc-600 dark:text-white/60 mb-1">Ask me anything about</p>
          <p className="text-3xl md:text-4xl leading-none">
            <span style={{ fontFamily: "Nougat", color: "#e8a800", WebkitTextStroke: "2px rgba(0,0,0)" }}>BRAWL</span>
            {" "}
            <span style={{ fontFamily: "Nougat", WebkitTextStroke: "2px rgba(0,0,0)" }} className="text-red-500">STARS</span>.
          </p>
        </div>

        <div className="w-full">
          {/* Suggestions */}
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

          {/* Input */}
          <div className="relative border border-black/10 bg-black/[0.04] focus-within:border-black/20 transition-colors dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:border-white/20">
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
