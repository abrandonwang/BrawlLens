"use client"
import { useState, useEffect, useRef, Suspense } from "react"
import { ArrowUp, RotateCcw } from "lucide-react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="text-zinc-900 font-semibold dark:text-white">{children}</strong>,
  ul: ({ children }) => <ul className="mb-3 space-y-1">{children}</ul>,
  li: ({ children }) => (
    <li className="flex gap-2">
      <span className="text-zinc-400 mt-0.5 shrink-0 dark:text-white/30">—</span>
      <span>{children}</span>
    </li>
  ),
  a: ({ href, children }) => (
    <Link
      href={href ?? "/"}
      className="inline-flex items-center gap-1 text-[#FFD400] font-semibold border-b border-[#FFD400]/30 hover:border-[#FFD400] transition-colors"
    >
      {children}
    </Link>
  ),
}

interface Message {
  role: "user" | "assistant"
  content: string
}

function ChatPage() {
  const searchParams = useSearchParams()

  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const firedRef = useRef(false)

  useEffect(() => {
    const q = searchParams.get("q")
    if (q && !firedRef.current) {
      firedRef.current = true
      sendMessage(q)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
    if (!q || streaming) return
    setUserInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    sendMessage(q)
  }

  async function sendMessage(content: string) {
    const userMessage: Message = { role: "user", content }
    const history = [...messages, userMessage]
    setMessages(history)
    setStreaming(true)

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let fullText = ""

    setMessages([...history, { role: "assistant", content: "" }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      fullText += decoder.decode(value)
      setMessages([...history, { role: "assistant", content: fullText }])
    }

    setStreaming(false)
  }

  return (
    <main className="fixed top-[52px] left-0 right-0 bottom-0 flex flex-col bg-white dark:bg-[#111]">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
              <div className="relative w-10 h-10 flex items-center justify-center mb-6">
                <div className="absolute inset-0 border-2 rounded-full border-zinc-300 dark:border-white/20" />
                <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-white/30" />
              </div>
              <p className="text-zinc-500 text-sm mb-6 dark:text-white/50">What do you want to know?</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {[
                  "Best brawlers for Gem Grab",
                  "Show me #GRG0L2G's stats",
                  "Top players leaderboard",
                  "What counters Bibi?",
                  "Current map rotation",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setUserInput(s); textareaRef.current?.focus() }}
                    className="text-[11px] text-zinc-500 border border-black/8 bg-black/[0.03] px-3 py-1.5 hover:text-zinc-800 hover:border-black/15 transition-colors dark:text-white/35 dark:border-white/8 dark:bg-white/[0.03] dark:hover:text-white/70 dark:hover:border-white/15"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full border border-zinc-300 flex items-center justify-center shrink-0 mr-3 mt-0.5 dark:border-white/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-white/40" />
                </div>
              )}
              <div className={`max-w-[80%] text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-black/8 text-zinc-900 px-4 py-2.5 dark:bg-white/8 dark:text-white"
                  : "text-zinc-700 dark:text-white/70"
              }`}>
                {msg.role === "assistant" ? (
                  <>
                    <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                    {streaming && i === messages.length - 1 && (
                      <span className="inline-block w-1.5 h-4 bg-zinc-400 ml-0.5 animate-pulse align-middle dark:bg-white/40" />
                    )}
                  </>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-black/8 px-4 py-4 dark:border-white/8">
        <div className="max-w-2xl mx-auto">
          <div className="relative border border-black/10 bg-black/[0.04] focus-within:border-black/20 transition-colors flex items-center dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:border-white/20">
            <Link href="/" className="p-3 text-zinc-400 hover:text-zinc-600 transition-colors shrink-0 dark:text-white/25 dark:hover:text-white/50">
              <RotateCcw size={14} />
            </Link>
            <textarea
              ref={textareaRef}
              rows={1}
              value={userInput}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up..."
              className="flex-1 bg-transparent py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none resize-none leading-relaxed max-h-40 overflow-y-auto dark:text-white dark:placeholder:text-white/20"
            />
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim() || streaming}
              className="m-2 w-7 h-7 flex items-center justify-center bg-zinc-900 text-white disabled:bg-black/10 disabled:text-black/20 hover:bg-zinc-700 transition-colors shrink-0 dark:bg-white dark:text-black dark:disabled:bg-white/10 dark:disabled:text-white/20 dark:hover:bg-white/90"
            >
              <ArrowUp size={13} />
            </button>
          </div>
        </div>
      </div>

    </main>
  )
}

export default function Chat() {
  return (
    <Suspense>
      <ChatPage />
    </Suspense>
  )
}
