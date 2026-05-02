"use client"

import { useState, useEffect, type SyntheticEvent } from "react"
import Link from "next/link"
import { ArrowUp, CheckCircle2, ChevronRight, Mail } from "lucide-react"
import { sendContactEmail } from "@/app/actions/contact"

const sections = [
  {
    id: "what-it-tracks",
    label: "What It Tracks",
    group: "BrawlLens",
  },
  {
    id: "data-sources",
    label: "Data Sources",
    group: "BrawlLens",
  },
  {
    id: "calculations",
    label: "Calculations",
    group: "BrawlLens",
  },
  {
    id: "metric-notes",
    label: "Metric Notes",
    group: "BrawlLens",
  },
  {
    id: "search-help",
    label: "Search Help",
    group: "More",
  },
  {
    id: "data-status",
    label: "Data Status",
    group: "More",
  },
  {
    id: "changelog",
    label: "Changelog",
    group: "More",
  },
  {
    id: "privacy",
    label: "Privacy",
    group: "More",
  },
  {
    id: "contact",
    label: "Contact",
    group: "More",
  },
]

const groups: { title: string; ids: string[] }[] = [
  { title: "Getting Started", ids: ["introduction"] },
  { title: "BrawlLens", ids: sections.filter(s => s.group === "BrawlLens").map(s => s.id) },
  { title: "More", ids: sections.filter(s => s.group === "More").map(s => s.id) },
]

const idLabel: Record<string, string> = {
  introduction: "Introduction",
  ...Object.fromEntries(sections.map(s => [s.id, s.label])),
}

export function AboutContent() {
  const [activeSection, setActiveSection] = useState<string>("introduction")

  useEffect(() => {
    const ids = ["introduction", ...sections.map(s => s.id)]
    const elements = ids.map(id => document.getElementById(id)).filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveSection(visible[0].target.id)
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    )
    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const activeGroup = groups.find(g => g.ids.includes(activeSection))?.title ?? "Getting Started"

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-10 max-md:px-4">
      <div className="grid gap-10 md:grid-cols-[210px_minmax(0,1fr)] lg:grid-cols-[210px_minmax(0,1fr)_220px] lg:gap-12">

        <aside className="hidden md:block">
          <div className="sticky top-20 flex flex-col gap-6 pb-6">
            {groups.map(group => (
              <div key={group.title} className="flex flex-col gap-2">
                <h4 className="text-[12px] font-medium tracking-normal text-[var(--ink-2)]">
                  {group.title}
                </h4>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {group.ids.map(id => {
                    const active = activeSection === id
                    return (
                      <li key={id}>
                        <a
                          href={`#${id}`}
                          aria-current={active ? "true" : undefined}
                          className={`block rounded-md px-2 py-1 text-[13px] no-underline transition-colors ${active ? "bg-[var(--hover-bg)] text-[var(--ink)] font-medium" : "text-[var(--ink-3)] hover:text-[var(--ink)]"}`}
                        >
                          {idLabel[id]}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <article className="min-w-0 max-w-[680px]">
          <nav aria-label="breadcrumb" className="mb-5 flex items-center gap-2 text-[12px] text-[var(--ink-4)]">
            <span>Docs</span>
            <ChevronRight size={12} />
            <span className="text-[var(--ink)]">About</span>
          </nav>

          <h1 id="introduction" className="scroll-mt-20 text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--ink)]">
            About BrawlLens
          </h1>
          <p className="mt-2 text-[15px] leading-[1.55] text-[var(--ink-3)]">
            Battle data, leaderboards, and brawler insight for players who want a precise read on what is performing right now.
          </p>

          <Section id="what-it-tracks" title="What It Tracks">
            <P>BrawlLens covers the surfaces a player typically asks about when they want to know the current state of the game.</P>
            <H3>Leaderboards</H3>
            <UL>
              <Li>Global and regional player rankings</Li>
              <Li>Club rankings ordered by total trophies</Li>
              <Li>Per-brawler trophy leaderboards</Li>
            </UL>
            <H3>Brawlers</H3>
            <UL>
              <Li>Rarity, class, ability, gadget, star power, gear, and hypercharge context</Li>
              <Li>Overall score, win rate, stability, and per-map performance</Li>
              <Li>Compact detail sheets without leaving the catalog</Li>
            </UL>
            <H3>Maps and Ask AI</H3>
            <P>Map pages combine layout metadata, observed battle volume, live rotation context, and per-brawler aggregates. The Ask AI assistant answers plain-language questions about anything above.</P>
          </Section>

          <Section id="data-sources" title="Data Sources">
            <P>BrawlLens combines public game data, static brawler metadata, live rotation context, and tracked battle aggregates. Each surface uses the source that best matches the metric being shown.</P>
            <UL>
              <Li><B>Brawler catalog</B> - static metadata for names, icons, classes, rarities, and ability references.</Li>
              <Li><B>Player and leaderboard data</B> - public game endpoints. Trophy values are ordering fields, not performance rates.</Li>
              <Li><B>Map statistics</B> - tracked battle rows grouped by map, mode, and brawler before rates are calculated.</Li>
              <Li><B>Rotation data</B> - used for live labels and map context only, not as a substitute for battle volume.</Li>
              <Li><B>Normalization</B> - names and modes are normalized so display labels, route parameters, and aggregate rows resolve to the same entity.</Li>
            </UL>
          </Section>

          <Section id="calculations" title="Calculations">
            <P>The goal is to keep every metric readable while still filtering out obvious noise. The site favors simple formulas with visible supporting context instead of opaque scoring.</P>
            <H3>Win rate</H3>
            <P><Code>wins / picks * 100</Code>. For map stats, wins and picks are aggregated first, then the rate is calculated. A brawler with 60 wins from 100 picks has a 60% win rate. Two separate 60% rows are not averaged unless their pick counts are equal.</P>
            <H3>Best overall brawler</H3>
            <P><Code>0.68 win rate + 0.18 volume + 0.14 stability</Code>.</P>
            <UL>
              <Li><B>Win rate</B> is the primary signal because it measures conversion from pick to win.</Li>
              <Li><B>Volume</B> uses a logarithmic pick score so popularity matters without dominating.</Li>
              <Li><B>Stability</B> measures qualifying map volume at or above 50% win rate.</Li>
              <Li>The score is a banner heuristic for one highlighted brawler. It is not a tier list.</Li>
            </UL>
            <H3>Other rules</H3>
            <UL>
              <Li><B>Qualifying thresholds</B> - minimum pick floors keep single-match outliers out of banner slots.</Li>
              <Li><B>Map spotlight</B> - the Maps banner uses the most-played tracked map, with the highest qualifying win rate as its supporting stat.</Li>
              <Li><B>Leaderboard top three</B> - ranking order follows trophies; the larger top-three treatment is visual emphasis only.</Li>
              <Li><B>Display formatting</B> - large counts may be abbreviated for readability; underlying ordering uses the numeric value.</Li>
            </UL>
          </Section>

          <Section id="metric-notes" title="Metric Notes">
            <P>How to read the numbers. The stats are designed for fast comparison, not perfect prediction.</P>
            <UL>
              <Li><B>Aggregation order</B> - counts are summed before rates are calculated so a 10-pick row and a 1,000-pick row do not contribute equally.</Li>
              <Li><B>Sample floors</B> - highlights can require a minimum number of picks. This is a guardrail against small samples, not a claim that the remaining data is perfect.</Li>
              <Li><B>Ranking fields</B> - leaderboards use trophies; meta surfaces use picks, wins, win rate, or blended score depending on the control selected.</Li>
              <Li><B>Display values</B> - abbreviated labels like <Code>2.7k</Code> are for readability. Score and ordering use the underlying numeric value.</Li>
              <Li><B>Interpretation</B> - a high win rate does not automatically mean a brawler is universally best. Map shape, mode, team composition, pick volume, and sample size all affect the reading.</Li>
            </UL>
          </Section>

          <Section id="search-help" title="Search Help">
            <P>Global search works like a small command palette. It is meant for jumping to pages, documentation anchors, leaderboard surfaces, or public player profiles without deciding which navigation path to use first.</P>
            <UL>
              <Li><B>Commands</B> - search for a page name, a metric name, or a related word. <Code>formula</Code> opens Calculations; <Code>clubs</Code> opens Club Leaderboards.</Li>
              <Li><B>Player lookup</B> - paste a player tag with or without the <Code>#</Code>. The panel offers a direct profile lookup when the query looks like a tag.</Li>
              <Li><B>Keyboard flow</B> - arrow keys move through results, Enter opens the highlighted result, Escape closes the panel.</Li>
            </UL>
          </Section>

          <Section id="data-status" title="Data Status">
            <P>Different parts of the site update on different rhythms. The labels on each page should be read as context for the current view, not as a promise that every surface refreshes at the same moment.</P>
            <UL>
              <Li><B>Static metadata</B> - brawler names, rarities, classes, map names, and images change only when the underlying catalog changes.</Li>
              <Li><B>Public rankings</B> - leaderboards order from public trophy data. If a row appears stale, retrying the page or switching regions is the safest first check.</Li>
              <Li><B>Tracked aggregates</B> - map and brawler performance views depend on observed battle rows. Empty states usually mean the current filter does not have enough matching data.</Li>
              <Li><B>Interface state</B> - recent jumps and similar preferences are stored locally in the browser. They do not require a BrawlLens account.</Li>
            </UL>
          </Section>

          <Section id="changelog" title="Changelog">
            <P>High-level product changes so the documentation does not feel detached from the interface.</P>
            <UL>
              <Li><B>Interface polish</B> - map cards, brawler cards, modals, loading states, and route motion were tightened so navigation feels less abrupt.</Li>
              <Li><B>Search</B> - global search behaves like a command palette with grouped destinations, keyboard navigation, and player tag lookup.</Li>
              <Li><B>Ranking emphasis</B> - leaderboard top-three rows share a hover and emphasis system while preserving trophy-based ordering.</Li>
              <Li><B>Documentation</B> - the About page was rebuilt as a text-first reference for calculations, data interpretation, privacy, contact, and feature help.</Li>
            </UL>
          </Section>

          <Section id="privacy" title="Privacy">
            <P>BrawlLens does not require an account. Most interactions are public game lookups, aggregate stat views, or local interface preferences.</P>
            <UL>
              <Li>No BrawlLens account is required.</Li>
              <Li>Player searches request public game data for the searched tag.</Li>
              <Li>Contact form submissions use the email you provide so a reply can be sent.</Li>
              <Li>Local browser storage is used for small interface preferences only.</Li>
              <Li>Private account credentials are not requested by the site.</Li>
            </UL>
          </Section>

          <Section id="contact" title="Contact">
            <P>Send bugs, confusing data, feature requests, or polish notes. The most helpful reports include the page URL, what you expected, and what happened instead.</P>
            <ContactForm />
          </Section>

          <div className="mt-14 flex items-center justify-between border-t border-[var(--line)] pt-6">
            <a href="#introduction" className="flex items-center gap-2 text-[13px] text-[var(--ink-3)] no-underline hover:text-[var(--ink)]">
              <ChevronRight size={14} className="rotate-180" />
              <span>Back to top</span>
            </a>
            <Link href="/brawlers" className="flex items-center gap-2 text-[13px] text-[var(--ink-3)] no-underline hover:text-[var(--ink)]">
              <span>Open Brawlers</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-20 flex flex-col gap-3 pb-6">
            <div className="text-[12px] font-medium tracking-normal text-[var(--ink-2)]">
              Reading
            </div>
            <div className="rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-3">
              <div className="text-[11px] text-[var(--ink-4)]">Current section</div>
              <div className="mt-1 text-[14px] font-semibold tracking-[-0.012em] text-[var(--ink)]">
                {idLabel[activeSection] ?? "Introduction"}
              </div>
              <div className="mt-2 text-[11px] text-[var(--ink-4)]">in {activeGroup}</div>
            </div>
            <a
              href="#introduction"
              className="inline-flex items-center gap-1.5 self-start rounded-md border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1.5 text-[12px] text-[var(--ink-3)] no-underline transition-colors hover:border-[var(--line-2)] hover:text-[var(--ink)]"
            >
              <ArrowUp size={12} />
              Back to top
            </a>
          </div>
        </aside>

      </div>
    </main>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 id={id} className="scroll-mt-20 text-[17px] font-semibold leading-[1.3] tracking-[-0.012em] text-[var(--ink)]">
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-3 text-[14.5px] leading-[1.6] text-[var(--ink-2)]">
        {children}
      </div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="m-0">{children}</p>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="m-0 mt-2 text-[13.5px] font-semibold tracking-[-0.005em] text-[var(--ink)]">{children}</h3>
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 marker:text-[var(--ink-5)]">{children}</ul>
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="pl-1">{children}</li>
}

function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-[var(--ink)]">{children}</strong>
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-[var(--line)] bg-[var(--panel-2)] px-1.5 py-0.5 font-mono text-[12.5px] text-[var(--ink)]">
      {children}
    </code>
  )
}

function ContactForm() {
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const startedAt = useState(() => Date.now())[0]

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (Date.now() - startedAt < 1500) {
      setStatus("success")
      return
    }
    setPending(true)
    const result = await sendContactEmail(new FormData(e.currentTarget))
    setPending(false)
    if (result.error) {
      setErrorMessage(result.error)
      setStatus("error")
    } else {
      setStatus("success")
    }
  }

  if (status === "success") {
    return (
      <div className="my-2 flex items-start gap-2 rounded-md border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-[13px] text-[var(--ink-2)]">
        <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--ink)]" size={14} />
        <p className="m-0"><strong className="font-semibold text-[var(--ink)]">Message received.</strong> Thanks. It is in the inbox now.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative my-2 flex flex-col gap-4">
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-[12px] font-medium text-[var(--ink)]">Email</span>
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          className="h-9 w-full border-0 border-b border-[var(--line)] bg-transparent px-0 text-[13.5px] text-[var(--ink)] outline-none focus:border-[var(--line-2)]"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-medium text-[var(--ink)]">Message</span>
        <textarea
          name="message"
          rows={3}
          required
          maxLength={4000}
          className="w-full resize-none border-0 border-b border-[var(--line)] bg-transparent px-0 py-2 text-[13.5px] text-[var(--ink)] outline-none focus:border-[var(--line-2)]"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 w-fit items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 text-[13px] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-50"
      >
        <Mail size={13} />
        {pending ? "Sending" : "Send message"}
      </button>
      {status === "error" && <span className="text-[12.5px] text-[var(--loss)]">{errorMessage || "Could not send. Try again in a bit."}</span>}
    </form>
  )
}
