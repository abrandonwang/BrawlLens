"use client"

/* eslint-disable @next/next/no-img-element */

import { useEffect, type CSSProperties, type ReactNode } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Search,
  Trophy,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { leaderboardRegionShort } from "@/lib/leaderboardRegions"

export type LeaderboardKind = "players" | "clubs" | "brawlers"

export type FeatureCard = {
  title: string
  detail: string
  flagCode?: string
  flagLabel?: string
  href?: string
  region?: string
  accent?: string
  logoUrl?: string
  logoFilter?: string
  logoBgFilter?: string
  logoBgOpacity?: string
  logoBgFit?: string
  logoBgPosition?: string
  logoBgSize?: string
  logoBgTop?: string
  logoBlendMode?: string
  logoSurface?: string
}

export const professionalTeamCards: FeatureCard[] = [
  {
    title: "Crazy Raccoons",
    detail: "Moya · Tensai · Milkreo",
    flagCode: "jp",
    flagLabel: "Japan",
    href: "/leaderboards/pro/crazy-raccoons",
    accent: "#e43747",
    logoUrl: "/team-logos/crazy-raccoons-transparent.png",
    logoBgFilter: "grayscale(1) brightness(0)",
    logoBgOpacity: "0.2",
    logoBgFit: "contain",
    logoBgPosition: "center",
    logoBgSize: "172px",
    logoBgTop: "-14px",
    logoBlendMode: "multiply",
  },
  {
    title: "HMBLE",
    detail: "Symantec · Lukii · BosS",
    flagCode: "it",
    flagLabel: "Italy",
    href: "/leaderboards/pro/hmble",
    accent: "#8ad7ff",
    logoUrl: "/team-logos/hmble.png",
    logoFilter: "brightness(0)",
    logoBgOpacity: "0.22",
    logoBgPosition: "center",
    logoBgSize: "218px",
    logoBgTop: "-26px",
  },
  {
    title: "ZETA",
    detail: "Sitetampo · Sizuku · Batman",
    flagCode: "jp",
    flagLabel: "Japan",
    href: "/leaderboards/pro/zeta",
    accent: "#d5efff",
    logoUrl: "/team-logos/zeta-transparent.png",
    logoBgFilter: "grayscale(1) brightness(0)",
    logoBgOpacity: "0.2",
    logoBgFit: "contain",
    logoBgPosition: "center",
    logoBgSize: "170px",
    logoBgTop: "-18px",
    logoBlendMode: "multiply",
  },
  {
    title: "SK Gaming",
    detail: "Yoshi · Ope · Nowy297",
    flagCode: "de",
    flagLabel: "Germany",
    href: "/leaderboards/pro/sk-gaming",
    accent: "#ff9f6e",
    logoUrl: "/team-logos/sk-gaming.svg",
    logoFilter: "brightness(0)",
    logoBgOpacity: "0.2",
    logoBgPosition: "center",
    logoBgSize: "154px",
    logoBgTop: "-8px",
  },
]

const tabs = [
  { key: "players", label: "Players", href: "/leaderboards/players" },
  { key: "clubs", label: "Clubs", href: "/leaderboards/clubs" },
  { key: "brawlers", label: "Brawlers", href: "/leaderboards/brawlers" },
] as const

const leaderboardSubnavSlotClass =
  "relative z-[70] min-h-[54px] w-full px-3.5 max-[640px]:min-h-[50px] max-[640px]:px-2.5"

const leaderboardSubnavWrapClass =
  "sticky top-[86px] z-[80] mx-auto w-[min(1180px,calc(100vw-28px))] overflow-hidden rounded-[14px] border border-[rgba(255,255,255,0.10)] bg-[rgba(16,16,22,0.74)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_36px_-28px_rgba(0,0,0,0.82)] backdrop-blur-[18px] backdrop-saturate-[1.18] max-[820px]:top-[76px] max-[640px]:w-[calc(100vw-20px)]"

const leaderboardSubnavClass =
  "flex h-11 w-full items-center justify-center gap-1 border-0 p-1 max-[640px]:h-[42px]"

const leaderboardTabBaseClass =
  "relative inline-flex h-9 min-w-0 items-center justify-center rounded-[10px] border border-transparent px-3.5 text-[12px] font-[820] leading-none no-underline text-[rgba(245,244,241,0.66)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f5f4f1] max-[640px]:flex-1 max-[640px]:basis-0 max-[640px]:px-2.5"

const leaderboardTabActiveClass =
  "!border-[rgba(124,92,255,0.28)] !bg-[rgba(124,92,255,0.16)] !text-[#f5f4f1]"

const leaderboardToolbarClass =
  "mb-2.5 flex items-center justify-between gap-2.5 p-0 max-[1024px]:flex-col max-[1024px]:items-stretch"

export const leaderboardToolbarActionsClass =
  "flex min-w-0 items-center justify-end gap-2 max-[1024px]:justify-between max-[560px]:flex-col max-[560px]:items-stretch"

export const leaderboardActionClass =
  "inline-flex h-[38px] cursor-pointer items-center justify-center rounded-[7px] border border-[rgba(0,0,0,0.2)] bg-[var(--lb-text)] px-3.5 text-[13px] font-[750] text-[#111214] no-underline shadow-[rgba(255,255,255,0.18)_0_0.5px_0_0_inset,rgba(0,0,0,0.2)_0_0_0_0.5px_inset,rgba(0,0,0,0.05)_0_1px_2px_0] hover:brightness-[1.04]"

const leaderboardSearchClass =
  "flex h-[34px] w-[min(100%,330px)] items-center gap-[9px] rounded-[5px] border border-[var(--lb-line)] bg-[var(--panel)] px-[11px] text-[var(--lb-text-3)] focus-within:border-[var(--lb-line-2)] focus-within:bg-[var(--lb-panel-2)] max-[1024px]:w-full"

const leaderboardSearchInputClass =
  "min-w-0 w-full border-0 bg-transparent text-[13px] font-semibold leading-none text-[var(--lb-text)] outline-none placeholder:text-[rgba(245,244,241,0.38)] [font-family:var(--font-label)]"

const leaderboardRegionPillsClass =
  "flex h-[34px] min-w-0 items-center gap-1 overflow-hidden rounded-[5px] border border-[var(--lb-line)] bg-[var(--panel)] p-[3px] max-[560px]:overflow-x-auto max-[560px]:[scrollbar-width:none] max-[560px]:[&::-webkit-scrollbar]:hidden"

const leaderboardRegionPillBaseClass =
  "inline-flex h-[26px] min-w-9 cursor-pointer items-center justify-center rounded-[5px] border border-transparent bg-transparent text-[12px] font-[850] text-[var(--lb-text-3)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] hover:border-[rgba(245,244,241,0.13)] hover:bg-[var(--panel)] hover:text-[var(--lb-text)]"

const leaderboardRegionPillActiveClass =
  "!border-[#a78bff] !bg-[#7c5cff] !text-white shadow-none outline-none"

const leaderboardSelectClass =
  "relative flex h-[38px] min-w-[142px] items-center gap-2 rounded-[7px] border border-[var(--lb-line)] bg-[var(--lb-panel-2)] pl-[11px] text-[var(--lb-text-3)]"

const leaderboardSelectControlClass =
  "min-w-0 flex-1 appearance-none border-0 bg-transparent pr-7 text-[13px] font-bold text-[var(--lb-text)] outline-none"

export const leaderboardShellClass =
  "min-h-[calc(100dvh-60px)] w-full overflow-x-clip bg-[var(--bg)] text-[var(--lb-text)] [--lb-accent:#7c5cff] [--lb-bg:#000000] [--lb-blue:#7c5cff] [--lb-line-2:rgba(245,244,241,0.10)] [--lb-line:rgba(245,244,241,0.07)] [--lb-nav:var(--panel)] [--lb-panel-2:#15151b] [--lb-panel-3:#26262d] [--lb-panel:#0d0d11] [--lb-text-2:rgba(245,244,241,0.76)] [--lb-text-3:rgba(245,244,241,0.52)] [--lb-text-4:rgba(245,244,241,0.34)] [--lb-text:#f5f4f1] [--lb-warm:#ff9f6e] [font-family:var(--font-ui)]"

export const leaderboardFrameClass =
  "mx-auto w-[min(1120px,calc(100vw-20px))] px-0 pb-[18px] pt-2.5 max-[560px]:w-[min(1120px,calc(100vw-48px))]"

export const leaderboardBoardClass =
  "overflow-hidden rounded-[8px] border border-[rgba(245,244,241,0.055)] bg-[var(--panel)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_22px_60px_-46px_rgba(0,0,0,0.82)] max-[560px]:p-2"

export const leaderboardPanelClass =
  "mt-1.5 overflow-x-auto overflow-y-visible rounded-none border-0 bg-transparent [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[560px]:-mx-0.5"

export const leaderboardTableHeadClass =
  "mb-1.5 min-h-8 rounded-[4px] border border-[rgba(245,244,241,0.08)] bg-[var(--panel)] px-2.5 py-0 text-left text-[10.5px] font-[760] leading-none tracking-[0] text-[var(--lb-text-2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] [font-family:var(--font-label)] [&>span]:min-w-0 [&>span]:overflow-hidden [&>span]:text-ellipsis [&>span]:whitespace-nowrap max-[1024px]:min-w-[660px] max-[1024px]:px-1.5 max-[1024px]:text-[10px] max-[560px]:px-1 max-[560px]:pb-1.5 max-[560px]:text-[9px]"

export const leaderboardTableListClass =
  "grid gap-[3px] bg-transparent"

export const leaderboardRowClass =
  "min-h-[39px] rounded-[4px] border border-[rgba(245,244,241,0.065)] bg-[var(--panel)] px-2.5 py-[3px] text-[var(--lb-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.032)] max-[1024px]:min-h-[35px] max-[1024px]:min-w-[660px] max-[1024px]:px-1.5 max-[560px]:min-h-8 max-[560px]:px-1 max-[560px]:py-0.5"

export const leaderboardRankStackClass =
  "grid min-w-0 content-center justify-items-center gap-[3px] [&>span:last-child]:max-w-full [&>span:last-child]:overflow-hidden [&>span:last-child]:text-ellipsis [&>span:last-child]:whitespace-nowrap [&>span:last-child]:text-[11px] [&>span:last-child]:font-[760] [&>span:last-child]:uppercase [&>span:last-child]:leading-none [&>span:last-child]:text-[var(--lb-text-3)] max-[560px]:[&>span:last-child]:text-[8px]"

export const leaderboardIdentityClass =
  "flex min-w-0 items-center gap-2"

export const leaderboardIdentityLinkClass =
  "flex min-w-0 items-center gap-2 rounded-[7px] text-inherit no-underline transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[rgba(142,213,255,0.42)]"

export const leaderboardPlayerLinkClass =
  `${leaderboardIdentityLinkClass} w-fit max-w-full`

export const leaderboardRowPlayerLinkClass =
  `${leaderboardIdentityLinkClass} w-full overflow-hidden`

export const leaderboardNameClass =
  "overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-[850] leading-[1.16] text-[var(--lb-text)] max-[1024px]:text-[12px] max-[560px]:text-[11px]"

export const leaderboardRowNameClass =
  "overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-[850] leading-[1.16] text-[var(--lb-text)] max-[1024px]:text-[12px] max-[560px]:text-[11px]"

export const leaderboardSublineClass =
  "mt-[3px] overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold leading-[1.15] text-[var(--lb-text-3)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] max-[1024px]:text-[9px] max-[560px]:text-[8px]"

export const leaderboardRowSublineClass =
  "mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[9.5px] font-semibold leading-[1.15] text-[var(--lb-text-3)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] max-[1024px]:text-[9px] max-[560px]:text-[8px]"

export const leaderboardAvatarClass =
  "grid size-10 shrink-0 place-items-center overflow-hidden rounded-[7px] border border-[color-mix(in_srgb,currentColor_24%,var(--lb-line))] bg-[radial-gradient(circle_at_34%_22%,color-mix(in_srgb,currentColor_12%,transparent),transparent_48%),var(--panel-2)] text-[14px] font-black leading-none text-[var(--lb-accent)] shadow-[0_2px_6px_rgba(0,0,0,0.06)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] [text-shadow:0_1px_8px_color-mix(in_srgb,currentColor_38%,transparent)] [&_img]:size-full [&_img]:object-cover"

export const leaderboardRowAvatarClass =
  "grid size-8 shrink-0 place-items-center overflow-hidden rounded-md border border-[color-mix(in_srgb,currentColor_24%,var(--lb-line))] bg-[radial-gradient(circle_at_34%_22%,color-mix(in_srgb,currentColor_12%,transparent),transparent_48%),var(--panel-2)] text-[12px] font-black leading-none text-[var(--lb-accent)] shadow-[0_2px_6px_rgba(0,0,0,0.06)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] [text-shadow:0_1px_8px_color-mix(in_srgb,currentColor_38%,transparent)] [&_img]:size-full [&_img]:object-cover max-[1024px]:size-7 max-[560px]:size-[25px] max-[560px]:rounded-[5px]"

export const leaderboardRowMainClass = "min-w-0"

export const leaderboardRowStatClass =
  "whitespace-nowrap text-left text-[17px] font-[850] text-[var(--lb-blue)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] max-[1024px]:text-[14px] max-[560px]:text-[12px]"

export const leaderboardRowMonoClass =
  "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-bold text-[var(--lb-text-2)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] max-[1024px]:text-[10px] max-[560px]:text-[9px]"

export const leaderboardRowMutedClass =
  "overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-semibold text-[var(--lb-text-2)] max-[1024px]:text-[10px] max-[560px]:text-[9px]"

export const leaderboardPodiumGridClass =
  "mb-2.5 grid grid-cols-3 gap-2.5 max-[760px]:flex max-[760px]:snap-x max-[760px]:overflow-x-auto max-[760px]:pb-0.5 max-[760px]:[scrollbar-width:none] max-[760px]:[&::-webkit-scrollbar]:hidden max-[560px]:gap-2"

export const leaderboardPodiumCardClass =
  "flex min-w-0 flex-col rounded-[5px] border border-[var(--lb-line)] bg-[var(--panel)] px-[17px] py-[15px] pb-3.5 text-[var(--lb-text)] shadow-[0_4px_12px_rgba(0,0,0,0.06)] min-h-[210px] max-[760px]:w-auto max-[760px]:min-h-[168px] max-[760px]:flex-[0_0_min(278px,84vw)] max-[760px]:snap-start max-[560px]:min-w-0 max-[560px]:px-[11px] max-[560px]:py-2.5"

export const leaderboardPodiumTopClass =
  "grid min-w-0 grid-cols-[60px_minmax(0,1fr)_auto] items-center gap-2.5 max-[560px]:grid-cols-[42px_minmax(0,1fr)_78px] max-[560px]:gap-[7px]"

export function leaderboardPodiumRankClass(rank: number) {
  const tone = rank === 1 ? "text-[#f0d373]" : rank === 2 ? "text-[#d9dde5]" : rank === 3 ? "text-[#c88b5a]" : "text-[rgba(245,244,241,0.25)]"
  return `${tone} text-left text-[38px] font-black leading-none [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] max-[560px]:text-[30px]`
}

export const leaderboardPodiumIdentityClass =
  `${leaderboardPlayerLinkClass} justify-self-center justify-center max-[560px]:justify-self-start max-[560px]:justify-start`

export const leaderboardPodiumRateClass =
  "min-w-0 text-right max-[560px]:text-left [&>strong]:block [&>strong]:text-[16px] [&>strong]:font-[850] [&>strong]:leading-none [&>strong]:text-[var(--lb-text-2)] [&>strong]:[font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] [&>span]:mt-[3px] [&>span]:block [&>span]:text-[10px] [&>span]:font-bold [&>span]:leading-none [&>span]:text-[var(--lb-text-3)] max-[560px]:[&>strong]:text-[13px] max-[560px]:[&>span]:text-[9px]"

export const leaderboardPodiumScoreClass =
  "my-[37px] text-center text-[35px] font-[820] leading-[0.95] tracking-[0] text-[var(--lb-blue)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] max-[560px]:my-[24px] max-[560px]:mb-[18px] max-[560px]:text-[30px]"

export const leaderboardPodiumFootClass =
  "mt-auto grid min-w-0 grid-cols-[82px_minmax(0,1fr)_82px] items-end gap-2 text-[11px] font-semibold text-[var(--lb-text-3)] max-[560px]:grid-cols-[76px_minmax(0,1fr)_76px] max-[560px]:gap-[5px] [&_strong]:block [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[16px] [&_strong]:font-[850] [&_strong]:leading-[1.1] [&_strong]:text-[var(--lb-text-2)] [&_strong]:[font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] [&_span]:mt-[3px] [&_span]:block [&_span]:text-[10px] [&_span]:font-bold [&_span]:leading-none [&_span]:text-[var(--lb-text-3)] max-[560px]:[&_strong]:text-[13px] max-[560px]:[&_span]:text-[9px]"

export const leaderboardMiniStatClass = "min-w-0"
export const leaderboardMiniStatRightClass = "min-w-0 text-right max-[560px]:text-left"
export const leaderboardMiniStatCenterClass = "min-w-0 text-center"

export const leaderboardClubCellClass =
  "flex min-w-0 items-center gap-1.5 overflow-hidden pl-2 text-[12px] font-semibold text-[var(--lb-text-2)] [&_img]:size-[22px] [&_img]:shrink-0 [&_img]:object-contain [&_span]:min-w-0 [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap max-[1024px]:text-[10px] max-[560px]:gap-1 max-[560px]:text-[9px] max-[560px]:[&_img]:size-[17px]"

export const leaderboardBrawlerIconsClass =
  "flex min-w-0 items-center justify-center gap-1 [&_img]:size-[29px] [&_img]:shrink-0 [&_img]:rounded-md [&_img]:border [&_img]:border-[rgba(245,244,241,0.07)] [&_img]:object-cover max-[560px]:gap-0.5 max-[560px]:[&_img]:size-[22px] max-[560px]:[&_img]:rounded"

export const leaderboardBrawlerIconsRowClass =
  "justify-start overflow-visible pl-2 [&_img]:size-6 [&_img]:rounded-[5px] max-[1024px]:[&_img]:size-[21px] max-[1024px]:[&_img]:rounded max-[560px]:[&_img]:size-[17px] max-[560px]:[&_img]:rounded-[3px]"

export const leaderboardBrawlerIconsEmptyClass =
  "text-[16px] font-extrabold text-[var(--lb-text-4)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)]"

export const leaderboardBrawlerMetricClass =
  "flex min-w-0 items-center gap-1.5 overflow-hidden pl-2 text-[var(--lb-text-2)] [&_img]:size-[22px] [&_img]:shrink-0 [&_img]:rounded [&_img]:object-cover [&_strong]:block [&_strong]:min-w-0 [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[11px] [&_strong]:font-[780] [&_strong]:leading-none [&_strong]:text-[var(--lb-text)] [&_small]:mt-[3px] [&_small]:block [&_small]:min-w-0 [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[9px] [&_small]:font-[760] [&_small]:leading-none [&_small]:text-[var(--lb-text-3)] [&_small]:[font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] max-[1024px]:text-[10px] max-[560px]:text-[9px]"

export const leaderboardBrawlerMetricCompactClass =
  "pl-0 [&_small]:mt-0 [&_small]:text-[10.5px] [&_small]:text-[var(--lb-text-2)]"

export const leaderboardBrawlerMetricEmptyClass =
  "pl-2 text-[11px] font-extrabold text-[var(--lb-text-4)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] max-[560px]:text-[9px]"

export function regionCode(code: string) {
  return leaderboardRegionShort(code)
}

function teamSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export function LeaderboardPageShell({
  active,
  children,
}: {
  active: LeaderboardKind
  children: ReactNode
}) {
  useEffect(() => {
    document.documentElement.classList.add("landing-bg")
    return () => document.documentElement.classList.remove("landing-bg")
  }, [])

  return (
    <main className={leaderboardShellClass}>
      <LeaderboardTabs active={active} />
      <div className={leaderboardFrameClass}>
        {children}
      </div>
    </main>
  )
}

export function LeaderboardTabs({ active }: { active: LeaderboardKind }) {
  return (
    <div className={leaderboardSubnavSlotClass}>
      <div className={leaderboardSubnavWrapClass}>
        <nav aria-label="Leaderboard sections" className={leaderboardSubnavClass}>
          {tabs.map(tab => {
            const isActive = tab.key === active
            const className = `${leaderboardTabBaseClass} ${isActive ? leaderboardTabActiveClass : ""}`

            return (
              <Link key={tab.key} href={tab.href} className={className}>
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export function FeatureCardRail({ cards }: { cards: FeatureCard[] }) {
  return (
    <section aria-label="Professional teams" className="mb-3 mt-2.5 grid grid-cols-4 gap-3 max-[1024px]:grid-cols-2 max-[560px]:grid-cols-1">
      {cards.map((card, index) => {
        const accent = card.accent ?? "#f2d36b"
        const style = {
          "--team-accent": accent,
          "--team-logo-filter": card.logoFilter ?? "none",
          "--team-logo-bg-filter": card.logoBgFilter ?? card.logoFilter ?? "none",
          "--team-logo-bg-opacity": card.logoBgOpacity ?? "0.08",
          "--team-logo-bg-fit": card.logoBgFit ?? "contain",
          "--team-logo-bg-position": card.logoBgPosition ?? "center",
          "--team-logo-bg-size": card.logoBgSize ?? "282px",
          "--team-logo-bg-top": card.logoBgTop ?? "-52px",
          "--team-logo-bg-blend-mode": card.logoBlendMode ?? "normal",
          "--team-logo-surface": card.logoSurface ?? "rgba(247,244,237,0.72)",
        } as CSSProperties
        const body = (
          <div
            className="group relative flex min-h-[138px] cursor-pointer isolate items-end overflow-hidden rounded-[8px] border border-[rgba(245,244,241,0.055)] bg-[var(--panel)] p-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_16px_38px_-32px_rgba(0,0,0,0.62)] transition-colors hover:border-[rgba(245,244,241,0.105)]"
            data-team={teamSlug(card.title)}
            style={style}
          >
            {card.logoUrl && (
              <img
                src={card.logoUrl}
                alt=""
                className="pointer-events-none absolute left-1/2 top-[var(--team-logo-bg-top)] h-[var(--team-logo-bg-size)] w-[var(--team-logo-bg-size)] -translate-x-1/2 object-[var(--team-logo-bg-position)] opacity-[var(--team-logo-bg-opacity)] [filter:var(--team-logo-bg-filter)] [mix-blend-mode:var(--team-logo-bg-blend-mode)]"
                loading="lazy"
                decoding="async"
                onError={event => { event.currentTarget.style.display = "none" }}
              />
            )}
            <div className="relative z-[1] min-h-[47px] w-full min-w-0 overflow-hidden bg-[linear-gradient(180deg,rgba(13,13,17,0.4),rgba(13,13,17,0.88))] px-[13px] py-2.5 pb-[11px] backdrop-blur-[10px] after:pointer-events-none after:absolute after:inset-0 after:bg-[rgba(13,13,17,0.15)] after:opacity-0 after:transition-opacity group-hover:after:opacity-100">
              <div className="relative z-[1] flex min-w-0 items-center gap-1.5">
                {card.flagCode && (
                  <span
                    className={`bl-lb-team-flag bl-lb-team-flag-${card.flagCode}`}
                    aria-label={card.flagLabel ?? card.flagCode}
                  />
                )}
                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-[780] leading-[1.15] text-[var(--lb-text)]">{card.title}</span>
                <ChevronRight className="size-3.5 shrink-0 text-[rgba(245,244,241,0.58)]" aria-hidden="true" size={14} strokeWidth={2.8} />
              </div>
              <span className="relative z-[1] mt-[3px] block overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-medium leading-[1.2] text-[var(--lb-text-2)]">{card.detail}</span>
            </div>
          </div>
        )

        if (card.href) {
          return (
            <Link key={`${card.title}-${index}`} href={card.href} className="text-inherit no-underline">
              {body}
            </Link>
          )
        }

        return <div key={`${card.title}-${index}`}>{body}</div>
      })}
    </section>
  )
}

export function LeaderboardBoard({ children }: { children: ReactNode }) {
  return (
    <section className={leaderboardBoardClass}>
      {children}
    </section>
  )
}

export function LeaderboardHero({
  title,
  description,
  imageId,
  eyebrow,
  meta,
}: {
  title: string
  description?: string
  imageId?: number
  eyebrow?: string
  meta?: ReactNode
}) {
  return (
    <section className="mb-3 block min-h-[116px] rounded-[8px] border border-[rgba(245,244,241,0.065)] bg-[var(--panel)] px-7 py-[27px] pb-[25px] text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="min-w-0">
        {eyebrow && <span className="mb-1 block text-[10px] font-extrabold uppercase leading-none text-[var(--lb-accent)] [font-family:var(--font-label)]">{eyebrow}</span>}
        <h1 className="m-0 text-[30px] font-[850] leading-[1.04] tracking-[0] text-[var(--lb-text)] [font-family:var(--font-ui)]">{title}</h1>
        {description && <p className="mx-auto mb-0 mt-3 max-w-[820px] text-[13px] font-medium leading-[1.48] text-[var(--lb-text-2)] [font-family:var(--font-ui-light)]">{description}</p>}
      </div>
      <div className="hidden items-center gap-3" aria-hidden={!meta && !imageId}>
        {imageId && (
          <span className="grid size-[68px] place-items-center overflow-hidden rounded-[10px] border border-[var(--lb-line)] bg-[var(--lb-panel-2)]">
            <BrawlImage
              src={brawlerIconUrl(imageId)}
              alt=""
              width={72}
              height={72}
              className="size-[72px] object-cover"
              sizes="72px"
            />
          </span>
        )}
        {meta && <div className="min-w-[116px] rounded-[8px] border border-[var(--lb-line)] bg-[var(--lb-panel-2)] px-3 py-2.5 text-right">{meta}</div>}
      </div>
    </section>
  )
}

export function LeaderboardToolbar({ children }: { children: ReactNode }) {
  return (
    <section className={leaderboardToolbarClass}>
      {children}
    </section>
  )
}

export function LeaderboardPanel({ children }: { children: ReactNode }) {
  return (
    <section className={leaderboardPanelClass}>
      {children}
    </section>
  )
}

export function RegionPills({
  regions,
  activeRegion,
  onChange,
}: {
  regions: { code: string; label: string }[]
  activeRegion: string
  onChange: (code: string) => void
}) {
  return (
    <div className={leaderboardRegionPillsClass}>
      {regions.map(region => {
        const isActive = region.code === activeRegion
        return (
          <button
            key={region.code}
            type="button"
            onClick={() => onChange(region.code)}
            className={`${leaderboardRegionPillBaseClass} ${isActive ? leaderboardRegionPillActiveClass : ""}`}
            aria-pressed={isActive}
            title={region.label}
          >
            <span>{regionCode(region.code)}</span>
          </button>
        )
      })}
    </div>
  )
}

export function RegionSelect({
  regions,
  activeRegion,
  onChange,
}: {
  regions: { code: string; label: string }[]
  activeRegion: string
  onChange: (code: string) => void
}) {
  return (
    <label className={leaderboardSelectClass}>
      <span className="text-[10px] font-extrabold uppercase">Region</span>
      <select className={leaderboardSelectControlClass} aria-label="Region" value={activeRegion} onChange={event => onChange(event.target.value)}>
        {regions.map(region => (
          <option key={region.code} value={region.code}>{region.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--lb-text-3)]" />
    </label>
  )
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  name = "leaderboard-search",
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  name?: string
}) {
  return (
    <label className={leaderboardSearchClass}>
      <Search size={15} strokeWidth={2.25} />
      <input
        className={leaderboardSearchInputClass}
        name={name}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

export function SummaryStrip({ stats }: { stats: { label: string; value: string; icon?: LucideIcon }[] }) {
  return (
    <section className="mb-2 grid grid-cols-3 gap-2 max-[1024px]:grid-cols-2 max-[560px]:grid-cols-1">
      {stats.map(stat => {
        const Icon = stat.icon ?? Crown
        return (
          <div key={stat.label} className="grid min-h-[42px] min-w-0 grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 rounded-[8px] border border-[var(--lb-line)] bg-[var(--lb-panel-2)] px-[11px] py-[9px] text-[var(--lb-text-3)]">
            <Icon size={15} strokeWidth={2.25} />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-[750] uppercase leading-none">{stat.label}</span>
            <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-right text-[15px] font-[850] leading-none text-[var(--lb-text)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)]" suppressHydrationWarning>{stat.value}</strong>
          </div>
        )
      })}
    </section>
  )
}

export function SignalStrip({
  items,
}: {
  items: { label: string; value: string; icon?: LucideIcon; imageId?: number }[]
}) {
  return (
    <div className="flex gap-1.5">
      {items.map(item => {
        const Icon = item.icon ?? Trophy
        return (
          <div key={item.label} className="flex h-[38px] items-center gap-[7px] rounded-[7px] border border-[var(--lb-line)] bg-[var(--lb-panel-2)] px-[9px] text-[12px] font-bold text-[var(--lb-text-3)]">
            {item.imageId ? (
              <BrawlImage src={brawlerIconUrl(item.imageId)} alt="" width={24} height={24} className="size-6 rounded-[5px] object-cover" sizes="24px" />
            ) : (
              <Icon size={15} strokeWidth={2.25} />
            )}
            <span>{item.label}</span>
            <strong className="text-[12px] text-[var(--lb-text)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)]">{item.value}</strong>
          </div>
        )
      })}
    </div>
  )
}

export function ModeControls() {
  return (
    <div className="inline-flex h-[38px] shrink-0 items-center gap-[7px] whitespace-nowrap rounded-[7px] border border-[var(--lb-line)] bg-[var(--lb-panel-2)] px-[11px] text-[12px] font-bold text-[var(--lb-text-2)] max-[560px]:w-full">
      <Trophy size={14} strokeWidth={2.2} />
      <span>Ranked snapshot</span>
    </div>
  )
}

export function TableHead({
  children,
  className,
}: {
  children: ReactNode
  className: string
}) {
  return (
    <div className={`${leaderboardTableHeadClass} ${className}`}>
      {children}
    </div>
  )
}

export function TableHeadHelp({ label }: { label: string; help: string }) {
  return <span>{label}</span>
}

export function RankCell({ rank }: { rank: number }) {
  const rankToneClass = rank === 1
    ? "text-[var(--lb-accent)]"
    : rank === 2
      ? "text-[#d9dde5]"
      : rank === 3
        ? "text-[var(--lb-warm)]"
        : "text-[rgba(245,244,241,0.25)]"

  return (
    <span className={`text-center [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] text-[19px] font-black leading-none max-[560px]:text-[15px] ${rankToneClass}`}>
      {rank}
    </span>
  )
}

export function TrophyMetric({
  value,
  compact = false,
}: {
  value: string
  compact?: boolean
}) {
  return (
    <div className={`flex min-w-0 items-center text-center text-[var(--lb-blue)] ${compact ? "m-0 justify-start gap-[7px]" : "mt-[34px] justify-center gap-3"}`}>
      <Trophy
        size={compact ? 18 : 30}
        strokeWidth={2.25}
        className="shrink-0 fill-[rgba(240,211,115,0.18)] text-[var(--lb-accent)] [filter:drop-shadow(0_5px_10px_rgba(0,0,0,0.08))]"
      />
      <strong className={`[font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] font-[820] leading-[0.95] tracking-[0] text-[var(--lb-blue)] ${compact ? "text-[16px]" : "text-[34px]"}`}>
        {value}
      </strong>
    </div>
  )
}

export function EmptyLeaderboardState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <section className="rounded-[10px] border border-[var(--lb-line)] bg-[var(--lb-panel)] px-[18px] py-[52px] text-center">
      <h2 className="m-0 text-[22px] font-bold leading-[1.1] text-[var(--lb-text)]">{title}</h2>
      <p className="mx-auto mt-2.5 mb-0 max-w-[520px] text-[13px] font-medium leading-[1.45] text-[var(--lb-text-3)]">{description}</p>
      {action && <div className="mt-[18px]">{action}</div>}
    </section>
  )
}

function pagerItems(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const last = total - 1
  const set = new Set<number>([0, last, current])
  if (current - 1 > 0) set.add(current - 1)
  if (current + 1 < last) set.add(current + 1)
  const sorted = [...set].sort((a, b) => a - b)
  const items: Array<number | "…"> = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push("…")
    items.push(sorted[i])
  }
  return items
}

export function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  const items = pagerItems(page, totalPages)

  return (
    <nav className="flex items-center justify-center gap-1.5 pt-4" aria-label="Leaderboard pages">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        aria-label="Previous page"
        className="grid size-9 cursor-pointer place-items-center rounded-[7px] border border-[var(--lb-line)] bg-[var(--lb-panel)] text-[12px] font-extrabold text-[var(--lb-text-3)] hover:border-[var(--lb-line-2)] hover:bg-[var(--lb-panel-2)] hover:text-[var(--lb-text)] disabled:cursor-default disabled:opacity-35"
      >
        <ChevronLeft size={15} />
      </button>
      {items.map((item, idx) =>
        item === "…" ? (
          <span key={`gap-${idx}`} className="inline-flex min-w-5 select-none items-center justify-center text-[13px] font-bold tracking-[0.1em] text-[var(--lb-text-4)]" aria-hidden="true">…</span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`grid size-9 cursor-pointer place-items-center rounded-[7px] border border-[var(--lb-line)] bg-[var(--lb-panel)] text-[12px] font-extrabold text-[var(--lb-text-3)] hover:border-[var(--lb-line-2)] hover:bg-[var(--lb-panel-2)] hover:text-[var(--lb-text)] ${item === page ? "!border-[rgba(124,92,255,0.50)] !bg-[rgba(124,92,255,0.16)] !text-[#f5f4f1]" : ""}`}
            aria-current={item === page ? "page" : undefined}
          >
            {item + 1}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        aria-label="Next page"
        className="grid size-9 cursor-pointer place-items-center rounded-[7px] border border-[var(--lb-line)] bg-[var(--lb-panel)] text-[12px] font-extrabold text-[var(--lb-text-3)] hover:border-[var(--lb-line-2)] hover:bg-[var(--lb-panel-2)] hover:text-[var(--lb-text)] disabled:cursor-default disabled:opacity-35"
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  )
}
