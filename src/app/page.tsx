"use client"
import { useState, useEffect, useRef } from "react"
import { ArrowUp } from "lucide-react"

const suggestions = [
  "Show me #GRG0L2G's stats",
  "Best brawlers for Gem Grab",
  "Top players leaderboard",
]

export default function Home() {
  const [userInput, setUserInput] = useState("")
  const [mounted, setMounted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [streaming, setStreaming] = useState(false)

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

  async function handleSubmit() {
    if (!userInput.trim() || streaming) return
    
    const userMessage = { role: "user", content: userInput.trim() };
    const newMessage = [...messages, userMessage];
    setMessages(newMessage);
    setUserInput("");
    setStreaming(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify({ messages: newMessage }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    setMessages([...newMessage, { role: "assistant", content: "" }])

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      fullText += decoder.decode(value);
      setMessages([...newMessage, { role: "assistant", content: fullText }])
    }

    setStreaming(false)
  }

  return (
    <main className="flex-1 flex flex-col bg-[#111] overflow-hidden">
      <section className={`flex-1 flex flex-col items-center justify-center px-6 py-16 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>

        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-8 text-center">
          Ask me anything about <span className="text-[#FFD400]">Brawl</span> <span className="text-red-400">Stars</span>.
        </h1>

        <div className="w-full max-w-xl">

          {/* Suggestions */}
          <div className="mb-3 flex flex-wrap gap-2 justify-center">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setUserInput(s)}
                className="text-[11px] text-white/35 border border-white/8 bg-white/[0.03] px-3 py-1.5 hover:text-white/70 hover:border-white/15 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {messages.length > 0 && (
            <div className="w-full max-w-xl mb-6 space-y-3 overflow-y-auto max-h-[60vh]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl ${
                    msg.role === "user"
                      ? "bg-white/[0.08] text-white"
                      : "text-white/80"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="relative border border-white/10 bg-white/[0.04] focus-within:border-white/20 transition-colors">
            <textarea
              ref={textareaRef}
              rows={1}
              value={userInput}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything — player tag, brawler, map, club..."
              className="w-full bg-transparent px-4 py-4 pr-14 text-sm text-white placeholder:text-white/20 outline-none resize-none leading-relaxed max-h-40 overflow-y-auto"
            />
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim()}
              className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center bg-white text-black disabled:bg-white/10 disabled:text-white/20 hover:bg-white/90 transition-colors"
            >
              <ArrowUp size={14} />
            </button>
          </div>
        </div>

      </section>
    </main>
  )
}
