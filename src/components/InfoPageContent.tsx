"use client"

import { useState, type ReactNode, type SyntheticEvent } from "react"
import { ArrowUpRight, CheckCircle2, Mail } from "lucide-react"
import { sendContactEmail } from "@/app/actions/contact"

const sidebar = [
  {
    title: "Getting Started",
    links: [
      ["Introduction", "#introduction"],
      ["What BrawlLens Tracks", "#features"],
      ["Data Sources", "#data"],
    ],
  },
  {
    title: "Reference",
    links: [
      ["Calculations", "#calculations"],
      ["Privacy", "#privacy"],
      ["Contact", "#contact"],
    ],
  },
]

const anchors = [
  ["Introduction", "#introduction"],
  ["What BrawlLens Tracks", "#features"],
  ["Data Sources", "#data"],
  ["Calculations", "#calculations"],
  ["Privacy", "#privacy"],
  ["Contact", "#contact"],
]

export function AboutContent() {
  return (
    <main className="mx-auto grid w-full max-w-[1220px] grid-cols-[236px_minmax(0,1fr)_224px] gap-10 px-6 pt-10 pb-20 max-lg:grid-cols-[220px_minmax(0,1fr)] max-md:block max-md:px-4 max-md:pt-6 max-[360px]:px-3">
      <aside className="sticky top-28 h-[calc(100dvh-150px)] overflow-y-auto pr-2 max-md:static max-md:h-auto max-md:overflow-visible max-md:pr-0">
        <div className="mb-7">
          <p className="m-0 text-[14px] font-semibold text-[var(--ink)]">BrawlLens</p>
          <p className="mt-1 mb-0 text-[12px] leading-5 text-[var(--ink-4)]">Documentation</p>
        </div>
        <nav className="space-y-7 max-md:flex max-md:gap-5 max-md:space-y-0 max-md:overflow-x-auto max-md:border-b max-md:border-[var(--line)] max-md:pb-4">
          {sidebar.map(group => (
            <div key={group.title} className="min-w-[170px]">
              <p className="mb-2 text-[11px] font-semibold text-[var(--ink)]">{group.title}</p>
              <div className="grid gap-1">
                {group.links.map(([label, href]) => (
                  <a key={href} href={href} className="block rounded-[6px] px-2 py-1.5 text-[12.5px] leading-5 text-[var(--ink-3)] no-underline transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--ink)]">
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <article className="min-w-0 max-w-[760px] max-md:mt-8">
        <div className="mb-8 border-b border-[var(--line)] pb-8">
          <div className="mb-5 flex items-center gap-2 text-[12px] text-[var(--ink-4)]">
            <span>Docs</span>
            <span>/</span>
            <span className="text-[var(--ink-2)]">Introduction</span>
          </div>
          <h1 id="introduction" className="scroll-mt-28 text-[42px] leading-[1.05] font-bold tracking-normal text-[var(--ink)] max-sm:text-[34px]">Introduction</h1>
          <p className="mt-5 mb-0 text-[16px] leading-7 text-[var(--ink-3)]">
            BrawlLens is a small analytics workspace for Brawl Stars. It brings together leaderboards, brawler details, map matchup data, and quick meta summaries so players can understand what is performing without maintaining their own spreadsheet.
          </p>
        </div>

        <DocsSection id="features" title="What BrawlLens tracks">
          <p>
            The app is organized around the questions players usually ask while checking the current meta: who is performing well, which maps matter, and how the top leaderboards are moving.
          </p>
          <TextTable rows={[
            ["Leaderboards", "Global and regional player, club, and brawler rankings. Trophy totals determine ordering."],
            ["Brawlers", "Catalog details, rarity, class, abilities, overall performance, and best map context."],
            ["Maps", "Tracked maps, battle volume, live rotation context, and brawler matchup performance."],
            ["Ask AI", "A plain-language interface for asking about players, brawlers, maps, and rankings."],
          ]} />
        </DocsSection>

        <DocsSection id="data" title="Data sources">
          <p>
            BrawlLens combines static catalog data with public game data and internally aggregated matchup rows. The exact availability of a stat depends on the data source behind that feature.
          </p>
          <TextTable rows={[
            ["Brawler catalog", "Brawlify supplies brawler names, icons, classes, rarities, and static metadata."],
            ["Player data", "Official Brawl Stars API routes provide public player and leaderboard information."],
            ["Map statistics", "Tracked battle rows are grouped by map, mode, and brawler to calculate matchup summaries."],
            ["Rotation", "Live map status is checked separately so map cards can show which events are currently active."],
          ]} />
          <Note>
            BrawlLens is not affiliated with, endorsed, sponsored, or specifically approved by Supercell.
            <a href="https://supercell.com/en/fan-content-policy/" className="ml-1 inline-flex items-center gap-1 text-[var(--accent)] no-underline hover:underline">
              Fan Content Policy <ArrowUpRight size={12} />
            </a>
          </Note>
        </DocsSection>

        <DocsSection id="calculations" title="Calculations">
          <p>
            Metrics are intended to be understandable at a glance. When a calculation combines multiple signals, the page should show enough context to explain why something was featured.
          </p>
          <TextTable rows={[
            ["Win rate", "wins / picks * 100. For map stats, wins and picks are aggregated first, then the rate is calculated."],
            ["Best overall brawler", "0.68 win rate + 0.18 volume + 0.14 stability."],
            ["Volume score", "A logarithmic pick score. It rewards popularity without letting raw pick count overwhelm performance."],
            ["Stability", "The share of qualifying map volume where a brawler is at or above 50% win rate."],
            ["Map spotlight", "The Maps banner starts with the most-played tracked map. Its supporting brawler stat uses highest qualifying win rate on that map."],
            ["Top-three leaderboards", "The order follows trophy totals. The larger top-three cards are visual emphasis only."],
          ]} />
        </DocsSection>

        <DocsSection id="privacy" title="Privacy">
          <p>
            BrawlLens does not require an account. Most interactions are public data lookups or local interface preferences.
          </p>
          <TextTable rows={[
            ["Accounts", "No BrawlLens account is required."],
            ["Player searches", "When you search a player tag, public game data for that tag is requested and displayed."],
            ["Contact form", "If you send a message, your name, email, and message are sent through Resend so Brandon can reply."],
            ["Analytics", "The app includes Vercel Analytics for aggregate product signals. It is not used to build user profiles inside BrawlLens."],
            ["Local preferences", "Theme preference may be stored locally in your browser."],
          ]} />
        </DocsSection>

        <DocsSection id="contact" title="Contact">
          <p>
            Send bugs, feature requests, confusing data, or polish notes. The most helpful reports include the page URL, what you expected, and what happened instead.
          </p>
          <ContactForm />
        </DocsSection>
      </article>

      <aside className="sticky top-28 h-fit border-l border-[var(--line)] pl-5 max-lg:hidden">
        <p className="mb-3 text-[12px] font-semibold text-[var(--ink)]">On this page</p>
        <nav className="grid gap-1">
          {anchors.map(([label, href]) => (
            <a key={href} href={href} className="py-1 text-[12px] leading-5 text-[var(--ink-4)] no-underline transition-colors hover:text-[var(--ink)]">
              {label}
            </a>
          ))}
        </nav>
      </aside>
    </main>
  )
}

function DocsSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-b border-[var(--line)] py-8 last:border-b-0">
      <h2 className="m-0 text-[28px] leading-tight font-semibold tracking-normal text-[var(--ink)]">{title}</h2>
      <div className="mt-4 space-y-5 text-[14px] leading-7 text-[var(--ink-3)]">{children}</div>
    </section>
  )
}

function TextTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-[var(--line)]">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[170px_1fr] border-b border-[var(--line)] last:border-b-0 max-sm:grid-cols-1">
          <div className="bg-[color-mix(in_srgb,var(--panel)_72%,transparent)] px-4 py-3 text-[13px] font-semibold text-[var(--ink)]">{label}</div>
          <div className="px-4 py-3 text-[13px] leading-6 text-[var(--ink-3)]">{value}</div>
        </div>
      ))}
    </div>
  )
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_72%,transparent)] px-4 py-3 text-[13px] leading-6 text-[var(--ink-3)]">
      {children}
    </div>
  )
}

function ContactForm() {
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const result = await sendContactEmail(new FormData(e.currentTarget))
    setPending(false)
    setStatus(result.error ? "error" : "success")
  }

  if (status === "success") {
    return (
      <div className="rounded-[8px] border border-[var(--line)] px-4 py-3 text-[13px] text-[var(--ink-3)]">
        <CheckCircle2 className="mb-2 text-[var(--accent)]" size={18} />
        <p className="m-0 font-semibold text-[var(--ink)]">Message received.</p>
        <p className="mt-1 mb-0">Thanks. It is in the inbox now.</p>
      </div>
    )
  }

  const inputClass = "w-full rounded-[6px] border border-[var(--line)] bg-transparent px-3 py-2.5 text-[13px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-4)] focus:border-[var(--line-2)]"
  const labelClass = "text-[12px] font-medium text-[var(--ink-2)]"

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <label className="grid gap-1.5">
          <span className={labelClass}>Name</span>
          <input name="name" required className={inputClass} />
        </label>
        <label className="grid gap-1.5">
          <span className={labelClass}>Email</span>
          <input name="email" type="email" required className={inputClass} />
        </label>
      </div>
      <label className="grid gap-1.5">
        <span className={labelClass}>Message</span>
        <textarea name="message" rows={6} required className={`${inputClass} resize-none`} />
      </label>
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button type="submit" disabled={pending} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[6px] border border-[var(--line)] bg-[var(--panel)] px-3 text-[12.5px] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--hover-bg)] disabled:cursor-default disabled:opacity-50">
          <Mail size={13} />
          {pending ? "Sending" : "Send message"}
        </button>
        {status === "error" && <span className="text-[12px] text-[#F87171]">Could not send. Try again in a bit.</span>}
      </div>
    </form>
  )
}
