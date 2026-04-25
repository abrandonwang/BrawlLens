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
    <div style={{ position: "relative" }}>
      <Link
        href="/"
        style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", display: "flex", zIndex: 10, transition: "color 0.14s" }}
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
        style={{
          width: "100%",
          background: "var(--panel)",
          border: "1px solid var(--line-2)",
          borderRadius: 16,
          paddingLeft: 38,
          paddingRight: 48,
          paddingTop: 14,
          paddingBottom: 14,
          fontSize: 14,
          color: "var(--ink)",
          outline: "none",
          resize: "none",
          lineHeight: 1.5,
          overflow: "hidden",
          maxHeight: 192,
          overflowY: "auto",
          fontFamily: "inherit",
          boxShadow: "0 8px 24px -8px rgba(0,0,0,0.2)",
          transition: "border-color 0.16s",
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={!userInput.trim() || streaming}
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          width: 34,
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
          border: "none",
          background: !userInput.trim() || streaming ? "var(--line)" : "var(--accent)",
          color: !userInput.trim() || streaming ? "var(--ink-4)" : "#0A0A0B",
          cursor: !userInput.trim() || streaming ? "default" : "pointer",
          transition: "all 0.15s",
        }}
      >
        <ArrowUp size={14} />
      </button>
    </div>
  )

  return (
    <main className="fixed top-[80px] left-0 right-0 bottom-0 flex flex-col" style={{ background: "var(--bg)" }}>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center" style={{ paddingTop: "15vh" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "conic-gradient(from 220deg, var(--accent), var(--r-ultra), var(--hc-purple), var(--hc-blue), var(--accent))", marginBottom: 16, padding: 2, display: "grid", placeItems: "center" }}>
                <div style={{ width: "100%", height: "100%", borderRadius: 8, background: "var(--panel)", display: "grid", placeItems: "center" }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--accent)", opacity: 0.8 }} />
                </div>
              </div>
              <p className="bl-body" style={{ color: "var(--ink-3)", marginBottom: 20 }}>Ask about brawlers, maps, leaderboards, or anything Brawl Stars.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => sendMessage(s)} className="bl-btn bl-btn-ghost bl-btn-sm" style={{ borderRadius: 10 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "conic-gradient(from 220deg, var(--accent), var(--r-ultra), var(--hc-purple), var(--hc-blue), var(--accent))", flexShrink: 0, marginTop: 2, padding: 2, display: "grid", placeItems: "center" }}>
                  <div style={{ width: "100%", height: "100%", borderRadius: 6, background: "var(--panel)", display: "grid", placeItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", opacity: 0.9 }} />
                  </div>
                </div>
              )}
              <div className={`text-sm leading-7 ${
                msg.role === "user"
                  ? "max-w-[80%] px-4 py-2.5 rounded-2xl"
                  : "max-w-[85%] pt-0.5"
              }`} style={msg.role === "user" ? { background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--ink)", borderRadius: 18 } : { color: "var(--ink-2)" }}>
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

      <div style={{ borderTop: "1px solid var(--line)", background: "color-mix(in srgb, var(--panel) 90%, transparent)", backdropFilter: "blur(12px)", padding: "12px 16px" }}>
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
