import type { Metadata } from "next"
import Link from "next/link"
import {
  BarChart3,
  BookOpen,
  Bot,
  ChevronRight,
  Headphones,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Help - BrawlLens",
  description: "BrawlLens help center: how to use the site, what each section does, and how to get support.",
}

const sections = [
  {
    title: "Searching for a player",
    body: "Open the search bar in the top navigation, paste a Brawl Stars player tag (the # is optional), and press Enter. We resolve the tag, store recent stats, and link out to the full profile.",
    icon: Search,
  },
  {
    title: "Rankings",
    body: "Rankings pull from the Supercell API on a refresh cadence. Use the region filter to scope to a country, and the search box to jump to a specific tag inside the current list.",
    icon: BarChart3,
  },
  {
    title: "Brawler tierlist",
    body: "Each brawler card surfaces win rate, pick rate, and a derived score weighted by sample size. Tap any card to drill into the per-map matchup table for that brawler.",
    icon: Trophy,
  },
  {
    title: "Profiles",
    body: "A profile shows recent battles, brawler progression, club history, and trophy curve. Profiles are rebuilt on visit when the underlying data is older than a few minutes.",
    icon: UserRound,
  },
  {
    title: "Account & player tag",
    body: "Sign in from the top right, then attach your player tag in Account > Settings. Once linked, your tag is remembered across sessions and unlocks personalized recommendations.",
    icon: ShieldCheck,
  },
]

const quickActions = [
  {
    title: "Ask AI",
    body: "Get a guided answer for meta, builds, maps, or account questions.",
    href: "/ask",
    icon: Bot,
  },
  {
    title: "Contact support",
    body: "Send a bug report or account issue to the team.",
    href: "/contact",
    icon: Headphones,
  },
] as const

export default function HelpPage() {
  return (
    <main className="bl-help-shell mx-auto w-[min(960px,calc(100vw-16px))] px-0 pb-16 pt-3 text-[#f5f4f1] [font-family:var(--font-ui)] max-[560px]:w-[calc(100vw-12px)] max-[560px]:pt-1">
      <header className="overflow-hidden rounded-[8px] border border-[rgba(245,244,241,0.09)] bg-[linear-gradient(180deg,rgba(20,22,30,0.92),rgba(12,13,18,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div className="min-w-0">
            <div className="mb-4 flex size-11 items-center justify-center rounded-[8px] border border-[rgba(47,128,255,0.36)] bg-[rgba(47,128,255,0.12)] text-[#2f80ff]">
              <BookOpen size={24} strokeWidth={2.4} aria-hidden="true" />
            </div>
            <h1 className="m-0 text-[clamp(30px,5vw,52px)] font-[900] leading-[1.02] tracking-[0] [font-family:var(--font-heading)]">
              Help center
            </h1>
            <p className="mt-2 max-w-[620px] text-[14px] font-[600] leading-[1.5] text-[rgba(245,244,241,0.70)] sm:text-[15px]">
              Find a path, fix an account issue, or learn how BrawlLens reads the data.
            </p>
          </div>

          <form action="/ask" className="min-w-0" role="search">
            <label className="mb-2 block text-[11px] font-[820] uppercase tracking-[0.12em] text-[rgba(245,244,241,0.46)]">
              Ask help
            </label>
            <div className="flex min-h-12 items-center gap-3 rounded-[8px] border border-[rgba(245,244,241,0.11)] bg-[rgba(8,9,13,0.66)] px-3.5 focus-within:border-[rgba(47,128,255,0.58)] focus-within:shadow-[0_0_0_3px_rgba(47,128,255,0.15)]">
              <Search size={18} className="shrink-0 text-[rgba(245,244,241,0.48)]" strokeWidth={2.2} aria-hidden="true" />
              <input
                name="q"
                type="search"
                placeholder="Ask about tags, billing, maps..."
                className="h-12 min-w-0 flex-1 border-0 bg-transparent text-[16px] font-[560] text-[#f5f4f1] outline-none placeholder:text-[rgba(245,244,241,0.36)]"
              />
              <button
                type="submit"
                className="grid size-8 shrink-0 place-items-center rounded-[7px] bg-[#2f80ff] text-white transition-colors hover:bg-[#1f6ee8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7ab0ff]"
                aria-label="Ask BrawlLens AI"
              >
                <Sparkles size={15} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>
      </header>

      <section className="mt-3 grid grid-cols-3 gap-2.5 max-[720px]:grid-cols-1" aria-label="Quick actions">
        {quickActions.map(({ title, body, href, icon: Icon }) => (
          <Link
            key={title}
            href={href}
            className="group grid min-h-[86px] grid-cols-[36px_minmax(0,1fr)_18px] items-center gap-3 rounded-[8px] border border-[rgba(245,244,241,0.08)] bg-[rgba(17,18,24,0.84)] p-3.5 text-inherit no-underline transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:border-[rgba(47,128,255,0.34)] hover:bg-[rgba(22,24,32,0.92)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f80ff]"
          >
            <span className="grid size-9 place-items-center rounded-[7px] border border-[rgba(245,244,241,0.09)] bg-[rgba(245,244,241,0.045)] text-[#7ab0ff]">
              <Icon size={18} strokeWidth={2.3} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <strong className="block text-[14px] font-[850] leading-[1.15] text-[#f5f4f1]">{title}</strong>
              <span className="mt-1 block text-[12px] font-[560] leading-[1.35] text-[rgba(245,244,241,0.58)]">{body}</span>
            </span>
            <ChevronRight size={17} className="text-[rgba(245,244,241,0.36)] transition-colors group-hover:text-[#7ab0ff]" strokeWidth={2.4} aria-hidden="true" />
          </Link>
        ))}
      </section>

      <section className="mt-5 rounded-[8px] border border-[rgba(245,244,241,0.08)] bg-[rgba(13,14,19,0.82)]">
        <div className="flex items-center justify-between gap-3 border-b border-[rgba(245,244,241,0.08)] px-4 py-3.5">
          <h2 className="m-0 text-[13px] font-[900] uppercase tracking-[0.08em] text-[rgba(245,244,241,0.58)] [font-family:var(--font-label)]">
            Popular topics
          </h2>
          <span className="text-[12px] font-[650] text-[rgba(245,244,241,0.42)]">{sections.length} guides</span>
        </div>

        <div className="divide-y divide-[rgba(245,244,241,0.075)]">
          {sections.map(({ title, body, icon: Icon }) => (
            <details key={title} className="group">
              <summary className="grid min-h-[58px] cursor-pointer list-none grid-cols-[34px_minmax(0,1fr)_20px] items-center gap-3 px-4 py-2.5 marker:hidden">
                <span className="grid size-8 place-items-center rounded-[7px] bg-[rgba(47,128,255,0.10)] text-[#2f80ff]">
                  <Icon size={17} strokeWidth={2.3} aria-hidden="true" />
                </span>
                <span className="min-w-0 text-[15px] font-[780] leading-[1.25] text-[#f5f4f1]">{title}</span>
                <ChevronRight size={18} className="text-[rgba(245,244,241,0.36)] transition-transform group-open:rotate-90" strokeWidth={2.3} aria-hidden="true" />
              </summary>
              <div className="pb-4 pl-[62px] pr-4 text-[13px] font-[560] leading-[1.58] text-[rgba(245,244,241,0.68)] max-[480px]:pl-4">
                {body}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-3 grid gap-3 rounded-[8px] border border-[rgba(47,128,255,0.26)] bg-[linear-gradient(180deg,rgba(47,128,255,0.12),rgba(47,128,255,0.055))] p-4 sm:grid-cols-[42px_minmax(0,1fr)_auto] sm:items-center">
        <span className="grid size-10 place-items-center rounded-[8px] border border-[rgba(47,128,255,0.34)] bg-[rgba(4,12,28,0.38)] text-[#7ab0ff]">
          <ShieldCheck size={21} strokeWidth={2.4} aria-hidden="true" />
        </span>
        <div>
          <h2 className="m-0 text-[15px] font-[850] leading-tight text-[#f5f4f1] [font-family:var(--font-heading)]">
            Still need help?
          </h2>
          <p className="mt-1 text-[12.5px] font-[560] leading-[1.45] text-[rgba(245,244,241,0.66)]">
            Use support for account and billing issues. Use Ask AI for live Brawl Stars data questions.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#2f80ff] px-4 text-[12.5px] font-[820] text-white no-underline transition-colors hover:bg-[#1f6ee8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7ab0ff] [font-family:var(--font-label)]"
        >
          Contact support
          <ChevronRight size={15} strokeWidth={2.5} aria-hidden="true" />
        </Link>
      </section>
    </main>
  )
}
