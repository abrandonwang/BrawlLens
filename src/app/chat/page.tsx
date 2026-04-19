"use client"
import { useState, useEffect, useRef, Suspense } from "react"
import { ArrowUp, RotateCcw } from "lucide-react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="text-zinc-900 font-semibold dark:text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-zinc-600 dark:text-zinc-400">{children}</em>,
  h2: ({ children }) => <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mt-5 mb-2 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mt-4 mb-1.5 first:mt-0">{children}</h3>,
  ul: ({ children }) => <ul className="mb-3 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 space-y-1 list-none counter-reset-none">{children}</ol>,
  li: ({ children, ...props }) => {
    const ordered = (props as { ordered?: boolean }).ordered
    return (
      <li className="flex gap-2 text-sm">
        <span className={`shrink-0 mt-0.5 ${ordered ? "text-zinc-400 dark:text-zinc-500 tabular-nums" : "text-zinc-300 dark:text-zinc-600"}`}>
          {ordered ? "" : "·"}
        </span>
        <span className="flex-1">{children}</span>
      </li>
    )
  },
  a: ({ href, children }) => (
    <Link
      href={href ?? "/"}
      className="font-semibold text-[#FFD400] hover:text-yellow-400 transition-colors"
    >
      {children}
    </Link>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-")
    if (isBlock) {
      return (
        <pre className="my-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 px-4 py-3 overflow-x-auto">
          <code className="text-xs text-zinc-700 dark:text-zinc-300 font-mono">{children}</code>
        </pre>
      )
    }
    return <code className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded px-1.5 py-0.5 font-mono">{children}</code>
  },
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-zinc-50 dark:bg-zinc-800/60">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">{children}</tbody>
  ),
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
      {children}
    </td>
  ),
  hr: () => <hr className="my-4 border-zinc-100 dark:border-zinc-800" />,
}

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTIONS = [
  "Best brawlers for Showdown?",
  "Top players in EU",
  "How does Jacky perform?",
]

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

    setMessages([...history, { role: "assistant", content: "" }])

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

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      fullText += decoder.decode(value, { stream: true })
      setMessages([...history, { role: "assistant", content: fullText }])
    }

    setStreaming(false)
  }

  const inputBar = (
    <div className="relative">
      <Link
        href="/"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors dark:text-zinc-600 dark:hover:text-zinc-400 z-10"
      >
        <RotateCcw size={13} />
      </Link>
      <textarea
        ref={textareaRef}
        rows={1}
        value={userInput}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        className="w-full bg-white border border-zinc-200 rounded-2xl pl-9 pr-12 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none resize-none leading-6 overflow-hidden max-h-48 overflow-y-auto transition-colors focus:border-zinc-300 shadow-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
      />
      <button
        onClick={handleSubmit}
        disabled={!userInput.trim() || streaming}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-900 text-white disabled:opacity-25 disabled:cursor-not-allowed hover:bg-zinc-700 transition-all active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        <ArrowUp size={14} />
      </button>
    </div>
  )

  if (messages.length === 0) {
    return (
      <main className="fixed top-[52px] left-0 right-0 bottom-0 flex flex-col items-center justify-center bg-white dark:bg-[#111] px-4">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <div className="w-10 h-10 rounded-full bg-[#FFD400] mx-auto mb-4 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white/40" />
            </div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
              How can I help you?
            </h1>
            <p className="text-sm text-zinc-400 dark:text-zinc-600 mt-1.5">
              Ask about brawlers, maps, leaderboards, or anything Brawl Stars.
            </p>
          </div>
          {inputBar}
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-3.5 py-2 rounded-xl border border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 hover:bg-zinc-50 transition-all dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="fixed top-[52px] left-0 right-0 bottom-0 flex flex-col bg-white dark:bg-[#111]">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-[#FFD400] shrink-0 mt-0.5 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                </div>
              )}
              <div className={`text-sm leading-7 ${
                msg.role === "user"
                  ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-100 px-4 py-2.5 rounded-2xl max-w-[80%]"
                  : "text-zinc-700 dark:text-zinc-300 max-w-[85%] pt-0.5"
              }`}>
                {msg.role === "assistant" ? (
                  <>
                    {streaming && i === messages.length - 1 && msg.content === "" ? (
                      <div className="space-y-2 py-0.5">
                        <div className="h-3 w-48 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                        <div className="h-3 w-32 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                      </div>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{msg.content}</ReactMarkdown>
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
      <div className="border-t border-zinc-100 dark:border-zinc-800/50 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          {inputBar}
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
