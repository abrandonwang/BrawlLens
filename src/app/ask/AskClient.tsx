"use client"

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowUp, Square } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import ChatLimitDialog from "@/components/ChatLimitDialog"
import { authHeaders } from "@/lib/clientAuth"
import { chatLimitFromResponse, type ChatLimitPayload } from "@/lib/aiLimits"

type AiMessage = {
  role: "user" | "assistant"
  content: string
}

const SUGGESTIONS = [
  { headline: "Tier check", prompt: "What's the current S-tier brawler for Brawl Ball?" },
  { headline: "Build me a kit", prompt: "Best Kenji build for ranked" },
  { headline: "Counter strategy", prompt: "Counter picks for Spike on Hot Potato" },
  { headline: "Pro scene", prompt: "Top pro players this season" },
] as const

const askInitialSendButtonClass =
  "grid size-9 shrink-0 place-items-center rounded-[8px] bg-[#FF6B6B] p-0 text-white outline-none transition-[background-color,opacity,transform] duration-150 hover:bg-[#6b4cff] focus-visible:ring-2 focus-visible:ring-[rgba(255, 107, 107,0.48)] disabled:cursor-default disabled:bg-[rgba(245,244,241,0.07)] disabled:text-[rgba(245,244,241,0.32)] active:translate-y-px"
const askComposerSendButtonClass =
  "grid size-10 shrink-0 place-items-center rounded-[8px] bg-[#FF6B6B] p-0 text-white outline-none transition-[background-color,opacity,transform] duration-150 hover:bg-[#6b4cff] focus-visible:ring-2 focus-visible:ring-[rgba(255, 107, 107,0.48)] disabled:cursor-default disabled:bg-[rgba(245,244,241,0.06)] disabled:text-[rgba(245,244,241,0.32)] active:translate-y-px"
const askComposerStopButtonClass =
  "grid size-10 shrink-0 place-items-center rounded-[8px] border border-[rgba(245,244,241,0.12)] bg-[rgba(245,244,241,0.06)] p-0 text-[#f5f4f1] outline-none transition-[background-color,border-color,color,transform] duration-150 hover:border-[rgba(245,244,241,0.2)] hover:bg-[rgba(245,244,241,0.1)] focus-visible:ring-2 focus-visible:ring-[rgba(255, 107, 107,0.48)] active:translate-y-px"

function normalizeChatMarkdown(content: string) {
  return content.replace(/\[(\/[^\]\s)]+)\](?!\()/g, "[$1]($1)")
}

const askMarkdownComponents: Components = {
  p: ({ children }) => <p className="mb-3 mt-0 last:mb-0">{children}</p>,
  h2: ({ children }) => <h2 className="mb-2 mt-5 text-[16px] font-[800] text-[#f5f4f1] first:mt-0 [font-family:var(--font-heading)]">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-[14px] font-[760] text-[rgba(245,244,241,0.92)] first:mt-0">{children}</h3>,
  strong: ({ children }) => <strong className="font-[780] text-[#ffffff]">{children}</strong>,
  ul: ({ children }) => <ul className="my-3 flex list-disc flex-col gap-1.5 pl-5 marker:text-[#FF9494]">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 flex list-decimal flex-col gap-1.5 pl-5 marker:text-[#FF9494]">{children}</ol>,
  li: ({ children }) => <li className="leading-[1.6]">{children}</li>,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-[10px] border border-[rgba(245,244,241,0.08)]">
      <table className="w-full min-w-[520px] border-collapse text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[rgba(245,244,241,0.05)]">{children}</thead>,
  tr: ({ children }) => <tr className="border-b border-[rgba(245,244,241,0.06)] last:border-b-0">{children}</tr>,
  th: ({ children }) => <th className="px-3 py-2 text-left text-[11px] font-[800] uppercase tracking-[0.04em] text-[rgba(245,244,241,0.58)]">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 align-top text-[rgba(245,244,241,0.82)]">{children}</td>,
  code: ({ children }) => <code className="rounded-[5px] border border-[rgba(245,244,241,0.08)] bg-[rgba(245,244,241,0.045)] px-1.5 py-px font-mono text-[0.92em] text-[rgba(245,244,241,0.86)]">{children}</code>,
  a: ({ children, href }) => {
    const url = href ?? "#"
    const isExternal = /^https?:\/\//i.test(url)
    return (
      <a
        href={url}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer" : undefined}
        className="break-words font-[720] text-[#b9a7ff] underline decoration-[rgba(255, 148, 148,0.42)] decoration-1 underline-offset-[3px] transition-colors hover:text-[#d8d0ff] hover:decoration-[#c4b5fd] focus-visible:rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(255, 148, 148,0.5)]"
      >
        {children}
      </a>
    )
  },
}

export default function AskClient() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q")?.trim() ?? ""
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [limitGate, setLimitGate] = useState<ChatLimitPayload | null>(null)
  const sentInitialRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (raw: string) => {
    const content = raw.trim()
    if (!content || streaming) return

    const userMessage: AiMessage = { role: "user", content }
    const history = [...messages, userMessage]
    setMessages([...history, { role: "assistant", content: "" }])
    setStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          pageContext: {
            url: window.location.href,
            path: window.location.pathname,
            title: document.title,
            headings: ["BrawlLens AI"],
            visibleText: "A minimal BrawlLens AI chat page.",
          },
        }),
        signal: controller.signal,
      })

      const gate = await chatLimitFromResponse(response)
      if (gate) {
        setMessages(history)
        setLimitGate(gate)
        return
      }

      if (!response.ok || !response.body) {
        setMessages([...history, { role: "assistant", content: "BrawlLens AI is not available right now." }])
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setMessages([...history, { role: "assistant", content: fullText }])
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setMessages([...history, { role: "assistant", content: "The stream was interrupted. Try again in a moment." }])
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [messages, streaming])

  useEffect(() => {
    if (!initialQuery || sentInitialRef.current) return
    sentInitialRef.current = true
    void sendMessage(initialQuery)
  }, [initialQuery, sendMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  function submitMessage() {
    const next = input.trim()
    if (!next || streaming) return
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    void sendMessage(next)
  }

  function handleInput(event: ChangeEvent<HTMLTextAreaElement>) {
    setInput(event.target.value)
    event.target.style.height = "auto"
    event.target.style.height = `${Math.min(event.target.scrollHeight, 200)}px`
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      submitMessage()
    }
  }

  function fillAndFocus(prompt: string) {
    setInput(prompt)
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.style.height = "auto"
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    })
  }

  const isEmpty = messages.length === 0

  return (
    <main className="bl-ask-shell relative flex min-h-[calc(100dvh-84px)] w-full flex-col bg-[#08080c] text-[#f5f4f1] [font-family:var(--font-ui)]">
      {isEmpty ? (
        <section className="mx-auto flex w-full max-w-[640px] flex-1 flex-col justify-center gap-3 px-4 pb-12 pt-6 max-[560px]:pb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submitMessage()
            }}
            className="w-full"
          >
            <div className="group relative isolate overflow-hidden rounded-[10px] border border-[rgba(245,244,241,0.10)] bg-[rgba(14,14,20,0.88)] shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_22px_54px_-38px_rgba(0,0,0,0.9)] transition-[border-color,box-shadow] duration-200 focus-within:border-[rgba(245,244,241,0.22)] focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.065),0_24px_58px_-42px_rgba(0,0,0,0.96)]">
              <textarea
                ref={textareaRef}
                rows={5}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                maxLength={500}
                placeholder="Ask anything about Brawl Stars..."
                aria-label="Message BrawlLens AI"
                className="block min-h-[174px] w-full resize-none border-0 bg-transparent px-4 pb-[60px] pt-4 text-[16px] font-[560] leading-[1.55] text-[#f5f4f1] outline-none placeholder:text-[rgba(245,244,241,0.40)] [font-family:var(--font-ui)] [scrollbar-width:thin] max-[560px]:min-h-[150px]"
                style={{ maxHeight: "220px" }}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end border-t border-[rgba(245,244,241,0.06)] bg-[linear-gradient(180deg,rgba(14,14,20,0.60),rgba(14,14,20,0.98))] px-3 py-3">
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={`pointer-events-auto ${askInitialSendButtonClass}`}
                  aria-label="Send message"
                >
                  <ArrowUp size={16} strokeWidth={2.6} aria-hidden="true" />
                </button>
              </div>
            </div>
          </form>

          <div className="grid gap-2">
            {SUGGESTIONS.map(({ headline, prompt }) => (
              <button
                key={prompt}
                type="button"
                onClick={() => fillAndFocus(prompt)}
                className="cursor-pointer rounded-[8px] border border-[rgba(245,244,241,0.08)] bg-[rgba(14,14,20,0.62)] px-4 py-3 text-left outline-none transition-[border-color,background-color] duration-150 hover:border-[rgba(255, 148, 148,0.28)] hover:bg-[rgba(255, 107, 107,0.075)] focus-visible:border-[rgba(255, 148, 148,0.48)]"
              >
                <span className="block text-[13.5px] font-[820] leading-[1.2] text-[#f5f4f1]">{headline}</span>
                <span className="mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] font-[560] leading-[1.35] text-[rgba(245,244,241,0.56)]">{prompt}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="mx-auto flex w-full max-w-[760px] flex-1 flex-col px-4 pb-[112px] pt-5 max-[560px]:pt-3 max-[560px]:pb-[104px]">
          <div className="flex flex-col gap-6" aria-live="polite">
            {messages.map((message, index) => {
              if (message.role === "user") {
                return (
                  <div key={`u-${index}`} className="ml-auto max-w-[min(84%,560px)]">
                    <div className="rounded-[14px_14px_4px_14px] bg-[#FF6B6B] px-4 py-2.5 text-[15px] font-[620] leading-[1.48] text-white shadow-[0_12px_32px_-22px_rgba(255, 107, 107,0.8)]">
                      {message.content}
                    </div>
                  </div>
                )
              }
              const isLastEmpty = streaming && index === messages.length - 1 && message.content === ""
              return (
                <div key={`a-${index}`}>
                  <div className="text-[15px] font-[520] leading-[1.68] text-[rgba(245,244,241,0.92)]">
                    {isLastEmpty ? (
                      <span className="inline-flex gap-1.5 py-2 text-[#FF9494]" aria-label="Thinking">
                        <span className="block size-1.5 animate-[cmdDotPulse_1s_ease_infinite] rounded-full bg-current" />
                        <span className="block size-1.5 animate-[cmdDotPulse_1s_ease_infinite] rounded-full bg-current [animation-delay:0.12s]" />
                        <span className="block size-1.5 animate-[cmdDotPulse_1s_ease_infinite] rounded-full bg-current [animation-delay:0.24s]" />
                      </span>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={askMarkdownComponents}>{normalizeChatMarkdown(message.content)}</ReactMarkdown>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[2] flex justify-center px-4 pb-[calc(14px+env(safe-area-inset-bottom))] max-[560px]:pb-[calc(10px+env(safe-area-inset-bottom))]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 -z-[1] h-[136px] bg-[linear-gradient(180deg,transparent,rgba(8,8,10,0.74)_34%,rgba(8,8,10,0.98)_76%)]"
            />
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submitMessage()
              }}
              className="pointer-events-auto w-full max-w-[760px]"
            >
              <div className="group flex items-end gap-2 rounded-[10px] border border-[rgba(245,244,241,0.11)] bg-[rgba(14,14,20,0.96)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_22px_50px_-30px_rgba(0,0,0,0.92)] backdrop-blur-[14px] transition-[border-color,box-shadow] duration-200 focus-within:border-[rgba(245,244,241,0.22)] focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_24px_58px_-42px_rgba(0,0,0,0.96)]">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  maxLength={500}
                  placeholder="Reply..."
                  aria-label="Message BrawlLens AI"
                  className="block min-h-10 flex-1 resize-none border-0 bg-transparent px-2.5 py-2 text-[16px] font-[560] leading-[1.5] text-[#f5f4f1] outline-none placeholder:text-[rgba(245,244,241,0.4)] [font-family:var(--font-ui)] [scrollbar-width:thin]"
                  style={{ maxHeight: "150px" }}
                />
                {streaming ? (
                  <button
                    type="button"
                    onClick={() => abortRef.current?.abort()}
                    className={askComposerStopButtonClass}
                    aria-label="Stop generating"
                  >
                    <Square size={13} strokeWidth={0} fill="currentColor" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className={askComposerSendButtonClass}
                    aria-label="Send message"
                  >
                    <ArrowUp size={18} strokeWidth={2.7} aria-hidden="true" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>
      )}

      <ChatLimitDialog gate={limitGate} onClose={() => setLimitGate(null)} />
    </main>
  )
}
