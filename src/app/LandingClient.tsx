"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type WheelEvent as ReactWheelEvent,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUp, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import ChatLimitDialog from "@/components/ChatLimitDialog"
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background"
import { chatLimitFromResponse, type ChatLimitPayload } from "@/lib/aiLimits"
import { authHeaders } from "@/lib/clientAuth"

const DATA_TOPICS = ["players", "brawlers", "maps", "clubs"]
const LANDING_GRADIENT_COLORS = [
  "#030407",
  "#05060a",
  "#0e1c35",
  "#245ed8",
  "#7c5cff",
  "#ff6da8",
  "#ff8a1f",
]
const LANDING_GRADIENT_STOPS = [0, 30, 45, 61, 75, 88, 100]
function MapTierPreview() {
  const rows = [
    { tier: "S", color: "rgba(255,91,111,0.92)", count: 4 },
    { tier: "A", color: "rgba(255,181,71,0.88)", count: 4 },
    { tier: "B", color: "rgba(95,176,255,0.82)", count: 4 },
    { tier: "C", color: "rgba(124,92,255,0.78)", count: 3 },
  ]
  return (
    <div className="flex w-full flex-col gap-[5px]">
      {rows.map(row => (
        <div key={row.tier} className="flex items-center gap-[6px]">
          <span
            className="grid h-[14px] w-[14px] place-items-center rounded-[3px] text-[8px] font-[680] text-white/85"
            style={{ background: row.color }}
          >
            {row.tier}
          </span>
          <div className="flex flex-1 gap-[4px]">
            {Array.from({ length: row.count }).map((_, i) => (
              <span key={i} className="h-[14px] flex-1 rounded-[3px] bg-white/[0.09]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function BrawlerTierPreview() {
  const rows = [
    { tier: "S", color: "rgba(255,91,111,0.92)", count: 5 },
    { tier: "A", color: "rgba(255,181,71,0.88)", count: 6 },
    { tier: "B", color: "rgba(95,176,255,0.82)", count: 5 },
  ]
  return (
    <div className="flex w-full flex-col gap-[6px]">
      {rows.map(row => (
        <div key={row.tier} className="flex items-center gap-[6px]">
          <span
            className="grid h-[16px] w-[16px] place-items-center rounded-full text-[8px] font-[680] text-white/90"
            style={{ background: row.color }}
          >
            {row.tier}
          </span>
          <div className="flex flex-1 gap-[4px]">
            {Array.from({ length: row.count }).map((_, i) => (
              <span key={i} className="h-[12px] w-[12px] rounded-full bg-white/[0.11]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function PlayerLeaderboardPreview() {
  return (
    <div className="flex w-full flex-col gap-[6px]">
      {[1, 2, 3, 4].map(rank => (
        <div key={rank} className="flex items-center gap-[6px]">
          <span className="w-[10px] text-right text-[9px] font-[520] text-white/40 tabular-nums">{rank}</span>
          <span className="h-[14px] w-[14px] rounded-full bg-white/[0.14]" />
          <span className="h-[5px] flex-1 rounded-full bg-white/[0.07]">
            <span
              className="block h-full rounded-full bg-white/30"
              style={{ width: `${[78, 64, 52, 41][rank - 1]}%` }}
            />
          </span>
          <span className="h-[5px] w-[18px] rounded-full bg-[rgba(255,181,71,0.55)]" />
        </div>
      ))}
    </div>
  )
}

function ClubLeaderboardPreview() {
  return (
    <div className="flex w-full flex-col gap-[6px]">
      {[1, 2, 3, 4].map(rank => (
        <div key={rank} className="flex items-center gap-[6px]">
          <span className="w-[10px] text-right text-[9px] font-[520] text-white/40 tabular-nums">{rank}</span>
          <span className="h-[14px] w-[14px] rotate-45 rounded-[3px] bg-white/[0.14]" />
          <span className="h-[5px] flex-1 rounded-full bg-white/[0.07]">
            <span
              className="block h-full rounded-full bg-white/30"
              style={{ width: `${[82, 71, 58, 45][rank - 1]}%` }}
            />
          </span>
          <span className="h-[5px] w-[14px] rounded-full bg-[rgba(124,92,255,0.55)]" />
        </div>
      ))}
    </div>
  )
}

function BrawlerRankingPreview() {
  const bars = [88, 74, 63, 54, 46]
  return (
    <div className="flex w-full flex-col gap-[6px]">
      {bars.map((w, i) => (
        <div key={i} className="flex items-center gap-[6px]">
          <span className="h-[10px] w-[10px] rounded-full bg-white/[0.14]" />
          <span className="text-[9px] font-[520] text-white/40 tabular-nums">{w}%</span>
          <span className="h-[5px] flex-1 rounded-full bg-white/[0.07]">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-white/35 to-white/15"
              style={{ width: `${w}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  )
}

type CarouselItem = {
  id: string
  label: string
  caption: string
  href: string
  Preview: () => ReactElement
}

const LANDING_CAROUSEL_ITEMS: CarouselItem[] = [
  { id: "map-tier", label: "Map Tierlist", caption: "Best brawlers per map", href: "/meta", Preview: MapTierPreview },
  { id: "brawler-tier", label: "Brawler Tierlist", caption: "Overall meta strength", href: "/brawlers", Preview: BrawlerTierPreview },
  { id: "player-rank", label: "Player Rankings", caption: "Top trophy hunters", href: "/leaderboards/players", Preview: PlayerLeaderboardPreview },
  { id: "club-rank", label: "Club Rankings", caption: "Highest scoring clubs", href: "/leaderboards/clubs", Preview: ClubLeaderboardPreview },
  { id: "brawler-rank", label: "Brawler Rankings", caption: "Sorted by win rate", href: "/leaderboards/brawlers", Preview: BrawlerRankingPreview },
]
const LANDING_CAROUSEL_INITIAL_INDEX = 2

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function getLandingCarouselOffset(index: number, activeIndex: number) {
  return index - activeIndex
}

function clampLandingCarouselIndex(index: number) {
  const last = LANDING_CAROUSEL_ITEMS.length - 1
  if (index < 0) return 0
  if (index > last) return last
  return index
}

const landingShellClass =
  "app-landing-shell relative isolate flex min-h-[calc(100dvh-60px)] flex-1 flex-col overflow-hidden bg-[#05060a] p-0 text-[var(--bt-text)]"
const landingStageClass =
  "relative z-[1] mx-auto grid min-h-[calc(100dvh-160px)] w-[min(1000px,calc(100vw_-_40px))] shrink-0 content-center justify-items-center pb-[clamp(46px,8vh,96px)] pt-[clamp(56px,10vh,120px)] [transform:translateY(clamp(-170px,-14vh,-112px))] max-[640px]:min-h-[calc(100dvh-132px)] max-[640px]:w-[min(calc(100%_-_24px),680px)] max-[640px]:pb-12 max-[640px]:pt-[54px] max-[640px]:[transform:translateY(-68px)] max-[900px]:w-[min(calc(100%_-_24px),680px)]"
const landingBrandWrapClass = "flex w-full justify-center"
const landingTextLogoClass =
  "relative m-0 block bg-[linear-gradient(180deg,#ffffff_0%,#f2f8ff_48%,#9fcfff_100%)] bg-clip-text text-center font-[900] leading-[0.98] tracking-normal text-[#f5f9ff] [filter:drop-shadow(0_8px_18px_rgba(0,0,0,0.34))] [font-family:var(--font-ui)] [text-shadow:0_1px_0_rgba(255,255,255,0.22)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] [-webkit-text-stroke:0] text-[clamp(42px,4.8vw,78px)] max-[640px]:text-[clamp(38px,11.5vw,56px)]"
const landingTrackClass =
  "mt-[clamp(10px,1.5vh,18px)] grid w-[min(760px,100%)] justify-items-center gap-[clamp(10px,1.35vh,14px)] max-[640px]:w-[min(100%,calc(100vw_-_24px))]"
const landingLineClass =
  "m-0 inline-flex min-h-7 min-w-[min(420px,100%)] items-baseline justify-center text-center text-[clamp(16px,1.7vw,23px)] font-[430] leading-[1.28] tracking-normal text-[rgba(231,236,246,0.82)] [font-family:var(--font-ui)] max-[640px]:min-h-[22px] max-[640px]:text-[clamp(15px,4.7vw,18px)]"
const landingTypewordClass =
  "ml-[0.25em] inline-block text-left font-[520] text-[rgba(245,250,255,0.9)]"
const landingPromptFormWrapClass =
  "relative w-[min(740px,100%)] aspect-[5.65/1] max-[640px]:w-[min(100%,calc(100vw_-_24px))]"
const landingPromptFormBaseClass =
  "absolute left-0 right-0 top-0 z-[3] flex h-full min-h-0 flex-col items-stretch gap-0 overflow-hidden border border-[rgba(218,232,255,0.18)] p-0 [background:linear-gradient(180deg,rgba(38,44,58,0.94),rgba(20,24,34,0.95))] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.085),inset_0_-1px_0_rgba(148,172,220,0.06),0_26px_70px_-44px_rgba(0,0,0,0.92)] [container-type:inline-size] [backdrop-filter:blur(16px)_saturate(1.08)] [-webkit-backdrop-filter:blur(16px)_saturate(1.08)] rounded-[18px] transition-[height,border-color,border-radius,box-shadow,transform] duration-[460ms] ease-[cubic-bezier(0.16,1,0.3,1)] focus-within:border-[rgba(230,238,255,0.30)] focus-within:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.11),inset_0_-1px_0_rgba(148,172,220,0.08),0_30px_80px_-48px_rgba(0,0,0,0.96)] max-[640px]:rounded-[16px]"
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
  "relative z-[2] block h-full min-h-0 max-h-none w-full resize-none self-stretch border-0 bg-transparent p-[0_8px_0_0] text-[15px] font-[520] leading-[1.4] tracking-normal text-white outline-0 placeholder:text-[rgba(245,250,255,0.40)] placeholder:opacity-100 focus:border-0 focus:bg-transparent focus:outline-0 [font-family:var(--font-ui)] max-[640px]:text-[14px] max-[640px]:leading-[1.45]"
// Inside the expanded nested pill the textarea should be one line, vertically centered.
const landingTextareaExpandedClass =
  "!h-[20px] !min-h-[20px] max-h-[80px] !self-center !text-[14px] !leading-[1.5]"
const landingSubmitBaseClass =
  "box-border grid size-[30px] min-h-[30px] min-w-[30px] cursor-pointer place-items-center self-end justify-self-end rounded-full border-0 bg-white p-0 text-[#0f172a] outline-none [box-shadow:inset_0_1px_0_rgba(255,255,255,0.55),0_8px_18px_-14px_rgba(0,0,0,0.72)] transition-[background,color,transform,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:enabled:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.65),0_10px_24px_-16px_rgba(0,0,0,0.8)] hover:enabled:scale-105 active:enabled:scale-95 disabled:cursor-default disabled:bg-white/[0.08] disabled:text-white/[0.32] disabled:[box-shadow:none] disabled:opacity-100 max-[640px]:size-[28px] max-[640px]:min-h-[28px] max-[640px]:min-w-[28px]"
// Inside the expanded nested pill the submit sits vertically centered.
const landingSubmitExpandedClass = "!self-center"
const landingSubmitActiveClass = "!bg-[var(--bt-blue)] !text-white hover:enabled:!bg-[#6849f4] hover:enabled:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.16),0_10px_24px_-16px_rgba(0,0,0,0.78)]"
const landingChatHeaderClass =
  "pointer-events-none absolute left-0 right-0 top-0 z-[3] flex items-center justify-between gap-2 border-b border-white/[0.07] bg-[linear-gradient(180deg,rgba(30,35,47,0.96),rgba(25,30,41,0.82)_70%,rgba(25,30,41,0))] px-[18px] pb-[14px] pt-[12px] max-[640px]:px-[14px] max-[640px]:pb-[12px] max-[640px]:pt-[10px]"
const landingChatHeaderTitleClass =
  "inline-flex items-center gap-[8px] text-[11px] font-[700] uppercase tracking-[0.14em] text-[rgba(244,248,255,0.62)] [font-family:var(--font-ui)]"
const landingChatHeaderDotClass =
  "inline-block size-[6px] rounded-full bg-[#a78bff] shadow-none"
const landingChatCloseClass =
  "pointer-events-auto m-0 grid size-[26px] min-h-[26px] min-w-[26px] cursor-pointer place-items-center rounded-full border border-white/[0.08] bg-white/[0.05] p-0 text-white/60 outline-none transition-[background,border-color,color] duration-150 hover:border-white/[0.18] hover:bg-white/[0.10] hover:text-white"
const landingChatBodyClass =
  "relative z-[2] flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto p-[56px_20px_10px_20px] scroll-smooth [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin] max-[640px]:gap-[12px] max-[640px]:p-[48px_14px_6px_14px] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(255,255,255,0.18)] [&::-webkit-scrollbar-track]:bg-transparent"
const landingChatUserBubbleClass =
  "ml-auto max-w-[min(78%,460px)] rounded-[14px_14px_4px_14px] bg-[#7c5cff] px-[13px] py-[8px] text-[13.5px] font-[600] leading-[1.5] text-white [box-shadow:0_10px_22px_-18px_rgba(0,0,0,0.9)] [animation:landingChatMsgIn_380ms_cubic-bezier(0.16,1,0.3,1)_both] max-[640px]:max-w-[88%] max-[640px]:text-[13px]"
const landingChatAssistantClass =
  "w-full max-w-full text-[13.5px] font-[460] leading-[1.65] text-[rgba(244,248,255,0.92)] [animation:landingChatMsgIn_380ms_cubic-bezier(0.16,1,0.3,1)_both] [&>p]:my-0 max-[640px]:text-[13px]"
const landingChatDotsClass =
  "inline-flex gap-[5px] py-1 [&>span]:block [&>span]:size-[5px] [&>span]:rounded-full [&>span]:bg-current [&>span]:opacity-[0.72] [&>span]:[animation:landingChatPulse_980ms_ease-in-out_infinite] [&>span:nth-child(2)]:[animation-delay:120ms] [&>span:nth-child(3)]:[animation-delay:240ms]"
const landingPulseClass =
  "block size-[5px] rounded-full bg-current opacity-[0.72] [animation:landingChatPulse_980ms_ease-in-out_infinite]"
const landingCarouselShellClass =
  "absolute inset-x-0 bottom-[clamp(20px,4.4vh,48px)] z-[2] flex justify-center px-4 transition-opacity duration-300 max-[640px]:bottom-[clamp(14px,3.4vh,24px)]"
const landingCarouselRailClass =
  "relative h-[clamp(232px,26vh,272px)] w-[min(960px,calc(100vw_-_28px))] select-none outline-none [perspective:1400px] [touch-action:pan-y] max-[640px]:h-[216px] max-[640px]:w-[min(100%,calc(100vw_-_20px))]"
const landingCarouselCardBaseClass =
  "group absolute left-1/2 top-1/2 block aspect-[5/4] w-[clamp(196px,22vw,232px)] cursor-pointer overflow-hidden rounded-[18px] border border-[rgba(218,232,255,0.11)] bg-[linear-gradient(180deg,rgba(35,41,55,0.94),rgba(17,21,31,0.92))] p-[14px_14px_12px_14px] text-left no-underline outline-none [-webkit-backdrop-filter:blur(14px)] [backdrop-filter:blur(14px)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(148,172,220,0.05),0_28px_60px_-28px_rgba(0,0,0,0.95)] [transform-style:preserve-3d] [will-change:transform,opacity,filter] focus-visible:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.11),0_0_0_2px_rgba(230,238,255,0.30),0_28px_60px_-28px_rgba(0,0,0,0.95)] max-[640px]:w-[clamp(176px,58vw,208px)] max-[640px]:rounded-[16px] max-[640px]:p-[12px]"
const LANDING_CARD_SETTLE_TRANSITION =
  "transform 620ms cubic-bezier(0.16,1,0.3,1), opacity 620ms cubic-bezier(0.16,1,0.3,1), filter 620ms cubic-bezier(0.16,1,0.3,1), box-shadow 620ms cubic-bezier(0.16,1,0.3,1)"
const landingCarouselCtaClass =
  "absolute left-1/2 top-1/2 z-[5] inline-flex items-center gap-[8px] whitespace-nowrap rounded-full border border-[rgba(218,232,255,0.16)] bg-[rgba(30,36,49,0.86)] px-[12px] py-[7px] text-[11px] font-[620] tracking-[0.04em] text-white/88 no-underline outline-none [-webkit-backdrop-filter:blur(10px)] [backdrop-filter:blur(10px)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.09),0_18px_38px_-20px_rgba(0,0,0,0.9)] [font-family:var(--font-ui)] hover:bg-[rgba(38,44,58,0.90)] hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.11),0_22px_44px_-20px_rgba(0,0,0,0.95)] focus-visible:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.11),0_0_0_2px_rgba(230,238,255,0.30),0_22px_44px_-20px_rgba(0,0,0,0.95)] max-[640px]:px-[11px] max-[640px]:py-[6px] max-[640px]:text-[10.5px]"
const LANDING_CTA_TRANSITION =
  "transform 520ms cubic-bezier(0.16,1,0.3,1), opacity 520ms cubic-bezier(0.16,1,0.3,1), box-shadow 320ms ease-out, background-color 200ms ease-out"
const landingCarouselKbdClass =
  "grid h-[17px] min-w-[17px] place-items-center rounded-[4px] border border-white/[0.16] bg-white/[0.06] px-[4px] text-[10px] font-[640] leading-none text-white/75 [font-family:var(--font-ui)]"

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
    <blockquote className="my-2 border-l-2 border-[rgba(167,139,255,0.5)] pl-3 text-[rgba(244,248,255,0.72)]">
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
  const [landingCarouselIndex, setLandingCarouselIndex] = useState(LANDING_CAROUSEL_INITIAL_INDEX)
  const [landingCarouselDragPx, setLandingCarouselDragPx] = useState(0)
  const [landingCarouselDragging, setLandingCarouselDragging] = useState(false)
  const [landingCarouselSpacingPx, setLandingCarouselSpacingPx] = useState(180)
  const [landingCarouselCardWidthPx, setLandingCarouselCardWidthPx] = useState(220)
  const landingChatAbortRef = useRef<AbortController | null>(null)
  const landingChatBottomRef = useRef<HTMLDivElement>(null)
  const landingPromptResetRef = useRef<number | null>(null)
  const landingCarouselPointerRef = useRef<{ x: number; y: number; t: number; pointerId: number; axisLocked: "x" | "y" | null } | null>(null)
  const landingCarouselWheelAccumRef = useRef(0)
  const landingCarouselWheelTimerRef = useRef<number | null>(null)
  const landingCarouselWheelRafRef = useRef<number | null>(null)
  const landingCarouselIndexRef = useRef(LANDING_CAROUSEL_INITIAL_INDEX)
  const landingCarouselSuppressClickRef = useRef(false)
  const landingCarouselRailRef = useRef<HTMLDivElement>(null)
  const landingPromptHasValue = landingQuery.trim().length > 0
  const landingRouter = useRouter()
  const landingActiveItem = LANDING_CAROUSEL_ITEMS[landingCarouselIndex]
  const [landingLabelSwap, setLandingLabelSwap] = useState<{
    current: CarouselItem
    previous: CarouselItem | null
    direction: 1 | -1
    swapId: number
  }>({
    current: LANDING_CAROUSEL_ITEMS[LANDING_CAROUSEL_INITIAL_INDEX],
    previous: null,
    direction: 1,
    swapId: 0,
  })

  useEffect(() => {
    setLandingLabelSwap(state => {
      if (state.current.id === landingActiveItem.id) return state
      const prevIdx = LANDING_CAROUSEL_ITEMS.findIndex(i => i.id === state.current.id)
      const newIdx = LANDING_CAROUSEL_ITEMS.findIndex(i => i.id === landingActiveItem.id)
      const direction: 1 | -1 = newIdx >= prevIdx ? 1 : -1
      return {
        current: landingActiveItem,
        previous: state.current,
        direction,
        swapId: state.swapId + 1,
      }
    })
  }, [landingActiveItem])

  useEffect(() => {
    if (!landingLabelSwap.previous) return
    const t = window.setTimeout(() => {
      setLandingLabelSwap(state => ({ ...state, previous: null }))
    }, 540)
    return () => window.clearTimeout(t)
  }, [landingLabelSwap.swapId, landingLabelSwap.previous])

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
    body.style.setProperty("background", "#05060a", "important")
    body.style.setProperty("background-image", "none", "important")
    body.style.setProperty("background-attachment", "scroll", "important")
    body.style.setProperty("height", "100dvh", "important")
    body.style.setProperty("min-height", "100dvh", "important")
    body.style.setProperty("overflow", "hidden", "important")
    body.style.setProperty("overflow-y", "hidden", "important")
    body.style.setProperty("overscroll-behavior", "none", "important")
    mainShell?.style.setProperty("height", "100dvh", "important")
    mainShell?.style.setProperty("min-height", "100dvh", "important")
    mainShell?.style.setProperty("overflow", "hidden", "important")
    nav?.style.setProperty("background", "#0d0d11", "important")
    nav?.style.setProperty("background-color", "#0d0d11", "important")
    nav?.style.setProperty("backdrop-filter", "none", "important")
    nav?.style.setProperty("-webkit-backdrop-filter", "none", "important")

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
      if (landingCarouselWheelTimerRef.current) window.clearTimeout(landingCarouselWheelTimerRef.current)
      if (landingCarouselWheelRafRef.current !== null) window.cancelAnimationFrame(landingCarouselWheelRafRef.current)
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

  const rotateLandingCarousel = useCallback((direction: number) => {
    setLandingCarouselIndex(index => clampLandingCarouselIndex(index + direction))
  }, [])

  useEffect(() => {
    landingCarouselIndexRef.current = landingCarouselIndex
  }, [landingCarouselIndex])

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth
      setLandingCarouselSpacingPx(Math.max(150, Math.min(220, vw * 0.18)))
      if (vw <= 640) {
        setLandingCarouselCardWidthPx(Math.max(176, Math.min(208, vw * 0.58)))
      } else {
        setLandingCarouselCardWidthPx(Math.max(196, Math.min(232, vw * 0.22)))
      }
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  useEffect(() => {
    const handleLandingCarouselKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || landingChatExpanded) return

      const target = event.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        rotateLandingCarousel(-1)
      }

      if (event.key === "ArrowRight") {
        event.preventDefault()
        rotateLandingCarousel(1)
      }

      if (event.key === "Enter") {
        event.preventDefault()
        landingRouter.push(landingActiveItem.href)
      }
    }

    window.addEventListener("keydown", handleLandingCarouselKeyDown)
    return () => window.removeEventListener("keydown", handleLandingCarouselKeyDown)
  }, [landingChatExpanded, rotateLandingCarousel, landingRouter, landingActiveItem.href])

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

  function applyLandingCarouselWheelFrame() {
    landingCarouselWheelRafRef.current = null

    const spacing = landingCarouselSpacingPx
    if (spacing <= 0) return

    const lastIdx = LANDING_CAROUSEL_ITEMS.length - 1
    let idx = landingCarouselIndexRef.current
    let g = landingCarouselWheelAccumRef.current

    // Commit index changes on full-spacing crossings (advance/retreat without visual jump)
    while (g <= -spacing && idx < lastIdx) {
      idx += 1
      g += spacing
    }
    while (g >= spacing && idx > 0) {
      idx -= 1
      g -= spacing
    }

    // Hard stop at edges, no rubber-band, no over-scroll
    if (idx === 0 && g > 0) g = 0
    if (idx === lastIdx && g < 0) g = 0

    landingCarouselWheelAccumRef.current = g
    landingCarouselIndexRef.current = idx
    setLandingCarouselDragging(true)
    setLandingCarouselDragPx(g)
    setLandingCarouselIndex(idx)
  }

  function handleLandingCarouselWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (landingCarouselPointerRef.current?.axisLocked === "x") return

    const rawDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
    if (Math.abs(rawDelta) < 0.4) return

    const lastIdx = LANDING_CAROUSEL_ITEMS.length - 1
    const curIdx = landingCarouselIndexRef.current
    const accum = landingCarouselWheelAccumRef.current

    // Hard stop: at first card, ignore wheel that would scroll further backward
    // accum stays simulated-finger-delta: positive = visually drag right (= go backward)
    // rawDelta > 0 means scroll right = advance = subtract from accum (accum decreases)
    // If at start and accum >= 0 and rawDelta < 0 (scroll left, would go backward) → drop
    if (curIdx === 0 && rawDelta < 0 && accum >= 0) return
    if (curIdx === lastIdx && rawDelta > 0 && accum <= 0) return

    landingCarouselWheelAccumRef.current = accum - rawDelta

    if (landingCarouselWheelRafRef.current === null) {
      landingCarouselWheelRafRef.current = window.requestAnimationFrame(applyLandingCarouselWheelFrame)
    }

    if (landingCarouselWheelTimerRef.current) window.clearTimeout(landingCarouselWheelTimerRef.current)
    landingCarouselWheelTimerRef.current = window.setTimeout(() => {
      landingCarouselWheelTimerRef.current = null
      // Snap any leftover gesture to the nearest card
      const spacing = landingCarouselSpacingPx
      const leftover = landingCarouselWheelAccumRef.current
      landingCarouselWheelAccumRef.current = 0
      const snapShift = spacing > 0 ? -Math.round(leftover / spacing) : 0
      setLandingCarouselDragging(false)
      window.requestAnimationFrame(() => {
        if (snapShift !== 0) {
          const nextIdx = clampLandingCarouselIndex(landingCarouselIndexRef.current + snapShift)
          landingCarouselIndexRef.current = nextIdx
          setLandingCarouselIndex(nextIdx)
        }
        setLandingCarouselDragPx(0)
      })
    }, 110)
  }

  function handleLandingCarouselPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return
    // Cancel any in-flight wheel-driven drag so pointer takes over cleanly
    if (landingCarouselWheelTimerRef.current) {
      window.clearTimeout(landingCarouselWheelTimerRef.current)
      landingCarouselWheelTimerRef.current = null
      landingCarouselWheelAccumRef.current = 0
      setLandingCarouselDragPx(0)
      setLandingCarouselDragging(false)
    }
    landingCarouselPointerRef.current = {
      x: event.clientX,
      y: event.clientY,
      t: window.performance.now(),
      pointerId: event.pointerId,
      axisLocked: null,
    }
  }

  function handleLandingCarouselPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = landingCarouselPointerRef.current
    if (!start) return

    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y

    if (!start.axisLocked) {
      if (Math.abs(deltaX) < 4 && Math.abs(deltaY) < 4) return
      start.axisLocked = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y"
      if (start.axisLocked === "x") {
        try {
          event.currentTarget.setPointerCapture(start.pointerId)
        } catch {}
        setLandingCarouselDragging(true)
      } else {
        landingCarouselPointerRef.current = null
        return
      }
    }

    if (start.axisLocked !== "x") return

    event.preventDefault()
    const lastIdx = LANDING_CAROUSEL_ITEMS.length - 1
    const atStart = landingCarouselIndex === 0
    const atEnd = landingCarouselIndex === lastIdx
    let effective = Math.max(-landingCarouselSpacingPx * 2.4, Math.min(landingCarouselSpacingPx * 2.4, deltaX))
    // Hard stop at edges, no over-scroll past the first/last card
    if (atStart && effective > 0) effective = 0
    if (atEnd && effective < 0) effective = 0
    setLandingCarouselDragPx(effective)
  }

  function endLandingCarouselDrag(event: ReactPointerEvent<HTMLDivElement> | null) {
    const start = landingCarouselPointerRef.current
    landingCarouselPointerRef.current = null

    if (!start || start.axisLocked !== "x") {
      setLandingCarouselDragging(false)
      setLandingCarouselDragPx(0)
      return
    }

    const dx = event ? event.clientX - start.x : 0
    const dt = window.performance.now() - start.t
    const velocity = dx / Math.max(dt, 1)

    let shift = -Math.round(dx / landingCarouselSpacingPx)
    if (shift === 0 && Math.abs(velocity) > 0.55 && Math.abs(dx) > 14) {
      shift = velocity < 0 ? 1 : -1
    }

    if (shift !== 0) {
      landingCarouselSuppressClickRef.current = true
      window.setTimeout(() => {
        landingCarouselSuppressClickRef.current = false
      }, 280)
    }

    try {
      event?.currentTarget.releasePointerCapture(start.pointerId)
    } catch {}

    // Step 1: re-enable transitions while drag offset is still applied (no value change → no animation)
    setLandingCarouselDragging(false)

    // Step 2: next frame, snap drag offset back + apply index shift so transitions animate to settled state
    window.requestAnimationFrame(() => {
      if (shift !== 0) {
        setLandingCarouselIndex(idx => clampLandingCarouselIndex(idx + shift))
      }
      setLandingCarouselDragPx(0)
    })
  }

  function handleLandingCarouselPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    endLandingCarouselDrag(event)
  }

  function handleLandingCarouselPointerCancel() {
    endLandingCarouselDrag(null)
  }

  return (
    <main className={landingShellClass}>
      <AnimatedGradientBackground
        Breathing
        startingGap={88}
        animationSpeed={0.014}
        breathingRange={3}
        topOffset={0}
        gradientColors={LANDING_GRADIENT_COLORS}
        gradientStops={LANDING_GRADIENT_STOPS}
        containerClassName="pointer-events-none z-0"
      />
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
                <div className={landingChatHeaderClass}>
                  <span className={landingChatHeaderTitleClass}>
                    <span className={landingChatHeaderDotClass} aria-hidden="true" />
                    BrawlLens AI
                  </span>
                  <button type="button" className={landingChatCloseClass} aria-label="Close chat" onClick={closeLandingChat}>
                    <X size={14} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </div>
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
        className={cx(landingCarouselShellClass, landingChatExpanded && "pointer-events-none opacity-0")}
        aria-label="Explore BrawlLens pages"
        aria-hidden={landingChatExpanded}
      >
        <div
          ref={landingCarouselRailRef}
          className={landingCarouselRailClass}
          role="group"
          aria-roledescription="carousel"
          aria-label="Page destinations"
          onWheel={landingChatExpanded ? undefined : handleLandingCarouselWheel}
          onPointerDown={landingChatExpanded ? undefined : handleLandingCarouselPointerDown}
          onPointerMove={landingChatExpanded ? undefined : handleLandingCarouselPointerMove}
          onPointerUp={landingChatExpanded ? undefined : handleLandingCarouselPointerUp}
          onPointerCancel={landingChatExpanded ? undefined : handleLandingCarouselPointerCancel}
          style={{ cursor: landingChatExpanded ? "default" : landingCarouselDragging ? "grabbing" : "grab" }}
        >
          <Link
            href={landingActiveItem.href}
            className={landingCarouselCtaClass}
            aria-label={`Open ${landingActiveItem.label}`}
            draggable={false}
            tabIndex={landingChatExpanded ? -1 : undefined}
            style={{
              opacity: landingCarouselDragging ? 0.35 : 1,
              pointerEvents: landingChatExpanded ? "none" : "auto",
              transform: `translate(-50%, calc(-100% - ${landingCarouselCardWidthPx * 0.4 + (landingCarouselDragging ? 8 : 14)}px))`,
              transition: LANDING_CTA_TRANSITION,
            }}
            onClick={event => {
              if (landingChatExpanded || landingCarouselSuppressClickRef.current) event.preventDefault()
            }}
          >
            <span className={landingCarouselKbdClass} aria-hidden="true">↵</span>
            <span className="relative inline-block overflow-hidden align-middle leading-[1.2]">
              <span aria-hidden="true" className="invisible inline-block whitespace-nowrap">
                Open {landingLabelSwap.current.label}
              </span>
              {landingLabelSwap.previous && (
                <span
                  key={`prev-${landingLabelSwap.swapId}`}
                  aria-hidden="true"
                  className="absolute inset-0 inline-flex items-center justify-start whitespace-nowrap"
                  style={{
                    animation: `landingCtaRollOut${landingLabelSwap.direction === 1 ? "Up" : "Down"} 520ms cubic-bezier(0.55,0,0.2,1) both`,
                    willChange: "transform, opacity, filter",
                  }}
                >
                  Open {landingLabelSwap.previous.label}
                </span>
              )}
              <span
                key={`curr-${landingLabelSwap.swapId}`}
                className="absolute inset-0 inline-flex items-center justify-start whitespace-nowrap"
                style={{
                  animation: `landingCtaRollIn${landingLabelSwap.direction === 1 ? "Up" : "Down"} 520ms cubic-bezier(0.55,0,0.2,1) both`,
                  willChange: "transform, opacity, filter",
                }}
              >
                Open {landingLabelSwap.current.label}
              </span>
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="h-[11px] w-[11px]"
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
          {LANDING_CAROUSEL_ITEMS.map((item, index) => {
            const discreteOffset = getLandingCarouselOffset(index, landingCarouselIndex)
            const dragFrac = landingCarouselSpacingPx > 0 ? landingCarouselDragPx / landingCarouselSpacingPx : 0
            const fracOffset = discreteOffset + dragFrac
            const absFrac = Math.abs(fracOffset)
            const sign = fracOffset === 0 ? 0 : fracOffset > 0 ? 1 : -1

            const scale = absFrac >= 2 ? 0.6 : absFrac >= 1 ? 0.78 + (1 - absFrac) * 0.22 : 1 - absFrac * 0.22
            const rotateMag = absFrac >= 2 ? 50 : absFrac >= 1 ? 34 + (absFrac - 1) * 16 : absFrac * 34
            const rotateY = -sign * rotateMag
            const txMultiplier = absFrac >= 2 ? 1.62 + (absFrac - 2) * 0.4 : absFrac >= 1 ? 1 + (absFrac - 1) * 0.62 : absFrac
            const translateX = sign * txMultiplier * landingCarouselSpacingPx
            const translateZ = absFrac >= 2 ? -200 : absFrac >= 1 ? -90 - (absFrac - 1) * 110 : -absFrac * 90
            const opacity = absFrac >= 2.6 ? 0 : absFrac >= 2 ? 0.28 * (1 - (absFrac - 2) / 0.6) : absFrac >= 1 ? 0.66 - (absFrac - 1) * 0.38 : 1 - absFrac * 0.34
            const blur = absFrac >= 1.6 ? Math.min(2.4, (absFrac - 1.6) * 3) : 0
            const isActive = Math.abs(discreteOffset) === 0
            const outOfRange = Math.abs(discreteOffset) > 2
            const isHidden = outOfRange || absFrac >= 2.6
            const finalOpacity = outOfRange ? 0 : opacity
            const itemStyle: CSSProperties = {
              opacity: finalOpacity,
              pointerEvents: landingChatExpanded || isHidden ? "none" : "auto",
              transform: `translate(-50%, -50%) translate3d(${translateX.toFixed(2)}px, 0px, ${translateZ.toFixed(1)}px) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
              zIndex: 20 - Math.round(absFrac * 2),
              filter: blur > 0 ? `blur(${blur.toFixed(2)}px)` : "none",
              transition: landingCarouselDragging ? "none" : LANDING_CARD_SETTLE_TRANSITION,
            }
            const Preview = item.Preview

            const cardBody = (
              <>
                <div className="flex items-center justify-center">
                  <span className="text-[10px] font-[520] uppercase tracking-[0.18em] text-center text-white/45 [font-family:var(--font-ui)]">
                    {item.caption}
                  </span>
                </div>
                <div className="mt-[10px] flex flex-1 items-center">
                  <Preview />
                </div>
                <div className="mt-[10px] flex items-center justify-between gap-2">
                  <span className="text-[13px] font-[620] tracking-[-0.005em] text-white/92 [font-family:var(--font-ui)] max-[640px]:text-[12.5px]">
                    {item.label}
                  </span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className={cx(
                      "h-[12px] w-[12px] transition-[transform,opacity] duration-300",
                      isActive ? "opacity-90" : "opacity-40 group-hover:opacity-70",
                    )}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 8h8" />
                    <path d="M9 4l4 4-4 4" />
                  </svg>
                </div>
              </>
            )

            if (isActive) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={landingCarouselCardBaseClass}
                  style={itemStyle}
                  draggable={false}
                  tabIndex={landingChatExpanded ? -1 : undefined}
                  aria-hidden={landingChatExpanded}
                  aria-label={`Open ${item.label}`}
                  onClick={event => {
                    if (landingChatExpanded || landingCarouselSuppressClickRef.current) event.preventDefault()
                  }}
                >
                  <div className="flex h-full flex-col">{cardBody}</div>
                </Link>
              )
            }

            return (
              <button
                key={item.id}
                type="button"
                className={landingCarouselCardBaseClass}
                style={itemStyle}
                tabIndex={landingChatExpanded || isHidden ? -1 : 0}
                aria-hidden={landingChatExpanded || isHidden}
                aria-label={`Show ${item.label}`}
                onClick={() => {
                  if (landingChatExpanded || landingCarouselSuppressClickRef.current) return
                  setLandingCarouselIndex(index)
                }}
              >
                <div className="flex h-full flex-col">{cardBody}</div>
              </button>
            )
          })}
        </div>
      </nav>

      <ChatLimitDialog gate={landingLimitGate} onClose={() => setLandingLimitGate(null)} />
    </main>
  )
}
