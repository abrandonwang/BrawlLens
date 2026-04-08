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
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-32">
        <div className="w-full max-w-2xl flex flex-col items-center text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.1] mb-4">
            Ask me anything{" "}
            <span className="text-zinc-400">about</span>
            <br />
            <span style={{ fontFamily: "Nougat", color: "#e8a800" }}>BRAWL</span>{" "}
            <span style={{ fontFamily: "Nougat" }} className="text-red-500">STARS</span>
          </h1>

          <p className="text-base text-zinc-500 dark:text-white/50 mb-10">
            Stats, brawlers, maps, and leaderboards all in one place.
          </p>

          <div className="w-full max-w-xl">
            <div className="mb-3 flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setUserInput(s)}
                  className="text-[11px] text-zinc-500 bg-white border border-zinc-200 px-3 py-1.5 rounded-full hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-700 transition-colors dark:bg-zinc-900 dark:border-zinc-700 dark:text-white/50 dark:hover:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:text-white/70"
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
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 sm:px-5 py-3 sm:py-[14px] pr-12 text-sm sm:text-[15px] text-zinc-900 placeholder:text-zinc-400 outline-none resize-none leading-5 overflow-hidden shadow-sm focus:border-zinc-300 focus:shadow-md transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-700"
              />
              <button
                onClick={handleSubmit}
                disabled={!userInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-zinc-900 text-white rounded-lg disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all dark:bg-white dark:text-zinc-900 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 dark:hover:bg-zinc-300"
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
