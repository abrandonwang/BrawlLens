"use client"
import { useState, useEffect, useRef, Suspense } from "react"
import { ArrowUp } from "lucide-react"
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
    <Link href={href ?? "/"} className="font-semibold text-[#FFD400] hover:text-yellow-400 transition-colors">
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
  thead: ({ children }) => <thead className="bg-zinc-50 dark:bg-zinc-800/60">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">{children}</tbody>,
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

  return (
    <main className="fixed top-[80px] left-0 right-0 bottom-0 flex flex-col" style={{ background: "var(--bg)" }}>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

          {/* Greeting — always shown */}
          <div style={{ fontSize: 14, lineHeight: 1.75, color: "var(--ink-2)" }}>
            What can I help you with today?
          </div>

          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                fontSize: 14,
                lineHeight: 1.75,
                maxWidth: msg.role === "user" ? "80%" : "85%",
                paddingTop: msg.role === "user" ? undefined : 2,
                ...(msg.role === "user" ? {
                  background: "var(--panel-2)",
                  border: "1px solid var(--line)",
                  color: "var(--ink)",
                  borderRadius: 18,
                  padding: "10px 16px",
                } : {
                  color: "var(--ink-2)",
                }),
              }}>
                {msg.role === "assistant" ? (
                  streaming && i === messages.length - 1 && msg.content === "" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 2 }}>
                      <div style={{ height: 12, width: 192, borderRadius: 999, background: "var(--line-2)", animation: "pulse 1.5s ease-in-out infinite" }} />
                      <div style={{ height: 12, width: 128, borderRadius: 999, background: "var(--line-2)", animation: "pulse 1.5s ease-in-out infinite" }} />
                    </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{msg.content}</ReactMarkdown>
                  )
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
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "var(--panel)", border: "1px solid var(--line-2)", borderRadius: 16, padding: "10px 10px 10px 16px", boxShadow: "0 8px 24px -8px rgba(0,0,0,0.2)", transition: "border-color 0.16s" }}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={userInput}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                fontSize: 16,
                color: "var(--ink)",
                outline: "none",
                resize: "none",
                lineHeight: 1.5,
                overflow: "hidden",
                maxHeight: 192,
                overflowY: "auto",
                fontFamily: "inherit",
                WebkitAppearance: "none",
                paddingTop: 5,
                paddingBottom: 5,
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim() || streaming}
              style={{
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                border: "none",
                flexShrink: 0,
                background: !userInput.trim() || streaming ? "var(--line)" : "var(--accent)",
                color: !userInput.trim() || streaming ? "var(--ink-4)" : "#0A0A0B",
                cursor: !userInput.trim() || streaming ? "default" : "pointer",
                transition: "all 0.15s",
              }}
            >
              <ArrowUp size={14} />
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
