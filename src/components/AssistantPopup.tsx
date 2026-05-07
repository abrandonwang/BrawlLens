"use client"

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ChangeEvent } from "react"
import { ArrowUp, Plus, Square, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-[var(--ink)]">{children}</strong>,
  em: ({ children }) => <em className="italic text-[var(--ink-3)]">{children}</em>,
  h2: ({ children }) => <h2 className="mt-4 mb-1.5 text-[13px] font-semibold text-[var(--ink)] first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 mb-1 text-[12.5px] font-semibold text-[var(--ink-2)] first:mt-0">{children}</h3>,
  ul: ({ children }) => <ul className="mb-2.5 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2.5 list-none space-y-1">{children}</ol>,
  li: ({ children, ...props }) => {
    const ordered = (props as { ordered?: boolean }).ordered
    return (
      <li className="flex gap-2 text-[13px]">
        <span className={`mt-0.5 shrink-0 ${ordered ? "tabular-nums text-[var(--ink-4)]" : "text-[var(--ink-5)]"}`}>
          {ordered ? "" : "·"}
        </span>
        <span className="flex-1">{children}</span>
      </li>
    )
  },
  a: ({ href, children }) => (
    <Link href={href ?? "/"} className="font-medium text-[var(--ink)] underline underline-offset-2 hover:opacity-80">
      {children}
    </Link>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-")
    if (isBlock) {
      return (
        <pre className="my-2 overflow-x-auto rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2">
          <code className="font-mono text-[11.5px] text-[var(--ink-2)]">{children}</code>
        </pre>
      )
    }
    return <code className="rounded border border-[var(--line)] bg-[var(--panel-2)] px-1.5 py-0.5 font-mono text-[11.5px] text-[var(--ink)]">{children}</code>
  },
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-lg border border-[var(--line)]">
      <table className="w-full border-collapse text-[12px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[var(--panel-2)]">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-[var(--line)]">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-4)]">{children}</th>
  ),
  td: ({ children }) => (
    <td className="whitespace-nowrap px-3 py-2 text-[12px] text-[var(--ink-2)]">{children}</td>
  ),
  hr: () => <hr className="my-3 border-[var(--line)]" />,
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

const iconButtonClass = "grid size-[26px] shrink-0 cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent text-[var(--ink-3)] transition-[color,background,opacity] duration-150 hover:bg-[var(--hover-bg)] hover:text-[var(--ink)] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[var(--ink-3)]"
const sendButtonClass = "grid size-7 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-[var(--ink)] text-[var(--bg)] transition-[background,opacity] duration-150 disabled:cursor-default disabled:bg-[var(--line-2)] disabled:text-[var(--ink-4)]"

interface LandingData {
  player: { name: string; tag: string; trophies: number } | null
  map:    { name: string; mode: string } | null
  brawler: { name: string; id: number; winRate: number } | null
  club:   { name: string; tag: string; trophies: number } | null
}

interface Props {
  open: boolean
  onClose: () => void
  pendingQuery?: string | null
  onPendingConsumed?: () => void
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
        body: JSON.stringify({ messages: history }),
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
    fetch("/api/landing")
      .then(r => r.ok ? r.json() : null)
      .then((data: LandingData | null) => {
        if (cancelled || !data) return
        const next: string[] = []
        if (data.brawler) next.push(`Why is ${data.brawler.name} performing at ${data.brawler.winRate.toFixed(1)}% win rate?`)
        if (data.map) next.push(`Best brawlers on ${data.map.name}?`)
        if (data.player) next.push(`Look up player #${data.player.tag.replace(/^#/, "")}`)
        if (next.length) setSuggestions(next)
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

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[195] bg-transparent" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className="fixed right-[22px] bottom-[22px] z-[196] flex max-h-[min(640px,calc(100dvh-100px))] w-96 origin-bottom-right flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg)] shadow-[0_34px_84px_-40px_rgba(0,0,0,0.95),rgba(255,255,255,0.08)_0_0.5px_0_0_inset] animate-[assistantPanelIn_0.24s_cubic-bezier(0.2,0,0,1)] max-[700px]:right-3 max-[700px]:bottom-3 max-[700px]:w-[calc(100vw-24px)] max-[700px]:max-w-[360px] max-[700px]:max-h-[min(560px,calc(100dvh-96px))] max-[700px]:rounded-[14px] max-[380px]:right-2 max-[380px]:bottom-2 max-[380px]:w-[calc(100vw-16px)] max-[380px]:max-h-[min(540px,calc(100dvh-80px))]"
        role="dialog"
        aria-label="BrawlLens assistant"
        aria-modal="false"
      >
        <header className="flex items-center gap-2.5 border-b border-[var(--line)] bg-[var(--panel-2)] py-[11px] pr-3 pl-3.5 max-[380px]:py-2.5 max-[380px]:pr-2.5 max-[380px]:pl-3">
          <Image src="/ai-sparkle-512.png" alt="AI Assistant" width={28} height={28} className="assistant-header-logo" />
          <div className="flex min-w-0 flex-1 flex-col leading-[1.2]">
            <span className="text-[13px] font-semibold tracking-[-0.005em] text-[var(--ink)]">Assistant</span>
          </div>
          <button
            type="button"
            className={iconButtonClass}
            onClick={newChat}
            aria-label="New chat"
            disabled={messages.length === 0 && !streaming}
            title="New chat"
          >
            <Plus size={14} strokeWidth={1.9} />
          </button>
          <button type="button" className={iconButtonClass} onClick={onClose} aria-label="Close assistant" title="Close">
            <X size={14} strokeWidth={1.9} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3.5 pb-1.5 [-webkit-overflow-scrolling:touch] max-[380px]:px-3 max-[380px]:pt-3 max-[380px]:pb-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-start gap-1.5 px-1 pt-4 pb-[18px]">
              <div className="text-[16px] font-semibold tracking-[-0.012em] text-[var(--ink)]">What can I help with?</div>
              <div className="flex w-full flex-col items-stretch gap-1.5">
                {suggestions.map(s => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="block w-full cursor-pointer rounded-[9px] border border-[var(--line)] bg-[var(--panel-2)] px-2.5 py-2 text-left font-inherit text-[12.5px] text-[var(--ink-2)] transition-colors duration-150 hover:border-[var(--line-2)] hover:bg-[var(--hover-bg)] hover:text-[var(--ink)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[86%] break-words text-[13.5px] leading-normal tracking-[-0.005em] ${msg.role === "user" ? "rounded-[14px_14px_4px_14px] bg-[var(--ink)] px-3 py-2 text-[var(--bg)]" : "text-[var(--ink-2)]"}`}>
                {msg.role === "assistant" ? (
                  streaming && i === messages.length - 1 && msg.content === "" ? (
                    <div className="inline-flex items-center gap-1 py-1.5">
                      <span className="size-[5px] rounded-full bg-[var(--ink-4)] animate-[assistantDot_1.05s_ease-in-out_infinite]" />
                      <span className="size-[5px] rounded-full bg-[var(--ink-4)] animate-[assistantDot_1.05s_ease-in-out_0.12s_infinite]" />
                      <span className="size-[5px] rounded-full bg-[var(--ink-4)] animate-[assistantDot_1.05s_ease-in-out_0.24s_infinite]" />
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

        <div className="shrink-0 border-t border-[var(--line)] bg-[var(--bg)] px-3 pt-2.5 pb-3 max-[380px]:px-2.5 max-[380px]:pt-2 max-[380px]:pb-2.5">
          <div className="flex items-end gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] py-[7px] pr-[7px] pl-3.5 transition-colors duration-150 focus-within:border-[var(--line-2)]">
            <textarea
              ref={textareaRef}
              rows={1}
              value={userInput}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything…"
              className="max-h-[140px] min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent py-1.5 font-inherit text-[13.5px] leading-[1.45] text-[var(--ink)] outline-none appearance-none placeholder:text-[var(--ink-4)]"
            />
            {streaming ? (
              <button
                type="button"
                onClick={stopStreaming}
                className={sendButtonClass}
                aria-label="Stop"
                title="Stop"
              >
                <Square size={11} strokeWidth={0} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!userInput.trim()}
                className={sendButtonClass}
                aria-label="Send"
              >
                <ArrowUp size={13} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
