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
      className="inline-flex items-center gap-1 text-red-500 dark:text-[#FFD400] font-semibold border-b border-red-500/30 dark:border-[#FFD400]/30 hover:border-red-500 dark:hover:border-[#FFD400] transition-colors"
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

    let res: Response
    try {
      res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      })
    } catch {
      setMessages([...history, { role: "assistant", content: "Something went wrong. Please try again." }])
      setStreaming(false)
      return
    }

    if (!res.ok) {
      setMessages([...history, { role: "assistant", content: "Something went wrong. Please try again." }])
      setStreaming(false)
      return
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let fullText = ""

    setMessages([...history, { role: "assistant", content: "" }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      fullText += decoder.decode(value, { stream: true })
      setMessages([...history, { role: "assistant", content: fullText }])
    }

    setStreaming(false)
  }

  const inputBox = (placeholder: string) => (
    <div className="relative">
      <Link href="/" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors dark:text-zinc-500 dark:hover:text-zinc-300">
        <RotateCcw size={14} />
      </Link>
      <textarea
        ref={textareaRef}
        rows={1}
        value={userInput}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-12 py-3 sm:py-[14px] text-sm sm:text-[15px] text-zinc-900 placeholder:text-zinc-400 outline-none resize-none leading-5 overflow-hidden max-h-40 overflow-y-auto shadow-sm focus:border-zinc-300 focus:shadow-md transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-700"
      />
      <button
        onClick={handleSubmit}
        disabled={!userInput.trim() || streaming}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-zinc-900 text-white rounded-lg disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all dark:bg-white dark:text-zinc-900 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 dark:hover:bg-zinc-300"
      >
        <ArrowUp size={14} />
      </button>
    </div>
  )

  if (messages.length === 0) {
    return (
      <main className="fixed top-[52px] left-0 right-0 bottom-0 flex flex-col items-center justify-center bg-white dark:bg-[#111] px-4">
        <div className="w-full max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-4 text-center">Your Brawl Stars AI agent</h1>
          {inputBox("Ask about players, brawlers, maps, clubs...")}
        </div>
      </main>
    )
  }

  return (
    <main className="fixed top-[52px] left-0 right-0 bottom-0 flex flex-col bg-white dark:bg-[#111]">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-5 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-zinc-300 flex items-center justify-center shrink-0 mr-2 sm:mr-3 mt-0.5 dark:border-white/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-white/40" />
                </div>
              )}
              <div className={`max-w-[88%] sm:max-w-[80%] text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-black/8 text-zinc-900 px-3 sm:px-4 py-2 sm:py-2.5 dark:bg-white/8 dark:text-white"
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
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        <div className="max-w-2xl mx-auto">
          {inputBox("Ask a follow-up...")}
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
