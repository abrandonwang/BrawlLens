"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUp, ChevronDown } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import ChatLimitDialog from "@/components/ChatLimitDialog"
import { chatLimitFromResponse, type ChatLimitPayload } from "@/lib/aiLimits"
import { authHeaders } from "@/lib/clientAuth"

const DATA_TOPICS = ["players", "brawlers", "maps", "clubs"]
type LandingDestination = { id: string; label: string; href: string }

const LANDING_DESTINATIONS: LandingDestination[] = [
  { id: "map-tier", label: "Map Tierlist", href: "/meta" },
  { id: "brawler-tier", label: "Brawler Tierlist", href: "/brawlers" },
  { id: "player-rank", label: "Player Rankings", href: "/leaderboards/players" },
  { id: "club-rank", label: "Club Rankings", href: "/leaderboards/clubs" },
  { id: "brawler-rank", label: "Brawler Rankings", href: "/leaderboards/brawlers" },
]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}


const landingShellClass =
  "app-landing-shell relative isolate flex min-h-[calc(100dvh-60px)] flex-1 flex-col overflow-hidden bg-transparent p-0 text-[var(--bt-text)]"
const landingStageClass =
  "relative z-[1] mx-auto grid min-h-[calc(100dvh-160px)] w-[min(1000px,calc(100vw_-_40px))] shrink-0 content-center justify-items-center pb-[clamp(46px,8vh,96px)] pt-[clamp(56px,10vh,120px)] [margin-top:clamp(-170px,-14vh,-112px)] max-[640px]:min-h-[calc(100dvh-132px)] max-[640px]:w-[min(calc(100%_-_24px),680px)] max-[640px]:pb-12 max-[640px]:pt-[54px] max-[640px]:[margin-top:-68px] max-[900px]:w-[min(calc(100%_-_24px),680px)]"
const landingBrandWrapClass = "flex w-full justify-center"
const landingTextLogoClass =
  "relative m-0 block bg-[linear-gradient(180deg,#ffffff_0%,#fff4ef_100%)] bg-clip-text text-center font-[900] leading-[0.98] tracking-normal text-white [filter:drop-shadow(0_10px_26px_rgba(120,30,30,0.4))] [font-family:var(--font-ui)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] [-webkit-text-stroke:0] text-[clamp(42px,4.8vw,78px)] max-[640px]:text-[clamp(38px,11.5vw,56px)]"
const landingTrackClass =
  "mt-[clamp(10px,1.5vh,18px)] grid w-[min(760px,100%)] justify-items-center gap-[clamp(10px,1.35vh,14px)] max-[640px]:w-[min(100%,calc(100vw_-_24px))]"
const landingLineClass =
  "m-0 inline-flex min-h-7 min-w-[min(420px,100%)] items-baseline justify-center text-center text-[clamp(16px,1.7vw,23px)] font-[430] leading-[1.28] tracking-normal text-[rgba(255,255,255,0.9)] [font-family:var(--font-ui)] max-[640px]:min-h-[22px] max-[640px]:text-[clamp(15px,4.7vw,18px)]"
const landingTypewordClass =
  "ml-[0.25em] inline-block text-left font-[600] text-[#ffffff]"
const landingPromptFormWrapClass =
  "relative w-[min(740px,100%)] aspect-[5.65/1] max-[640px]:w-[min(100%,calc(100vw_-_24px))]"
const landingPromptFormBaseClass =
  "absolute left-0 right-0 top-0 z-[3] flex h-full min-h-0 flex-col items-stretch gap-0 overflow-hidden border border-[rgba(255,255,255,0.24)] p-0 [background:rgba(255,255,255,0.12)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.18),0_26px_70px_-44px_rgba(90,20,20,0.6)] [container-type:inline-size] [backdrop-filter:blur(20px)_saturate(1.1)] [-webkit-backdrop-filter:blur(20px)_saturate(1.1)] rounded-[18px] transition-[height,border-color,border-radius,box-shadow,transform] duration-[460ms] ease-[cubic-bezier(0.16,1,0.3,1)] focus-within:border-[rgba(255,255,255,0.42)] focus-within:[background:rgba(255,255,255,0.16)] focus-within:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.22),0_30px_80px_-48px_rgba(90,20,20,0.7)] max-[640px]:rounded-[16px]"
// Expanded ~3x of the collapsed aspect-[5.65/1]. At 740px wide collapsed is ~131px, so ~390-410px is "triple".
const landingPromptFormExpandedClass =
  "!h-[440px] rounded-[20px] max-[640px]:!h-[380px] max-[640px]:rounded-[18px]"
// Collapsed: the form IS the input box. Textarea fills top-left, submit
// anchored to the bottom-right corner.
const landingPromptInputbarBaseClass =
  "absolute inset-[14px_14px_12px_18px] z-[2] grid shrink-0 grid-cols-[minmax(0,1fr)_36px] items-end gap-2.5 max-[640px]:inset-[12px_10px_10px_14px] max-[640px]:grid-cols-[minmax(0,1fr)_32px] max-[640px]:gap-2"
// Expanded: inputbar becomes a real nested pill at the bottom of the column.
const landingPromptInputbarExpandedClass =
  "!static !inset-auto !translate-y-0 !gap-2 grid grid-cols-[minmax(0,1fr)_36px] items-center rounded-[14px] border border-[rgba(218,232,255,0.14)] bg-[rgba(236,244,255,0.055)] p-[8px_10px_8px_14px] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.055),0_2px_10px_-8px_rgba(0,0,0,0.72)] transition-[border-color,box-shadow,background] duration-200 ease-out focus-within:border-[rgba(230,238,255,0.26)] focus-within:bg-[rgba(236,244,255,0.075)] focus-within:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.08),0_3px_12px_-9px_rgba(0,0,0,0.82)] m-[0_14px_14px_14px] max-[640px]:grid-cols-[minmax(0,1fr)_32px] max-[640px]:p-[7px_8px_7px_12px]"
const landingTextareaBaseClass =
  "relative z-[2] block h-full min-h-0 max-h-none w-full resize-none self-stretch border-0 bg-transparent p-[0_8px_0_0] text-[15px] font-[520] leading-[1.4] tracking-normal text-white outline-0 placeholder:text-[rgba(255,255,255,0.66)] placeholder:opacity-100 focus:border-0 focus:bg-transparent focus:outline-0 [font-family:var(--font-ui)] max-[640px]:text-[14px] max-[640px]:leading-[1.45]"
// Inside the expanded nested pill the textarea should be one line, vertically centered.
const landingTextareaExpandedClass =
  "!h-[20px] !min-h-[20px] max-h-[80px] !self-center !text-[14px] !leading-[1.5]"
const landingSubmitBaseClass =
  "box-border grid size-[30px] min-h-[30px] min-w-[30px] cursor-pointer place-items-center self-end justify-self-end rounded-full border-0 bg-white p-0 text-[#0f172a] outline-none [box-shadow:inset_0_1px_0_rgba(255,255,255,0.55),0_8px_18px_-14px_rgba(0,0,0,0.72)] transition-[background,color,transform,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:enabled:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.65),0_10px_24px_-16px_rgba(0,0,0,0.8)] hover:enabled:scale-105 active:enabled:scale-95 disabled:cursor-default disabled:bg-white/[0.08] disabled:text-white/[0.32] disabled:[box-shadow:none] disabled:opacity-100 max-[640px]:size-[28px] max-[640px]:min-h-[28px] max-[640px]:min-w-[28px]"
// Inside the expanded nested pill the submit sits vertically centered.
const landingSubmitExpandedClass = "!self-center"
const landingSubmitActiveClass = "!bg-[var(--bt-blue)] !text-white hover:enabled:!bg-[#6849f4] hover:enabled:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.16),0_10px_24px_-16px_rgba(0,0,0,0.78)]"
const landingChatBodyClass =
  "relative z-[2] flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto p-[20px_20px_10px_20px] scroll-smooth [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin] max-[640px]:gap-[12px] max-[640px]:p-[14px_14px_6px_14px] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(255,255,255,0.18)] [&::-webkit-scrollbar-track]:bg-transparent"
const landingChatUserBubbleClass =
  "ml-auto max-w-[min(78%,460px)] rounded-[14px_14px_4px_14px] bg-[#FF6B6B] px-[13px] py-[8px] text-[13.5px] font-[600] leading-[1.5] text-white [box-shadow:0_10px_22px_-18px_rgba(0,0,0,0.9)] [animation:landingChatMsgIn_380ms_cubic-bezier(0.16,1,0.3,1)_both] max-[640px]:max-w-[88%] max-[640px]:text-[13px]"
const landingChatAssistantClass =
  "w-full max-w-full text-[13.5px] font-[460] leading-[1.65] text-[rgba(244,248,255,0.92)] [animation:landingChatMsgIn_380ms_cubic-bezier(0.16,1,0.3,1)_both] [&>p]:my-0 max-[640px]:text-[13px]"
const landingChatDotsClass =
  "inline-flex gap-[5px] py-1 [&>span]:block [&>span]:size-[5px] [&>span]:rounded-full [&>span]:bg-current [&>span]:opacity-[0.72] [&>span]:[animation:landingChatPulse_980ms_ease-in-out_infinite] [&>span:nth-child(2)]:[animation-delay:120ms] [&>span:nth-child(3)]:[animation-delay:240ms]"
const landingPulseClass =
  "block size-[5px] rounded-full bg-current opacity-[0.72] [animation:landingChatPulse_980ms_ease-in-out_infinite]"
const landingDestNavClass =
  "absolute inset-x-0 bottom-[clamp(20px,4.4vh,48px)] z-[2] mx-auto flex w-[min(720px,calc(100vw-28px))] flex-wrap items-center justify-center gap-2.5 px-4 transition-opacity duration-300 max-[640px]:bottom-[clamp(16px,3.4vh,28px)] max-[640px]:gap-2"
const landingDestTriggerClass =
  "group inline-flex items-center gap-2 rounded-full border border-[rgba(218,232,255,0.16)] bg-[rgba(30,36,49,0.72)] px-5 py-2.5 text-[14px] font-[640] tracking-[-0.005em] text-[rgba(244,248,255,0.92)] no-underline outline-none [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.06),0_10px_30px_-20px_rgba(0,0,0,0.85)] transition-[background,border-color,color] duration-200 [font-family:var(--font-ui)] hover:border-[rgba(255,107,107,0.5)] hover:bg-[rgba(38,44,58,0.88)] hover:text-white focus-visible:border-[rgba(255,107,107,0.6)] max-[640px]:px-4 max-[640px]:py-2 max-[640px]:text-[13.5px]"
const landingDestMenuClass =
  "absolute bottom-full left-1/2 mb-2.5 w-[230px] -translate-x-1/2 origin-bottom rounded-[14px] border border-[rgba(245,244,241,0.10)] bg-[rgba(17,19,26,0.98)] p-1.5 [box-shadow:inset_0_1px_0_rgba(255,255,255,0.045),0_24px_60px_-30px_rgba(0,0,0,0.92)] [backdrop-filter:blur(12px)] [-webkit-backdrop-filter:blur(12px)]"
const landingDestItemClass =
  "group/item flex items-center justify-between gap-3 rounded-[9px] px-3 py-2.5 text-[13.5px] font-[560] text-[rgba(245,244,241,0.82)] no-underline outline-none transition-colors duration-150 [font-family:var(--font-ui)] hover:bg-[rgba(255,107,107,0.14)] hover:text-white focus-visible:bg-[rgba(255,107,107,0.14)] focus-visible:text-white"

function LandingExploreMenu({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={landingDestTriggerClass}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
        onClick={() => setOpen(value => !value)}
      >
        <span>Explore BrawlLens</span>
        <ChevronDown
          size={15}
          strokeWidth={2.4}
          className={cx("opacity-70 transition-transform duration-200", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div role="menu" className={cx(landingDestMenuClass, "animate-[authPanelIn_180ms_cubic-bezier(0.16,1,0.3,1)_both]")}>
          {LANDING_DESTINATIONS.map(item => (
            <Link
              key={item.id}
              href={item.href}
              role="menuitem"
              className={landingDestItemClass}
              onClick={() => setOpen(false)}
            >
              <span>{item.label}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-[12px] w-[12px] shrink-0 opacity-40 transition-opacity duration-150 group-hover/item:opacity-90"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 8h8" />
                <path d="M9 4l4 4-4 4" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const landingMarkdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 mt-0 last:mb-0">{children}</p>,
  h1: ({ children }) => <h3 className="mb-2 mt-3 text-[14px] font-[760] text-white first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 mt-3 text-[13.5px] font-[760] text-white first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1.5 mt-3 text-[13px] font-[720] text-white first:mt-0">{children}</h4>,
  strong: ({ children }) => <strong className="font-[720] text-white">{children}</strong>,
  em: ({ children }) => <em className="text-[rgba(244,248,255,0.74)]">{children}</em>,
  ul: ({ children }) => <ul className="my-2 flex list-disc flex-col gap-1 pl-[20px] marker:text-[rgba(255,255,255,0.34)]">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 flex list-decimal flex-col gap-1 pl-[22px] marker:text-[rgba(255,255,255,0.34)]">{children}</ol>,
  li: ({ children }) => <li className="leading-[1.55]">{children}</li>,
  a: ({ href, children }) => <Link href={href ?? "/"} className="font-[660] text-[#a9c8ff] underline underline-offset-2 hover:text-[#c9d8ff]">{children}</Link>,
  code: ({ children }) => <code className="rounded-[5px] border border-white/[0.08] bg-white/[0.05] px-[5px] py-[1px] font-mono text-[0.9em] text-[#e8efff]">{children}</code>,
  pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded-[8px] border border-white/[0.08] bg-white/[0.04] p-3 text-[12px] leading-[1.5] text-[#e8efff]">{children}</pre>,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-[10px] border border-white/[0.08]">
      <table className="w-full min-w-full border-collapse text-[12.5px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/[0.05]">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-white/[0.06] last:border-b-0">{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-[10.5px] font-[720] uppercase tracking-[0.06em] text-[rgba(244,248,255,0.62)]">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-3 py-2 align-top text-[rgba(244,248,255,0.92)]">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-[rgba(255, 148, 148,0.5)] pl-3 text-[rgba(244,248,255,0.72)]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-0 border-t border-white/[0.08]" />,
}

type LandingChatMessage = {
  role: "user" | "assistant"
  content: string
}

export default function LandingClient() {
  const [landingQuery, setLandingQuery] = useState("")
  const [typedTopic, setTypedTopic] = useState("")
  const [typedTopicIndex, setTypedTopicIndex] = useState(0)
  const [typewriterPhase, setTypewriterPhase] = useState<"typing" | "hold" | "deleting">("typing")
  const [landingChatMessages, setLandingChatMessages] = useState<LandingChatMessage[]>([])
  const [landingChatExpanded, setLandingChatExpanded] = useState(false)
  const [landingChatStreaming, setLandingChatStreaming] = useState(false)
  const [landingLimitGate, setLandingLimitGate] = useState<ChatLimitPayload | null>(null)
  const landingChatAbortRef = useRef<AbortController | null>(null)
  const landingChatBottomRef = useRef<HTMLDivElement>(null)
  const landingPromptResetRef = useRef<number | null>(null)
  const landingPromptHasValue = landingQuery.trim().length > 0
  const landingRouter = useRouter()

  useEffect(() => {
    const captureStyles = (element: HTMLElement | null, properties: string[]) => {
      if (!element) return null
      return properties.map(property => ({
        property,
        priority: element.style.getPropertyPriority(property),
        value: element.style.getPropertyValue(property),
      }))
    }

    const restoreStyles = (
      element: HTMLElement | null,
      snapshot: ReturnType<typeof captureStyles>,
    ) => {
      if (!element || !snapshot) return
      snapshot.forEach(({ property, priority, value }) => {
        if (value) {
          element.style.setProperty(property, value, priority)
        } else {
          element.style.removeProperty(property)
        }
      })
    }

    const html = document.documentElement
    const body = document.body
    const mainShell = document.querySelector<HTMLElement>(".app-main-shell")
    const nav = document.querySelector<HTMLElement>("body > nav")
    const previousHtmlStyles = captureStyles(html, ["height", "min-height", "overflow", "overflow-y", "overscroll-behavior"])
    const previousBodyStyles = captureStyles(body, [
      "background",
      "background-image",
      "background-attachment",
      "height",
      "min-height",
      "overflow",
      "overflow-y",
      "overscroll-behavior",
    ])
    const previousMainShellStyles = captureStyles(mainShell, ["height", "min-height", "overflow"])
    const previousNavStyles = captureStyles(nav, ["background", "background-color", "border-color", "box-shadow", "backdrop-filter", "-webkit-backdrop-filter"])

    html.classList.add("landing-bg", "home-landing-bg")
    html.style.setProperty("height", "100dvh", "important")
    html.style.setProperty("min-height", "100dvh", "important")
    html.style.setProperty("overflow", "hidden", "important")
    html.style.setProperty("overflow-y", "hidden", "important")
    html.style.setProperty("overscroll-behavior", "none", "important")
    body.style.setProperty("background", "linear-gradient(315deg, #E2846F, #D3504E)", "important")
    body.style.setProperty("background-attachment", "fixed", "important")
    body.style.setProperty("height", "100dvh", "important")
    body.style.setProperty("min-height", "100dvh", "important")
    body.style.setProperty("overflow", "hidden", "important")
    body.style.setProperty("overflow-y", "hidden", "important")
    body.style.setProperty("overscroll-behavior", "none", "important")
    mainShell?.style.setProperty("height", "100dvh", "important")
    mainShell?.style.setProperty("min-height", "100dvh", "important")
    mainShell?.style.setProperty("overflow", "hidden", "important")
    nav?.style.setProperty("background", "rgba(255,255,255,0.12)", "important")
    nav?.style.setProperty("background-color", "rgba(255,255,255,0.12)", "important")
    nav?.style.setProperty("border-color", "rgba(255,255,255,0.22)", "important")
    nav?.style.setProperty("backdrop-filter", "blur(18px) saturate(1.1)", "important")
    nav?.style.setProperty("-webkit-backdrop-filter", "blur(18px) saturate(1.1)", "important")

    return () => {
      html.classList.remove("landing-bg", "home-landing-bg")
      restoreStyles(html, previousHtmlStyles)
      restoreStyles(body, previousBodyStyles)
      restoreStyles(mainShell, previousMainShellStyles)
      restoreStyles(nav, previousNavStyles)
    }
  }, [])

  useEffect(() => {
    return () => {
      landingChatAbortRef.current?.abort()
      if (landingPromptResetRef.current) window.clearTimeout(landingPromptResetRef.current)
    }
  }, [])

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedTopic(DATA_TOPICS[0])
      return
    }

    const topic = DATA_TOPICS[typedTopicIndex]
    let timeout = 82

    if (typewriterPhase === "typing") {
      if (typedTopic.length < topic.length) {
        timeout = 76
      } else {
        timeout = 980
      }
    } else if (typewriterPhase === "hold") {
      timeout = 820
    } else {
      timeout = 38
    }

    const timer = window.setTimeout(() => {
      if (typewriterPhase === "typing") {
        if (typedTopic.length < topic.length) {
          setTypedTopic(topic.slice(0, typedTopic.length + 1))
        } else {
          setTypewriterPhase("hold")
        }
        return
      }

      if (typewriterPhase === "hold") {
        setTypewriterPhase("deleting")
        return
      }

      if (typedTopic.length > 0) {
        setTypedTopic(topic.slice(0, typedTopic.length - 1))
      } else {
        setTypedTopicIndex(index => (index + 1) % DATA_TOPICS.length)
        setTypewriterPhase("typing")
      }
    }, timeout)

    return () => window.clearTimeout(timer)
  }, [typedTopic, typedTopicIndex, typewriterPhase])

  useEffect(() => {
    if (landingChatExpanded) {
      landingChatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }, [landingChatExpanded, landingChatMessages])


  const sendLandingMessage = useCallback(async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || landingChatStreaming) return

    if (landingPromptResetRef.current) {
      window.clearTimeout(landingPromptResetRef.current)
      landingPromptResetRef.current = null
    }

    const userMessage: LandingChatMessage = { role: "user", content: trimmed }
    const history = [...landingChatMessages, userMessage]
    setLandingChatExpanded(true)
    setLandingQuery("")
    setLandingChatMessages([...history, { role: "assistant", content: "" }])
    setLandingChatStreaming(true)

    const controller = new AbortController()
    landingChatAbortRef.current = controller

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
            headings: ["BrawlLens"],
            visibleText: "BrawlLens landing page with a data search chat interface.",
          },
        }),
        signal: controller.signal,
      })

      const gate = await chatLimitFromResponse(response)
      if (gate) {
        setLandingChatMessages(history)
        setLandingLimitGate(gate)
        return
      }

      if (!response.ok || !response.body) {
        setLandingChatMessages([...history, { role: "assistant", content: "Sorry, I’m having trouble connecting right now. Please try again in a moment." }])
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setLandingChatMessages([...history, { role: "assistant", content: fullText }])
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setLandingChatMessages([...history, { role: "assistant", content: "Sorry, I’m having trouble connecting right now. Please try again in a moment." }])
      }
    } finally {
      setLandingChatStreaming(false)
      landingChatAbortRef.current = null
    }
  }, [landingChatMessages, landingChatStreaming])

  function submitLandingSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendLandingMessage(landingQuery)
  }

  function handleLandingPromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void sendLandingMessage(landingQuery)
    }
    if (event.key === "Escape" && landingChatExpanded) {
      event.preventDefault()
      closeLandingChat()
    }
  }

  function handleLandingPromptChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setLandingQuery(event.target.value)
  }

  function closeLandingChat() {
    landingChatAbortRef.current?.abort()
    setLandingChatStreaming(false)
    setLandingChatExpanded(false)
    setLandingQuery("")
    landingPromptResetRef.current = window.setTimeout(() => {
      setLandingChatMessages([])
      landingPromptResetRef.current = null
    }, 320)
  }


  return (
    <main className={landingShellClass}>
      <section className={landingStageClass} aria-label="BrawlLens search">
        <div className={landingBrandWrapClass}>
          <h1 className={landingTextLogoClass} data-text="BrawlLens">BrawlLens</h1>
        </div>

        <div className={landingTrackClass}>
          <p className={landingLineClass} aria-live="polite">
            Find data for <span className={landingTypewordClass}>{typedTopic || "\u00a0"}</span>
          </p>
          <div className={landingPromptFormWrapClass}>
          <form
            className={cx(
              landingPromptFormBaseClass,
              landingChatExpanded && landingPromptFormExpandedClass,
            )}
            onSubmit={submitLandingSearch}
          >
            {landingChatExpanded && (
              <>
                <div className={landingChatBodyClass} aria-live="polite">
                  {landingChatMessages.map((message, index) => (
                    <div key={index} className="flex w-full flex-col">
                      {message.role === "user" ? (
                        <div className={landingChatUserBubbleClass}>{message.content}</div>
                      ) : (
                        <div className={landingChatAssistantClass}>
                          {landingChatStreaming && index === landingChatMessages.length - 1 && message.content === "" ? (
                            <span className={landingChatDotsClass} aria-label="Thinking"><span /><span /><span /></span>
                          ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={landingMarkdownComponents}>{message.content}</ReactMarkdown>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={landingChatBottomRef} />
                </div>
              </>
            )}
            <div className={cx(landingPromptInputbarBaseClass, landingChatExpanded && landingPromptInputbarExpandedClass)}>
              <textarea
                className={cx(landingTextareaBaseClass, landingChatExpanded && landingTextareaExpandedClass)}
                value={landingQuery}
                onChange={handleLandingPromptChange}
                onKeyDown={handleLandingPromptKeyDown}
                aria-label="Landing prompt"
                autoComplete="off"
                placeholder="Tell us what you're looking for..."
                rows={1}
                spellCheck={false}
              />
              <button
                type="submit"
                className={cx(
                  landingSubmitBaseClass,
                  landingChatExpanded && landingSubmitExpandedClass,
                  (landingPromptHasValue || landingChatStreaming) && landingSubmitActiveClass,
                )}
                aria-label="Send message"
                disabled={!landingQuery.trim() || landingChatStreaming}
              >
                {landingChatStreaming ? (
                  <span className={landingPulseClass} aria-hidden="true" />
                ) : (
                  <ArrowUp
                    size={18}
                    strokeWidth={2.7}
                    className={landingChatExpanded ? "size-[18px]" : "size-4 max-[640px]:size-[13px]"}
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
          </form>
          </div>
        </div>
      </section>

      <nav
        className={cx(landingDestNavClass, landingChatExpanded && "pointer-events-none opacity-0")}
        aria-label="Explore BrawlLens pages"
        aria-hidden={landingChatExpanded}
      >
        <LandingExploreMenu disabled={landingChatExpanded} />
      </nav>

      <ChatLimitDialog gate={landingLimitGate} onClose={() => setLandingLimitGate(null)} />
    </main>
  )
}
