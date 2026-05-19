"use client"

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ChangeEvent } from "react"
import { ArrowUp, RotateCcw, Square, X } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"

const markdownComponents: Components = {
  p: ({ children }) => <p className="bl-ai-p">{children}</p>,
  strong: ({ children }) => <strong className="bl-ai-strong">{children}</strong>,
  em: ({ children }) => <em className="bl-ai-em">{children}</em>,
  h2: ({ children }) => <h2 className="bl-ai-h2">{children}</h2>,
  h3: ({ children }) => <h3 className="bl-ai-h3">{children}</h3>,
  ul: ({ children }) => <ul className="bl-ai-ul">{children}</ul>,
  ol: ({ children }) => <ol className="bl-ai-ol">{children}</ol>,
  li: ({ children, ...props }) => {
    const ordered = (props as { ordered?: boolean }).ordered
    return (
      <li className="bl-ai-li">
        <span className={`bl-ai-li-marker ${ordered ? "bl-ai-li-ordered" : ""}`}>
          {ordered ? "" : "·"}
        </span>
        <span className="bl-ai-li-content">{children}</span>
      </li>
    )
  },
  a: ({ href, children }) => (
    <Link href={href ?? "/"} className="bl-ai-link">
      {children}
    </Link>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-")
    if (isBlock) {
      return (
        <pre className="bl-ai-pre">
          <code className="bl-ai-code-block">{children}</code>
        </pre>
      )
    }
    return <code className="bl-ai-code-inline">{children}</code>
  },
  table: ({ children }) => (
    <div className="bl-ai-table-wrap">
      <table className="bl-ai-table">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bl-ai-thead">{children}</thead>,
  tbody: ({ children }) => <tbody className="bl-ai-tbody">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => <th className="bl-ai-th">{children}</th>,
  td: ({ children }) => <td className="bl-ai-td">{children}</td>,
  hr: () => <hr className="bl-ai-hr" />,
}

interface Message {
  role: "user" | "assistant"
  content: string
}

const FALLBACK_SUGGESTIONS = [
  "What's the strongest brawler right now?",
  "Which map is most played this week?",
  "How is win rate calculated?",
]

interface LandingData {
  player: { name: string; tag: string; trophies: number } | null
  map:    { name: string; mode: string } | null
  brawler: { name: string; id: number; winRate: number } | null
  club:   { name: string; tag: string; trophies: number } | null
}

interface PageTableContext {
  caption?: string
  headers: string[]
  rows: string[][]
}

interface PageLinkContext {
  text: string
  href: string
}

interface PageContext {
  url: string
  path: string
  title: string
  headings: string[]
  stats: string[]
  tables: PageTableContext[]
  links: PageLinkContext[]
  visibleText: string
}

interface Props {
  open: boolean
  onClose: () => void
  pendingQuery?: string | null
  onPendingConsumed?: () => void
}

function compactText(value: string, maxLength = 220) {
  const text = value.replace(/\s+/g, " ").trim()
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}…` : text
}

function uniqueCompact(values: string[], limit: number) {
  const seen = new Set<string>()
  const next: string[] = []
  for (const value of values) {
    const compact = compactText(value)
    if (!compact || seen.has(compact)) continue
    seen.add(compact)
    next.push(compact)
    if (next.length >= limit) break
  }
  return next
}

function isElementVisible(element: Element) {
  if (!(element instanceof HTMLElement)) return true
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)
  return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden"
}

function textFromElement(element: Element, maxLength = 220) {
  return compactText(element.textContent ?? "", maxLength)
}

function collectVisibleTables(root: Element): PageTableContext[] {
  return Array.from(root.querySelectorAll("table"))
    .filter(isElementVisible)
    .slice(0, 4)
    .map(table => {
      const caption = table.querySelector("caption")
      const headers = uniqueCompact(
        Array.from(table.querySelectorAll("thead th, thead td")).map(cell => textFromElement(cell, 90)),
        10,
      )
      const rows = Array.from(table.querySelectorAll("tbody tr, tr"))
        .filter(isElementVisible)
        .slice(0, 12)
        .map(row => Array.from(row.querySelectorAll("th, td")).map(cell => textFromElement(cell, 90)).filter(Boolean))
        .filter(row => row.length > 0)
      return {
        caption: caption ? textFromElement(caption, 140) : undefined,
        headers,
        rows,
      }
    })
    .filter(table => table.headers.length > 0 || table.rows.length > 0)
}

function collectPageContext(): PageContext | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null

  const root = document.querySelector("main") ?? document.body
  if (!root) return null

  const textClone = root.cloneNode(true) as Element
  textClone.querySelectorAll("script, style, noscript, nav, [role='dialog'], input, textarea").forEach(node => node.remove())

  const headings = uniqueCompact(
    Array.from(root.querySelectorAll("h1, h2, h3"))
      .filter(isElementVisible)
      .map(heading => textFromElement(heading, 140)),
    12,
  )

  const stats = uniqueCompact(
    Array.from(root.querySelectorAll("[data-ai-context], .bl-bd-stat, .bl-md-kpi, .bl-map-hero-pill, .bl-lb-podium-card, .bl-profile-stat, .bl-card-stat, .bl-tier-card-stat"))
      .filter(isElementVisible)
      .map(node => textFromElement(node, 180)),
    24,
  )

  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .filter(isElementVisible)
    .map(link => ({
      text: textFromElement(link, 90),
      href: link.href,
    }))
    .filter(link => link.text)
    .slice(0, 28)

  return {
    url: window.location.href,
    path: `${window.location.pathname}${window.location.search}`,
    title: document.title,
    headings,
    stats,
    tables: collectVisibleTables(root),
    links,
    visibleText: compactText(textClone.textContent ?? "", 4200),
  }
}

function suggestionsForCurrentPage() {
  const context = collectPageContext()
  if (!context) return []

  const primaryHeading = context.headings[0]?.replace(/\s+(Map|Brawler|Stats|Tier List).*$/i, "").trim()
  if (context.path.startsWith("/meta/") && primaryHeading) {
    return [
      `Best brawlers on ${primaryHeading}?`,
      `Summarize this map's meta.`,
      "Which picks have enough games to trust?",
    ]
  }

  if (context.path.startsWith("/brawlers/") && primaryHeading) {
    return [
      `What are ${primaryHeading}'s best maps?`,
      `Summarize ${primaryHeading}'s performance.`,
      "Where should I use this brawler?",
    ]
  }

  if (context.path.startsWith("/leaderboards")) {
    return [
      "Summarize this leaderboard.",
      "Who stands out on this page?",
      "What should I click next?",
    ]
  }

  if (context.path.startsWith("/meta")) {
    return [
      "Which maps have the most data?",
      "What map should I inspect first?",
      "Summarize the current maps page.",
    ]
  }

  if (context.path.startsWith("/brawlers")) {
    return [
      "Who are the strongest brawlers here?",
      "Which brawler should I inspect first?",
      "Summarize this brawler tier list.",
    ]
  }

  return []
}

export default function AssistantPopup({ open, onClose, pendingQuery, onPendingConsumed }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(FALLBACK_SUGGESTIONS)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const wasOpenRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = { role: "user", content }
    const history = [...messages, userMessage]
    setMessages(history)
    setStreaming(true)
    setMessages([...history, { role: "assistant", content: "" }])

    const controller = new AbortController()
    abortRef.current = controller

    let res: Response
    try {
      res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, pageContext: collectPageContext() }),
        signal: controller.signal,
      })
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setStreaming(false)
        abortRef.current = null
        return
      }
      setMessages([...history, { role: "assistant", content: "Something went wrong. Please try again." }])
      setStreaming(false)
      abortRef.current = null
      return
    }

    if (!res.ok) {
      setMessages([...history, { role: "assistant", content: "Something went wrong. Please try again." }])
      setStreaming(false)
      abortRef.current = null
      return
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let fullText = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setMessages([...history, { role: "assistant", content: fullText }])
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMessages([...history, { role: "assistant", content: fullText || "Stream interrupted." }])
      }
    }

    setStreaming(false)
    abortRef.current = null
  }, [messages])

  function stopStreaming() {
    abortRef.current?.abort()
  }

  function newChat() {
    stopStreaming()
    setMessages([])
    setUserInput("")
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 220)
    }
    wasOpenRef.current = open
  }, [open])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const pageSuggestions = suggestionsForCurrentPage()
    if (pageSuggestions.length) {
      setSuggestions(pageSuggestions)
    } else {
      setSuggestions(FALLBACK_SUGGESTIONS)
    }

    fetch("/api/landing")
      .then(r => r.ok ? r.json() : null)
      .then((data: LandingData | null) => {
        if (cancelled || !data) return
        const next: string[] = []
        if (data.brawler) next.push(`Why is ${data.brawler.name} performing at ${data.brawler.winRate.toFixed(1)}% win rate?`)
        if (data.map) next.push(`Best brawlers on ${data.map.name}?`)
        if (data.player) next.push(`Look up player #${data.player.tag.replace(/^#/, "")}`)
        if (next.length) {
          setSuggestions(current => uniqueCompact([...(pageSuggestions.length ? pageSuggestions : current), ...next], 3))
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [open])

  useEffect(() => {
    if (open && pendingQuery && !streaming) {
      sendMessage(pendingQuery)
      onPendingConsumed?.()
    }
  }, [open, pendingQuery, streaming, sendMessage, onPendingConsumed])

  useEffect(() => {
    if (messages.length === 0) return
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key === "Tab") {
        const panel = panelRef.current
        if (!panel) return
        const focusables = Array.from(
          panel.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter(el => !el.hasAttribute("aria-hidden"))
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        } else if (active && !panel.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  function handleInput(e: ChangeEvent<HTMLTextAreaElement>) {
    setUserInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
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

  function handleSuggestion(text: string) {
    if (streaming) return
    sendMessage(text)
  }

  if (!open) return null

  const hasMessages = messages.length > 0

  return (
    <div className="bl-ai-layer" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bl-ai-backdrop" />
      <div ref={panelRef} className="bl-ai-panel" role="dialog" aria-label="BrawlLens AI" aria-modal="true">
        {/* Header */}
        <div className="bl-ai-header">
          <div className="bl-ai-header-left">
            <span className="bl-ai-title">AI</span>
            <span className="bl-ai-subtitle">Ask anything about the meta</span>
          </div>
          <div className="bl-ai-header-actions">
            {hasMessages && (
              <button type="button" onClick={newChat} className="bl-ai-header-btn" aria-label="New chat" title="New chat">
                <RotateCcw size={13} strokeWidth={2} />
              </button>
            )}
            <button type="button" onClick={onClose} className="bl-ai-header-btn" aria-label="Close" title="Close">
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="bl-ai-body">
          {!hasMessages && (
            <div className="bl-ai-empty">
              <div className="bl-ai-empty-heading">What can I help with?</div>
              <div className="bl-ai-suggestions">
                {suggestions.map(s => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="bl-ai-suggestion"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`bl-ai-msg ${msg.role === "user" ? "bl-ai-msg-user" : "bl-ai-msg-assistant"}`}>
              <div className={`bl-ai-msg-bubble ${msg.role === "user" ? "bl-ai-bubble-user" : "bl-ai-bubble-assistant"}`}>
                {msg.role === "assistant" ? (
                  streaming && i === messages.length - 1 && msg.content === "" ? (
                    <div className="bl-ai-dots">
                      <span />
                      <span />
                      <span />
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

        {/* Input */}
        <div className="bl-ai-input-area">
          <div className="bl-ai-input-row">
            <textarea
              ref={textareaRef}
              rows={1}
              value={userInput}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="bl-ai-textarea"
            />
            {streaming ? (
              <button type="button" onClick={stopStreaming} className="bl-ai-send" aria-label="Stop">
                <Square size={11} strokeWidth={0} fill="currentColor" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={!userInput.trim()} className="bl-ai-send" aria-label="Send">
                <ArrowUp size={14} strokeWidth={2.4} />
              </button>
            )}
          </div>
          <span className="bl-ai-hint">Press Esc to close</span>
        </div>
      </div>
    </div>
  )
}
