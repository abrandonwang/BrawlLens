"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react"
import Link from "next/link"
import { ArrowRight, ArrowUp, X } from "lucide-react"
import { PulsingBorder } from "@paper-design/shaders-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import { BrawlImage, brawlerIconUrl, profileIconUrl } from "@/components/BrawlImage"
import { formatTrophies } from "@/lib/format"
import { leaderboardRegionShort } from "@/lib/leaderboardRegions"
import { getModeName } from "@/lib/modes"

const DATA_TOPICS = ["players", "brawlers", "maps", "upgrades"]
const LANDING_PROMPT_BORDER_COLORS = ["#0dc1fd", "#d915ef", "#ff3f2ecc"]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

const landingShellClass =
  "app-landing-shell relative isolate block flex-1 overflow-visible bg-transparent p-0 text-[var(--bt-text)]"
const landingStageClass =
  "mx-auto grid w-[min(1000px,calc(100vw_-_40px))] shrink-0 content-center justify-items-center pb-[clamp(18px,3vh,28px)] pt-[clamp(14px,2.4vh,26px)] max-[640px]:pt-[34px] max-[900px]:w-[min(calc(100%_-_24px),680px)] min-[901px]:pt-[clamp(34px,5vh,48px)]"
const landingBrandWrapClass = "flex w-full justify-center"
const landingTextLogoClass =
  "relative m-0 block bg-[linear-gradient(180deg,#ffffff_0%,#f2f8ff_48%,#9fcfff_100%)] bg-clip-text text-center font-[900] leading-[0.98] tracking-normal text-[#f5f9ff] [filter:drop-shadow(0_8px_18px_rgba(0,0,0,0.34))] [font-family:var(--font-ui)] [text-shadow:0_1px_0_rgba(255,255,255,0.22)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] [-webkit-text-stroke:0] text-[clamp(42px,4.8vw,78px)] max-[640px]:text-[clamp(38px,11.5vw,56px)]"
const landingTrackClass =
  "mt-[clamp(12px,1.8vh,22px)] grid w-[min(760px,100%)] justify-items-center gap-[clamp(13px,1.7vh,18px)] max-[640px]:w-[min(100%,calc(100vw_-_24px))]"
const landingLineClass =
  "m-0 inline-flex min-h-7 min-w-[min(420px,100%)] items-baseline justify-center text-center text-[clamp(15px,1.35vw,19px)] font-[850] leading-[1.18] text-[rgba(231,244,255,0.76)] [text-shadow:0_12px_28px_rgba(0,0,0,0.36)] max-[640px]:min-h-[25px] max-[640px]:text-[clamp(17px,5.4vw,22px)]"
const landingTypewordClass =
  "ml-[0.28em] inline-block text-left text-[#dff7ff] [text-shadow:0_0_12px_rgba(167,139,255,0.38),0_1px_0_rgba(255,255,255,0.35)]"
const landingPromptFormBaseClass =
  "relative flex h-auto min-h-0 w-[min(760px,100%)] aspect-[5/1] flex-col items-stretch gap-0 overflow-hidden border border-[rgba(215,235,255,0.18)] p-0 [backdrop-filter:none] [background:linear-gradient(180deg,rgba(24,25,32,0.94),rgba(11,13,19,0.90)),rgba(10,12,18,0.92)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-1px_0_rgba(255,255,255,0.04),0_18px_34px_-20px_rgba(0,0,0,0.72),0_0_0_1px_rgba(167,139,255,0.06)] [container-type:inline-size] [-webkit-backdrop-filter:none] rounded-[clamp(22px,2vw,26px)] transition-[height,padding,border-radius,background,box-shadow] duration-[420ms,420ms,420ms,220ms,220ms] ease-[cubic-bezier(0.22,1,0.36,1),cubic-bezier(0.22,1,0.36,1),cubic-bezier(0.22,1,0.36,1),ease,ease] focus-within:border-[rgba(215,235,255,0.18)] focus-within:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-1px_0_rgba(255,255,255,0.04),0_18px_34px_-20px_rgba(0,0,0,0.72),0_0_0_1px_rgba(167,139,255,0.06)] max-[640px]:rounded-[18px]"
const landingPromptFormExpandedClass =
  "h-[clamp(450px,58vh,540px)] aspect-auto rounded-[26px] border-[rgba(215,235,255,0.18)] p-0 [box-shadow:inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-1px_0_rgba(255,255,255,0.04),0_22px_52px_-26px_rgba(0,0,0,0.72),0_0_0_1px_rgba(167,139,255,0.06)] max-[640px]:h-[430px] max-[640px]:p-4"
const landingPromptBorderShaderClass =
  "absolute inset-0 z-[1] box-border h-full w-full rounded-[inherit] pointer-events-none transition-opacity duration-[260ms] ease-in-out"
const landingPromptInputbarBaseClass =
  "absolute inset-[20px_18px_16px_22px] z-[2] mt-0 grid shrink-0 grid-cols-[minmax(0,1fr)_48px] items-end gap-3.5 max-[640px]:inset-[12px_10px_10px_14px] max-[640px]:grid-cols-[minmax(0,1fr)_38px] max-[640px]:gap-[9px]"
const landingPromptInputbarExpandedClass =
  "static inset-auto m-[0_18px_18px_18px] grid-cols-[minmax(0,1fr)_42px] items-center gap-3 rounded-full border border-[rgba(215,235,255,0.16)] bg-[rgba(8,10,15,0.78)] p-[8px_9px_8px_18px] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_-22px_rgba(0,0,0,0.85)] max-[640px]:grid-cols-[minmax(0,1fr)_40px] max-[640px]:p-[8px_8px_8px_13px]"
const landingTextareaBaseClass =
  "relative z-[2] block h-full min-h-0 max-h-none w-full resize-none self-stretch border-0 bg-transparent p-[0_8px_0_0] text-[clamp(16px,2.35cqw,18px)] font-[420] leading-[1.28] tracking-normal text-[rgba(245,250,255,0.92)] outline-0 placeholder:text-[rgba(215,222,235,0.54)] placeholder:opacity-100 focus:border-0 focus:bg-transparent focus:outline-0 [font-family:var(--font-ui)] max-[640px]:h-full max-[640px]:min-h-0 max-[640px]:text-[16px] max-[640px]:leading-[1.32]"
const landingTextareaExpandedClass =
  "!h-6 !min-h-6 max-h-[68px] self-center !p-0 text-[clamp(16px,2.1cqw,17px)] font-bold leading-[1.45] max-[640px]:!h-[22px] max-[640px]:!min-h-[22px] max-[640px]:text-[16px]"
const landingSubmitBaseClass =
  "box-border grid size-8 min-h-8 min-w-8 cursor-pointer place-items-center self-end justify-self-end rounded-full border-0 bg-[rgba(255,255,255,0.92)] p-0 text-[#151821] outline-none [box-shadow:inset_0_1px_0_rgba(255,255,255,0.80),0_16px_34px_-20px_rgba(0,0,0,0.95)] [transform:none] transition-[background,color,opacity] duration-150 ease-in-out disabled:cursor-default disabled:opacity-100 max-[640px]:size-[26px] max-[640px]:min-h-[26px] max-[640px]:min-w-[26px]"
const landingSubmitExpandedClass =
  "size-9 min-h-9 min-w-9 self-center max-[640px]:size-9 max-[640px]:min-h-9 max-[640px]:min-w-9"
const landingSubmitActiveClass = "bg-[var(--bt-blue)] text-white"
const landingChatCloseClass =
  "absolute right-3.5 top-3.5 z-[4] m-0 grid size-8 min-h-8 min-w-8 cursor-pointer place-items-center rounded-full border-0 bg-white/10 p-0 text-[rgba(244,248,255,0.82)] shadow-none outline-none [transform:none] transition-colors duration-150 hover:bg-white/15 hover:text-white hover:[transform:none] max-[640px]:right-3 max-[640px]:top-3 max-[640px]:size-[30px] max-[640px]:min-h-[30px] max-[640px]:min-w-[30px] [&>svg]:[transform:none]"
const landingChatBodyClass =
  "relative z-[2] flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-[56px_26px_12px_26px] [scrollbar-width:none] max-[640px]:gap-2.5 max-[640px]:p-[30px_28px_4px_0] [&::-webkit-scrollbar]:hidden"
const landingChatBubbleBaseClass =
  "max-w-[min(78%,560px)] rounded-[18px] p-[12px_14px] text-sm font-[610] leading-[1.5] text-[rgba(244,248,255,0.84)] max-[640px]:max-w-[86%] max-[640px]:rounded-2xl max-[640px]:p-[10px_12px] max-[640px]:text-[13px]"
const landingChatDotsClass =
  "inline-flex gap-[5px] py-1 [&>span]:block [&>span]:size-[5px] [&>span]:rounded-full [&>span]:bg-current [&>span]:opacity-[0.72] [&>span]:[animation:landingChatPulse_980ms_ease-in-out_infinite] [&>span:nth-child(2)]:[animation-delay:120ms] [&>span:nth-child(3)]:[animation-delay:240ms]"
const landingPulseClass =
  "block size-[5px] rounded-full bg-current opacity-[0.72] [animation:landingChatPulse_980ms_ease-in-out_infinite]"
const landingShowcaseClass =
  "mx-auto grid min-h-0 w-[min(1280px,calc(100vw_-_48px))] grid-cols-3 items-stretch gap-4 p-[0_0_40px] max-[1350px]:mt-[30px] max-[1350px]:w-[min(680px,calc(100vw_-_40px))] max-[1350px]:grid-cols-1 max-[900px]:w-[min(calc(100%_-_24px),680px)] max-[720px]:mt-7 min-[901px]:translate-y-[clamp(68px,8vh,116px)]"
const previewCardClass =
  "app-landing-preview-card relative min-h-[220px] overflow-hidden rounded-xl border border-white/8 bg-[rgba(22,22,28,0.78)] text-[var(--bt-text-2)] [--card-accent:#7c5cff] [--card-accent-soft:rgba(124,92,255,0.10)] [backdrop-filter:blur(18px)] [box-shadow:rgba(255,255,255,0.05)_0_0.5px_0_0_inset,rgba(0,0,0,0.45)_0_8px_28px_-10px] [-webkit-backdrop-filter:blur(18px)] transition-[border-color,box-shadow,background] duration-200 hover:border-white/15 hover:bg-[rgba(26,26,33,0.85)] hover:[box-shadow:rgba(255,255,255,0.06)_0_0.5px_0_0_inset,rgba(0,0,0,0.55)_0_12px_36px_-10px] max-[640px]:min-h-[172px]"
const previewTabsClass =
  "relative z-[2] grid h-[43px] grid-cols-3 border-b border-[var(--bt-line)] bg-[var(--bt-shell)] text-[var(--bt-text)]"
const previewTabButtonBaseClass =
  "inline-flex cursor-pointer appearance-none items-center justify-center border-0 bg-transparent p-0 text-[13px] font-black tracking-normal text-[#f5f4f1] outline-none max-[720px]:text-sm"
const previewTitleClass =
  "relative z-[2] flex h-[43px] items-center justify-center gap-1.5 border-b border-[var(--bt-line)] bg-[var(--bt-shell)] text-[15px] font-[950] leading-none text-[var(--bt-text)] no-underline transition-opacity duration-150 hover:opacity-70 max-[720px]:text-sm [&>svg]:text-[rgba(245,244,241,0.7)]"
const previewHeadClass =
  "grid h-[27px] items-center gap-x-2.5 border-b border-[rgba(255,255,255,0.06)] bg-transparent px-4 text-[10px] font-[650] uppercase tracking-[0.06em] text-[#f5f4f1] max-[720px]:gap-x-2 max-[720px]:px-3"
const previewLeaderGridClass =
  "grid-cols-[34px_minmax(0,1fr)_78px_48px] max-[720px]:grid-cols-[34px_minmax(0,1fr)_minmax(66px,0.42fr)_minmax(40px,0.28fr)]"
const previewTierGridClass =
  "grid-cols-[42px_minmax(88px,1fr)_44px_72px_58px] max-[720px]:grid-cols-[36px_minmax(82px,1.2fr)_minmax(36px,0.5fr)_minmax(60px,0.75fr)_minmax(54px,0.68fr)]"
const previewMapGridClass =
  "grid-cols-[minmax(110px,1fr)_62px_minmax(98px,0.82fr)_48px] max-[720px]:grid-cols-[108px_58px_minmax(96px,1fr)_46px]"
const previewRowsClass = "grid"
const previewRowClass =
  "grid min-h-10 items-center gap-x-2.5 border-b border-[rgba(255,255,255,0.05)] bg-transparent text-[var(--bt-text-2)] last:border-b-0 hover:bg-[rgba(255,255,255,0.03)] max-[720px]:gap-x-2"
const previewLeaderRowClass =
  "min-h-[43px] px-4 text-inherit no-underline transition-opacity duration-150 hover:opacity-70 max-[720px]:px-3"
const previewTierRowClass = "min-h-[43px] px-4 max-[720px]:px-3"
const previewMapRowClass =
  "min-h-[43px] px-4 text-inherit no-underline transition-opacity duration-150 hover:opacity-70 max-[720px]:px-3"
const previewAvatarClass =
  "grid size-[30px] place-items-center rounded-md bg-[radial-gradient(circle_at_32%_24%,rgba(255,255,255,0.34),transparent_28%),linear-gradient(135deg,rgba(139,215,255,0.38),rgba(65,104,236,0.22))] text-xs font-[950] text-[#f5f4f1] [box-shadow:rgba(0,0,0,0.38)_0_8px_14px_-10px] [&_img]:size-[30px] [&_img]:rounded-md [&_img]:object-cover"
const previewStackClass =
  "grid min-w-0 [&>small]:overflow-hidden [&>small]:text-ellipsis [&>small]:whitespace-nowrap [&>small]:text-[10px] [&>small]:font-[850] [&>small]:leading-[1.2] [&>small]:text-[rgba(245,244,241,0.46)] [&>strong]:overflow-hidden [&>strong]:text-ellipsis [&>strong]:whitespace-nowrap [&>strong]:text-[13px] [&>strong]:font-[950] [&>strong]:leading-none [&>strong]:tracking-normal [&>strong]:text-[var(--bt-text)]"
const previewBrawlerClass =
  "col-[1/3] grid min-w-0 grid-cols-[42px_minmax(0,1fr)] items-center gap-x-2.5 text-inherit no-underline transition-opacity duration-150 hover:opacity-70 max-[720px]:grid-cols-[36px_minmax(0,1fr)] [&_img]:size-[34px] [&_img]:rounded-md [&_img]:object-cover max-[720px]:[&_img]:size-8 [&>strong]:overflow-hidden [&>strong]:text-ellipsis [&>strong]:whitespace-nowrap [&>strong]:text-[13px] [&>strong]:font-[950] [&>strong]:leading-none [&>strong]:tracking-normal [&>strong]:text-[var(--bt-text)]"
const previewTierClass =
  "col-start-3 text-left text-lg font-[850] [font-family:var(--font-number)] [text-shadow:0_0_10px_color-mix(in_srgb,currentColor_32%,transparent),0_0_2px_color-mix(in_srgb,currentColor_70%,transparent)]"
const previewRateClass =
  "col-start-4 grid justify-items-start leading-none [&>strong]:text-sm [&>strong]:font-[950] [&>strong]:[color:var(--preview-win-color,var(--bt-text))] max-[720px]:[&>strong]:text-base"
const previewPickClass =
  "col-start-5 inline-flex h-6 min-w-[45px] justify-self-start items-center justify-center rounded-[5px] bg-transparent text-left text-[13px] font-[950] text-[var(--bt-text)]"
const previewMapBrawlerClass =
  "grid min-w-0 grid-cols-[30px_minmax(0,1fr)] items-center gap-[7px] text-xs font-black text-[rgba(245,244,241,0.62)] max-[720px]:grid-cols-[24px_minmax(0,1fr)] max-[720px]:gap-1.5 [&_img]:size-7 [&_img]:rounded-md [&_img]:object-cover max-[720px]:[&_img]:size-6 [&>strong]:overflow-hidden [&>strong]:text-ellipsis [&>strong]:whitespace-nowrap [&>strong]:text-[13px] [&>strong]:font-[950] [&>strong]:leading-none [&>strong]:tracking-normal [&>strong]:text-[var(--bt-text)] max-[720px]:[&>strong]:text-xs"

const landingMarkdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-[780] text-white">{children}</strong>,
  em: ({ children }) => <em className="text-[rgba(244,248,255,0.68)]">{children}</em>,
  ul: ({ children }) => <ul className="my-2 flex flex-col gap-1 pl-[18px]">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 flex flex-col gap-1 pl-[18px]">{children}</ol>,
  li: ({ children }) => <li className="list-item">{children}</li>,
  a: ({ href, children }) => <Link href={href ?? "/"} className="font-[740] text-[#a9e4ff] underline underline-offset-2">{children}</Link>,
  code: ({ children }) => <code className="rounded-md border border-[rgba(215,235,255,0.10)] bg-white/5 px-[5px] py-px font-mono text-[0.92em]">{children}</code>,
}

type LandingPlayer = {
  rank: number
  player_tag: string
  player_name: string
  trophies: number
  club_name: string | null
  iconId?: number | null
}

type LandingRegion = {
  code: string
  label: string
  players: LandingPlayer[]
}

type BrawlerStats = {
  id: number
  name: string
  picks: number
  wins: number
  winRate: number | null
}

type TierPreviewRow = {
  id: number
  name: string
  tier: { label: string; color: string }
  winRate: number | null
  pickRate: number
}

type ModeInfo = {
  mode: string
  totalBattles: number
  maps: { name: string; battles: number }[]
}

type MapBrawlerPreview = {
  brawlerId: number
  name: string
  picks: number
  winRate: number
}

type MapPreviewRow = {
  name: string
  mode: string
  battles: number
  best: MapBrawlerPreview | null
}

type LandingChatMessage = {
  role: "user" | "assistant"
  content: string
}

function getPreviewTier(winRate: number | null | undefined, picks: number) {
  if (winRate == null || Number.isNaN(winRate) || picks < 10) return { label: "-", color: "#69758d" }
  if (winRate >= 58) return { label: "S+", color: "#f5d75e" }
  if (winRate >= 54) return { label: "S", color: "#a78bff" }
  if (winRate >= 51) return { label: "A", color: "#7dd3fc" }
  if (winRate >= 48) return { label: "B", color: "#e2e6ee" }
  if (winRate >= 45) return { label: "C", color: "#ffb38a" }
  return { label: "D", color: "#ff7878" }
}

function getPreviewWinRateColor(winRate: number | null | undefined) {
  if (winRate == null || Number.isNaN(winRate)) return "rgba(245, 244, 241, 0.72)"
  if (winRate >= 60) return "#f5d75e"
  if (winRate >= 50) return "#a78bff"
  if (winRate >= 45) return "#7dd3fc"
  return "#ff7878"
}

function previewWinRateStyle(winRate: number | null | undefined): CSSProperties {
  return { "--preview-win-color": getPreviewWinRateColor(winRate) } as CSSProperties
}

function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "-"
  return `${value.toFixed(1)}%`
}

function cleanTag(tag: string) {
  return tag.replace(/^#/, "")
}

function playerHref(tag: string) {
  return `/player/${encodeURIComponent(cleanTag(tag))}`
}

function mapHref(name: string) {
  return `/meta/${encodeURIComponent(name)}`
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? "?").toUpperCase()
}

export default function LandingClient() {
  const [leaderRegions, setLeaderRegions] = useState<LandingRegion[]>([])
  const [activeLeaderboardRegion, setActiveLeaderboardRegion] = useState("")
  const [tierPreview, setTierPreview] = useState<TierPreviewRow[]>([])
  const [mapPreview, setMapPreview] = useState<MapPreviewRow[]>([])
  const [landingQuery, setLandingQuery] = useState("")
  const [typedTopic, setTypedTopic] = useState("")
  const [typedTopicIndex, setTypedTopicIndex] = useState(0)
  const [typewriterPhase, setTypewriterPhase] = useState<"typing" | "hold" | "deleting">("typing")
  const [landingChatMessages, setLandingChatMessages] = useState<LandingChatMessage[]>([])
  const [landingChatExpanded, setLandingChatExpanded] = useState(false)
  const [landingChatStreaming, setLandingChatStreaming] = useState(false)
  const landingChatAbortRef = useRef<AbortController | null>(null)
  const landingChatBottomRef = useRef<HTMLDivElement>(null)
  const landingPromptResetRef = useRef<number | null>(null)
  const activeRegion = leaderRegions.find(region => region.code === activeLeaderboardRegion) ?? leaderRegions[0]
  const landingPromptHasValue = landingQuery.trim().length > 0
  const landingPromptBorderStyle = useMemo<CSSProperties>(() => ({
    position: "absolute",
    inset: 0,
    zIndex: 1,
    boxSizing: "border-box",
    width: "100%",
    height: "100%",
    borderRadius: "inherit",
    pointerEvents: "none",
    opacity: landingChatExpanded ? 0.8 : 1,
    transition: "opacity 260ms ease",
  }), [landingChatExpanded])

  useEffect(() => {
    document.documentElement.classList.add("landing-bg", "home-landing-bg")
    return () => document.documentElement.classList.remove("landing-bg", "home-landing-bg")
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
    let cancelled = false

    async function loadLeaderboards() {
      try {
        const response = await fetch("/api/leaderboards/top?limit=5&regions=US,JP,KR&icons=1")
        if (!response.ok) return
        const payload = await response.json() as { regions?: LandingRegion[] }
        const regions = payload.regions ?? []
        const preferred = ["US", "JP", "KR"]
        const selected: LandingRegion[] = []

        for (const code of preferred) {
          const match = regions.find(region => region.code.toUpperCase() === code)
          if (match?.players.length) selected.push(match)
        }

        for (const region of regions) {
          if (selected.length >= 3) break
          if (region.code === "global" || !region.players.length || selected.some(item => item.code === region.code)) continue
          selected.push(region)
        }

        if (selected.length < 3) {
          for (const region of regions) {
            if (selected.length >= 3) break
            if (!region.players.length || selected.some(item => item.code === region.code)) continue
            selected.push(region)
          }
        }

        if (cancelled) return
        setLeaderRegions(selected.slice(0, 3))
        setActiveLeaderboardRegion(current =>
          current && selected.some(region => region.code === current)
            ? current
            : selected[0]?.code ?? "",
        )
      } catch {
        if (!cancelled) setLeaderRegions([])
      }
    }

    loadLeaderboards()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadTierPreview() {
      try {
        const response = await fetch("/api/brawlers/stats")
        if (!response.ok) return
        const payload = await response.json() as { stats?: Record<string, BrawlerStats> }
        const stats = Object.values(payload.stats ?? {})
        const totalPicks = stats.reduce((sum, stat) => sum + (Number(stat.picks) || 0), 0)
        const rows = stats
          .map(stat => {
            const picks = Number(stat.picks) || 0
            const winRate = stat.winRate == null ? null : Number(stat.winRate)
            const pickRate = totalPicks > 0 ? (picks / totalPicks) * 100 : 0
            return {
              id: Number(stat.id),
              name: stat.name,
              tier: getPreviewTier(winRate, picks),
              winRate,
              pickRate,
            }
          })
          .filter(row => row.winRate != null && row.pickRate >= 1)
          .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
          .slice(0, 5)

        if (!cancelled) setTierPreview(rows)
      } catch {
        if (!cancelled) setTierPreview([])
      }
    }

    loadTierPreview()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadMapPreview() {
      try {
        const response = await fetch("/api/meta")
        if (!response.ok) return
        const payload = await response.json() as { modes?: ModeInfo[] }
        const maps = (payload.modes ?? [])
          .filter(mode => mode.mode.toLowerCase() !== "unknown")
          .flatMap(mode => mode.maps
            .filter(map => map.name.toLowerCase() !== "unknown")
            .map(map => ({ name: map.name, mode: mode.mode, battles: Number(map.battles) || 0 })),
          )
          .sort((a, b) => b.battles - a.battles)
          .slice(0, 5)

        const rows = await Promise.all(maps.map(async map => {
          try {
            const mapResponse = await fetch(`/api/meta?map=${encodeURIComponent(map.name)}`)
            if (!mapResponse.ok) return { ...map, best: null }
            const mapPayload = await mapResponse.json() as { brawlers?: MapBrawlerPreview[] }
            const best = (mapPayload.brawlers ?? [])
              .filter(brawler => brawler.picks >= 20 && Number.isFinite(brawler.winRate))
              .sort((a, b) => b.winRate - a.winRate)[0] ?? null
            return { ...map, best }
          } catch {
            return { ...map, best: null }
          }
        }))

        if (!cancelled) setMapPreview(rows)
      } catch {
        if (!cancelled) setMapPreview([])
      }
    }

    loadMapPreview()
    return () => {
      cancelled = true
    }
  }, [])

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          pageContext: {
            url: window.location.href,
            path: window.location.pathname,
            title: document.title,
            headings: ["BrawlLens"],
            visibleText: "BrawlLens landing page with leaderboard, tier list, and map meta previews.",
          },
        }),
        signal: controller.signal,
      })

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
            Data for <span className={landingTypewordClass}>{typedTopic || "\u00a0"}</span>
          </p>
          <form
            className={cx(
              landingPromptFormBaseClass,
              landingChatExpanded && landingPromptFormExpandedClass,
            )}
            onSubmit={submitLandingSearch}
          >
            <PulsingBorder
              aria-hidden="true"
              className={landingPromptBorderShaderClass}
              style={landingPromptBorderStyle}
              colors={LANDING_PROMPT_BORDER_COLORS}
              colorBack="#00000000"
              roundness={landingChatExpanded ? 0.1 : 0.32}
              thickness={0.1}
              softness={0.75}
              intensity={0.2}
              bloom={0.25}
              spots={4}
              spotSize={0.5}
              pulse={0.25}
              smoke={0.3}
              smokeSize={0.6}
              speed={1}
              scale={1}
            />
            {landingChatExpanded && (
              <>
                <button type="button" className={landingChatCloseClass} aria-label="Close chat" onClick={closeLandingChat}>
                  <X size={18} strokeWidth={2.4} aria-hidden="true" />
                </button>
                <div className={landingChatBodyClass} aria-live="polite">
                  {landingChatMessages.map((message, index) => (
                    <div key={index} className={cx("flex w-full", message.role === "user" ? "justify-end" : "justify-start")}>
                      <div
                        className={cx(
                          landingChatBubbleBaseClass,
                          message.role === "user"
                            ? "max-w-[min(72%,420px)] rounded-[18px_18px_6px_18px] bg-[#05070b] text-white max-[640px]:rounded-[18px_18px_6px_18px]"
                            : "border border-[rgba(215,235,255,0.10)] bg-white/5",
                        )}
                      >
                        {message.role === "assistant" ? (
                          landingChatStreaming && index === landingChatMessages.length - 1 && message.content === "" ? (
                            <span className={landingChatDotsClass} aria-label="Thinking"><span /><span /><span /></span>
                          ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={landingMarkdownComponents}>{message.content}</ReactMarkdown>
                          )
                        ) : message.content}
                      </div>
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
                rows={landingChatExpanded ? 1 : 3}
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
      </section>

      <section className={landingShowcaseClass} aria-label="BrawlLens previews">
        <div className={cx(previewCardClass, "app-landing-leader-card")}>
          <div className={previewTabsClass} aria-label="Leaderboard regions">
            {leaderRegions.map(region => (
              <button
                key={region.code}
                type="button"
                className={cx(
                  previewTabButtonBaseClass,
                  region.code === activeRegion?.code
                    ? "shadow-[inset_0_-2px_0_#a78bff]"
                    : "hover:shadow-[inset_0_-2px_0_rgba(167,139,255,0.3)]",
                )}
                onClick={() => setActiveLeaderboardRegion(region.code)}
              >
                {leaderboardRegionShort(region.code)}
              </button>
            ))}
          </div>

          <div className={cx(previewHeadClass, previewLeaderGridClass)}>
            <span className="col-start-2">Player</span>
            <span className="col-start-3">Trophies</span>
            <span className="col-start-4">Rank</span>
          </div>

          <div className={previewRowsClass}>
            {(activeRegion?.players ?? []).map(row => (
              <Link key={row.player_tag} href={playerHref(row.player_tag)} className={cx(previewRowClass, previewLeaderGridClass, previewLeaderRowClass)}>
                <span className={previewAvatarClass}>
                  {row.iconId ? (
                    <BrawlImage src={profileIconUrl(row.iconId)} alt="" width={30} height={30} sizes="30px" />
                  ) : initials(row.player_name)}
                </span>
                <span className={previewStackClass}>
                  <strong>{row.player_name}</strong>
                  <small>{row.club_name || `#${cleanTag(row.player_tag)}`}</small>
                </span>
                <strong className="text-left text-[13px] font-[950] text-[var(--bt-text)]">{formatTrophies(Number(row.trophies) || 0)}</strong>
                <strong className="text-left text-[13px] font-[950] text-[var(--bt-text)]">#{row.rank}</strong>
              </Link>
            ))}
          </div>
        </div>

        <div className={cx(previewCardClass, "app-landing-tier-card")}>
          <Link href="/brawlers" className={previewTitleClass}>Season 50 Tierlist &amp; Builds <ArrowRight size={17} strokeWidth={2.7} /></Link>
          <div className={cx(previewHeadClass, previewTierGridClass)}>
            <span className="col-start-2">Brawler</span>
            <span className="col-start-3">Tier</span>
            <span className="col-start-4">Winrate</span>
            <span className="col-start-5">Pickrate</span>
          </div>

          <div className={previewRowsClass}>
            {tierPreview.map(row => (
              <div key={row.id} className={cx(previewRowClass, previewTierGridClass, previewTierRowClass)}>
                <Link href={`/brawlers/${row.id}`} className={previewBrawlerClass}>
                  <BrawlImage src={brawlerIconUrl(row.id)} alt="" width={44} height={44} sizes="44px" />
                  <strong>{row.name}</strong>
                </Link>
                <strong className={previewTierClass} style={{ color: row.tier.color }}>{row.tier.label}</strong>
                <span className={previewRateClass}>
                  <strong style={previewWinRateStyle(row.winRate)}>{formatPercent(row.winRate)}</strong>
                </span>
                <strong className={previewPickClass}>{formatPercent(row.pickRate)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className={cx(previewCardClass, "app-landing-map-card")}>
          <Link href="/meta" className={previewTitleClass}>Map Meta Snapshot <ArrowRight size={17} strokeWidth={2.7} /></Link>
          <div className={cx(previewHeadClass, previewMapGridClass)}>
            <span>Map</span>
            <span>Mode</span>
            <span>Best</span>
            <span>WR</span>
          </div>

          <div className={previewRowsClass}>
            {mapPreview.map(row => (
              <Link key={`${row.mode}-${row.name}`} href={mapHref(row.name)} className={cx(previewRowClass, previewMapGridClass, previewMapRowClass)}>
                <span className={previewStackClass}>
                  <strong>{row.name}</strong>
                  <small>{row.battles.toLocaleString()} battles</small>
                </span>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-left text-[11px] font-[850] text-[rgba(245,244,241,0.72)] max-[720px]:text-[10.5px]">{getModeName(row.mode)}</span>
                <span className={previewMapBrawlerClass}>
                  {row.best ? (
                    <>
                      <BrawlImage src={brawlerIconUrl(row.best.brawlerId)} alt="" width={30} height={30} sizes="30px" />
                      <strong>{row.best.name}</strong>
                    </>
                  ) : "-"}
                </span>
                <strong className="text-left text-[13px] font-[950] [color:var(--preview-win-color,var(--bt-text))]" style={previewWinRateStyle(row.best?.winRate)}>{row.best ? `${row.best.winRate.toFixed(1)}%` : "-"}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
