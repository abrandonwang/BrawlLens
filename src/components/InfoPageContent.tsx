"use client"

import { useState, useEffect, type ReactNode, type SyntheticEvent } from "react"
import Link from "next/link"
import { CheckCircle2, ChevronRight, Mail } from "lucide-react"
import { sendContactEmail } from "@/app/actions/contact"

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function Disclosure({
  title,
  slug: explicitSlug,
  children,
  defaultOpen = false,
}: {
  title: ReactNode
  slug?: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const slug = explicitSlug ?? (typeof title === "string" ? slugify(title) : undefined)
  const id = slug ? `d-${slug}` : undefined
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    if (!id) return
    function check() {
      if (window.location.hash === `#${id}`) {
        setOpen(true)
        document.getElementById(id!)?.scrollIntoView({ block: "start", behavior: "smooth" })
      }
    }
    check()
    window.addEventListener("hashchange", check)
    return () => window.removeEventListener("hashchange", check)
  }, [id])

  function toggle() {
    const next = !open
    setOpen(next)
    if (id && next && typeof window !== "undefined") {
      history.replaceState(null, "", `#${id}`)
    }
  }

  return (
    <div id={id} className="scroll-mt-20 border-b border-[var(--line)] last:border-b-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 border-0 bg-transparent px-0 py-3 text-left font-inherit text-[var(--ink)] hover:text-[var(--ink)]"
      >
        <ChevronRight
          className={`size-[0.85rem] shrink-0 text-[var(--ink-3)] transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span className="text-[15px] font-medium text-[var(--ink)]">{title}</span>
      </button>
      {open && (
        <div className="pb-4 pl-[1.4rem] text-[14.5px] text-[var(--ink-2)] [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
          {children}
        </div>
      )}
    </div>
  )
}

function DisclosureGroup({ children }: { children: ReactNode }) {
  return <div className="my-4 border-t border-[var(--line)]">{children}</div>
}

const sidebar = [
  {
    title: "Getting Started",
    links: [["Introduction", "#introduction"]],
  },
  {
    title: "BrawlLens",
    links: [
      ["What It Tracks", "#what-it-tracks"],
      ["Data Sources", "#data-sources"],
      ["Calculations", "#calculations"],
      ["Metric Notes", "#metric-notes"],
    ],
  },
  {
    title: "More",
    links: [
      ["Search Help", "#search-help"],
      ["Data Status", "#data-status"],
      ["Changelog", "#changelog"],
      ["Privacy", "#privacy"],
      ["Contact", "#contact"],
    ],
  },
]

const toc = [
  ["What It Tracks", "#what-it-tracks"],
  ["Data Sources", "#data-sources"],
  ["Calculations", "#calculations"],
  ["Metric Notes", "#metric-notes"],
  ["Search Help", "#search-help"],
  ["Data Status", "#data-status"],
  ["Changelog", "#changelog"],
  ["Privacy", "#privacy"],
  ["Contact", "#contact"],
]

export function AboutContent() {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Getting Started": true,
    BrawlLens: true,
    More: true,
  })
  const [activeSection, setActiveSection] = useState<string>("introduction")

  function toggleGroup(title: string) {
    setOpenGroups(current => ({ ...current, [title]: !current[title] }))
  }

  useEffect(() => {
    const ids = sidebar.flatMap(g => g.links.map(([, href]) => href.replace(/^#/, "")))
    const elements = ids
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
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

  return (
    <main className="sm:container mx-auto h-auto w-[90vw]">
      <div className="flex items-start gap-10">
        <aside className="hidden min-w-[238px] flex-[1] flex-col sticky top-16 h-[94.5vh] overflow-y-auto md:flex">
          <div className="py-4">
            <div className="mt-5 flex flex-col gap-3.5 pr-2 pb-6">
              {sidebar.map(group => (
                <div key={group.title} className="flex w-full flex-col gap-1 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className="flex w-full items-center gap-2 border-0 bg-transparent p-0 text-left font-inherit text-[var(--ink)]"
                    aria-expanded={openGroups[group.title]}
                  >
                    <h4 className="text-sm font-medium text-[var(--ink)]">{group.title}</h4>
                    <span className="ml-auto mr-3.5 grid size-6 place-items-center text-[var(--ink)]">
                      <ChevronRight className={`size-[0.9rem] transition-transform ${openGroups[group.title] ? "rotate-90" : ""}`} />
                    </span>
                  </button>
                  {openGroups[group.title] && (
                    <div className="mt-2.5 ml-0.5 flex flex-col items-start gap-3 text-sm">
                      {group.links.map(([label, href]) => {
                        const id = href.replace(/^#/, "")
                        const active = activeSection === id
                        return (
                          <a
                            key={href}
                            href={href}
                            aria-current={active ? "true" : undefined}
                            className={`no-underline transition-colors ${active ? "font-medium text-[var(--ink)]" : "text-[var(--ink-3)] hover:text-[var(--ink)]"}`}
                          >
                            {label}
                          </a>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-[4]">
          <div className="flex items-start gap-10">
            <div className="flex-[3] pt-10">
              <div className="pb-5">
                <nav aria-label="breadcrumb">
                  <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-[var(--ink-4)] sm:gap-2.5">
                    <li className="inline-flex items-center gap-1.5">
                      <span className="transition-colors">Content</span>
                    </li>
                    <li aria-hidden="true" className="[&>svg]:size-3.5">
                      <ChevronRight />
                    </li>
                    <li className="inline-flex items-center gap-1.5">
                      <span aria-current="page" className="font-normal text-[var(--ink)]">About</span>
                    </li>
                  </ol>
                </nav>
              </div>

              <div className="docs-prose w-[85vw] pt-2 sm:mx-auto sm:w-full !min-w-full !max-w-[500px]">
                <h1 id="introduction" className="scroll-mt-20 text-3xl -mt-2">About BrawlLens</h1>
                <p className="-mt-4 text-[16.5px] text-[var(--ink-3)]">
                  Battle data, leaderboards, and brawler insight for players who want a precise read on what is performing right now.
                </p>

                <h2 id="what-it-tracks">
                  <a aria-hidden="true" tabIndex={-1} href="#what-it-tracks"><span className="icon icon-link" /></a>
                  What It Tracks
                </h2>
                <DisclosureGroup>
                  <Disclosure title="Leaderboards" defaultOpen>
                    <p>Leaderboard pages are ordered by trophy totals and grouped by the surface being inspected.</p>
                    <ul>
                      <li>Global and regional player rankings</li>
                      <li>Club rankings</li>
                      <li>Brawler trophy leaderboards</li>
                      <li>Top-three emphasis for faster scanning without changing rank order</li>
                    </ul>
                  </Disclosure>
                  <Disclosure title="Brawlers">
                    <p>The brawler catalog joins static metadata with aggregate battle performance. The page is meant to answer both “what is this brawler?” and “how is this brawler doing?”</p>
                    <ul>
                      <li>Rarity, class, ability, gadget, star power, gear, and hypercharge context</li>
                      <li>Overall score, win rate, stability, and map-level performance</li>
                      <li>Detail sheets for compact inspection without leaving the catalog</li>
                    </ul>
                  </Disclosure>
                  <Disclosure title="Maps">
                    <p>Map pages combine layout metadata, observed battle volume, live rotation information, and brawler matchup aggregates.</p>
                    <ul>
                      <li>Most popular map spotlight based on tracked battle count</li>
                      <li>Mode filters for reducing cross-mode noise</li>
                      <li>Map-specific brawler sorting by picks, wins, or win rate</li>
                    </ul>
                  </Disclosure>
                  <Disclosure title="Ask AI">
                    <p>A plain-language interface for asking questions about public player profiles, brawlers, maps, rankings, and matchup data.</p>
                  </Disclosure>
                </DisclosureGroup>

                <h2 id="data-sources">
                  <a aria-hidden="true" tabIndex={-1} href="#data-sources"><span className="icon icon-link" /></a>
                  Data Sources
                </h2>
                <p>
                  BrawlLens combines public game data, static brawler metadata, live rotation context, and tracked battle aggregates. Each surface intentionally uses the source that best matches the metric being shown.
                </p>
                <DisclosureGroup>
                  <Disclosure title="Brawler catalog">
                    <p>Static metadata supplies names, icons, classes, rarities, and ability references. This data changes slowly and is treated as descriptive context.</p>
                  </Disclosure>
                  <Disclosure title="Player and leaderboard data">
                    <p>Public game endpoints provide profile and ranking information. Trophy values are treated as ordering fields, not as performance rates.</p>
                  </Disclosure>
                  <Disclosure title="Map statistics">
                    <p>Tracked battle rows are grouped by map, mode, and brawler before rates are calculated. Aggregating first avoids accidentally averaging percentages from uneven samples.</p>
                  </Disclosure>
                  <Disclosure title="Rotation data">
                    <p>Rotation data is used for live labels and map context. It is not used as a substitute for battle volume.</p>
                  </Disclosure>
                  <Disclosure title="Normalization">
                    <p>Names and modes are normalized before lookup so display labels, route parameters, and aggregate rows can resolve to the same entity.</p>
                  </Disclosure>
                </DisclosureGroup>

                <h2 id="calculations">
                  <a aria-hidden="true" tabIndex={-1} href="#calculations"><span className="icon icon-link" /></a>
                  Calculations
                </h2>
                <p>
                  The goal is to keep every metric readable while still filtering out obvious noise. The site favors simple formulas with visible supporting context instead of opaque black-box scoring.
                </p>
                <DisclosureGroup>
                  <Disclosure slug="win-rate" title={<>Win rate <code className="ml-1 text-[13px] text-[var(--ink-3)]">wins / picks * 100</code></>}>
                    <p>For map stats, wins and picks are aggregated first, then the rate is calculated.</p>
                    <ul>
                      <li>A brawler with 60 wins from 100 picks has a 60% win rate.</li>
                      <li>Two separate 60% rows are not averaged unless their pick counts are equal.</li>
                    </ul>
                  </Disclosure>
                  <Disclosure title="Best overall brawler">
                    <p><code>0.68 win rate + 0.18 volume + 0.14 stability</code>.</p>
                    <ul>
                      <li><strong>Win rate</strong> is the primary signal because it measures conversion from pick to win.</li>
                      <li><strong>Volume</strong> uses a logarithmic pick score, so popularity matters without letting raw pick count dominate.</li>
                      <li><strong>Stability</strong> measures qualifying map volume at or above 50% win rate.</li>
                      <li>The score is intentionally not a tier list. It is a banner selection heuristic for one highlighted brawler.</li>
                    </ul>
                  </Disclosure>
                  <Disclosure title="Qualifying thresholds">
                    <p>Some highlights use minimum pick floors before a brawler can be considered. This keeps single-match outliers from winning banner slots.</p>
                  </Disclosure>
                  <Disclosure title="Map spotlight">
                    <p>The Maps banner starts with the most-played tracked map. Its supporting brawler stat uses the highest qualifying win rate on that map.</p>
                  </Disclosure>
                  <Disclosure title="Leaderboard top three">
                    <p>Ranking order follows trophy totals. The larger top-three treatment is visual emphasis only.</p>
                  </Disclosure>
                  <Disclosure title="Display formatting">
                    <p>Large counts may be abbreviated for readability, but the underlying ordering should be based on numeric values.</p>
                  </Disclosure>
                </DisclosureGroup>

                <h2 id="metric-notes">
                  <a aria-hidden="true" tabIndex={-1} href="#metric-notes"><span className="icon icon-link" /></a>
                  Metric Notes
                </h2>
                <p>
                  This section describes how to read the numbers. The stats are designed for fast comparison, not perfect prediction.
                </p>
                <DisclosureGroup>
                  <Disclosure title="Entity normalization">
                    <p>Map names, brawler names, and modes are normalized before lookup. This reduces mismatches between display labels, route parameters, and aggregate rows.</p>
                  </Disclosure>
                  <Disclosure title="Aggregation order">
                    <p>Counts are summed before rates are calculated. This matters because a 10-pick row and a 1,000-pick row should not contribute equally to a combined win rate.</p>
                  </Disclosure>
                  <Disclosure title="Sample floors">
                    <p>Highlights can require a minimum number of picks before a brawler qualifies. This is a guardrail against small samples, not a claim that the remaining data is perfect.</p>
                  </Disclosure>
                  <Disclosure title="Ranking fields">
                    <p>Leaderboards use trophy totals for order. Meta surfaces use performance fields such as picks, wins, win rate, or blended score depending on the control selected.</p>
                  </Disclosure>
                  <Disclosure title="Display values">
                    <p>Abbreviated labels like <code>2.7k</code> are for readability. Ordering and score calculations should use the underlying numeric value.</p>
                  </Disclosure>
                  <Disclosure title="Interpretation">
                    <p>A high win rate does not automatically mean a brawler is universally best. Map shape, mode, team composition, pick volume, and sample size all affect the reading.</p>
                  </Disclosure>
                </DisclosureGroup>

                <h2 id="search-help">
                  <a aria-hidden="true" tabIndex={-1} href="#search-help"><span className="icon icon-link" /></a>
                  Search Help
                </h2>
                <p>
                  Global search works like a small command palette. It is meant for jumping to pages, documentation anchors, leaderboard surfaces, or public player profiles without deciding which navigation path to use first.
                </p>
                <DisclosureGroup>
                  <Disclosure title="Commands">
                    <p>Search for a page name, a metric name, or a related word. For example, searching <code>formula</code> can open Calculations, while <code>clubs</code> can open Club Leaderboards.</p>
                  </Disclosure>
                  <Disclosure title="Player lookup">
                    <p>Paste a player tag with or without the <code>#</code>. The search panel will offer a direct public profile lookup when the query looks like a tag.</p>
                  </Disclosure>
                  <Disclosure title="Keyboard flow">
                    <p>Use arrow keys to move through results, Enter to open the highlighted result, and Escape to close the panel.</p>
                  </Disclosure>
                  <Disclosure title="Recent jumps">
                    <p>Recently opened commands may appear first. This is stored in the browser so repeat navigation stays fast without requiring an account.</p>
                  </Disclosure>
                </DisclosureGroup>

                <h2 id="data-status">
                  <a aria-hidden="true" tabIndex={-1} href="#data-status"><span className="icon icon-link" /></a>
                  Data Status
                </h2>
                <p>
                  Different parts of the site update on different rhythms. The labels on each page should be read as context for the current view, not as a promise that every surface refreshes at the exact same moment.
                </p>
                <DisclosureGroup>
                  <Disclosure title="Static metadata">
                    <p>Brawler names, rarities, classes, map names, and images are descriptive references. They change when the underlying catalog changes.</p>
                  </Disclosure>
                  <Disclosure title="Public rankings">
                    <p>Leaderboards are ordered from public trophy data. If a row appears stale, retrying the page or switching regions is the safest first check.</p>
                  </Disclosure>
                  <Disclosure title="Tracked aggregates">
                    <p>Map and brawler performance views depend on observed battle rows. Empty states usually mean there is not enough matching data for the current filter.</p>
                  </Disclosure>
                  <Disclosure title="Interface state">
                    <p>Theme, recent command jumps, and similar preferences can be stored locally in the browser. They do not require a BrawlLens account.</p>
                  </Disclosure>
                </DisclosureGroup>

                <h2 id="changelog">
                  <a aria-hidden="true" tabIndex={-1} href="#changelog"><span className="icon icon-link" /></a>
                  Changelog
                </h2>
                <p>
                  This page tracks high-level product changes so the documentation does not feel detached from the interface.
                </p>
                <DisclosureGroup>
                  <Disclosure title="Interface polish">
                    <p>Map cards, brawler cards, modals, loading states, and route motion were tightened so navigation feels less abrupt.</p>
                  </Disclosure>
                  <Disclosure title="Search">
                    <p>Global search now behaves like a command palette with grouped destinations, recent jumps, keyboard navigation, and player tag lookup.</p>
                  </Disclosure>
                  <Disclosure title="Ranking emphasis">
                    <p>Leaderboard top-three rows use a shared hover and emphasis system while preserving trophy-based ordering.</p>
                  </Disclosure>
                  <Disclosure title="Documentation">
                    <p>The About page was rebuilt as a text-first reference for calculations, data interpretation, privacy, contact, and feature help.</p>
                  </Disclosure>
                </DisclosureGroup>

                <h2 id="privacy">
                  <a aria-hidden="true" tabIndex={-1} href="#privacy"><span className="icon icon-link" /></a>
                  Privacy
                </h2>
                <p>
                  BrawlLens does not require an account. Most interactions are public game lookups, aggregate stat views, or local interface preferences.
                </p>
                <ul>
                  <li>No BrawlLens account is required.</li>
                  <li>Player searches request public game data for the searched tag.</li>
                  <li>Contact form submissions use the email you provide so a reply can be sent.</li>
                  <li>Theme preference may be stored locally in your browser.</li>
                  <li>Private account credentials are not requested by the site.</li>
                </ul>

                <h2 id="contact">
                  <a aria-hidden="true" tabIndex={-1} href="#contact"><span className="icon icon-link" /></a>
                  Contact
                </h2>
                <p>
                  Send bugs, confusing data, feature requests, or polish notes. The most helpful reports include the page URL, what you expected, and what happened instead.
                </p>
                <ContactForm />

                <div className="flex items-center justify-between py-7">
                  <a className="flex items-center gap-2 px-1 text-sm no-underline" href="#introduction">
                    <ChevronRight className="size-[1.1rem] rotate-180" />
                    <p>Back to top</p>
                  </a>
                  <Link className="flex items-center gap-2 px-1 text-sm no-underline" href="/brawlers">
                    <p>Open Brawlers</p>
                    <ChevronRight className="size-[1.1rem]" />
                  </Link>
                </div>
              </div>
            </div>

            <aside className="toc hidden min-w-[238px] flex-[1] sticky top-16 h-[95.95vh] py-10 lg:flex">
              <div className="flex w-full flex-col gap-3 pl-2">
                <h3 className="text-sm font-medium">On this page</h3>
                <div className="overflow-y-auto pt-0.5 pb-2">
                  <div className="ml-0.5 flex flex-col gap-2.5 text-sm">
                    {toc.map(([label, href]) => {
                      const id = href.replace(/^#/, "")
                      const active = activeSection === id
                      return (
                        <a
                          key={href}
                          href={href}
                          aria-current={active ? "true" : undefined}
                          className={`pl-0 no-underline transition-colors ${active ? "font-medium text-[var(--ink)]" : "text-[var(--ink-3)] hover:text-[var(--ink)]"}`}
                        >
                          {label}
                        </a>
                      )
                    })}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
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
      <div className="my-6 rounded-md border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink-3)]">
        <CheckCircle2 className="mb-1 inline-block text-[var(--accent)]" size={15} />
        <p className="m-0"><strong>Message received.</strong> Thanks. It is in the inbox now.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative my-6 space-y-5">
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-[var(--ink)]">Email</span>
        <input name="email" type="email" required maxLength={254} autoComplete="email" className="h-9 w-full border-0 border-b border-[var(--line)] bg-transparent px-0 text-sm text-[var(--ink)] outline-none focus:border-[var(--line-2)]" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-[var(--ink)]">Message</span>
        <textarea name="message" rows={3} required maxLength={4000} className="w-full resize-none border-0 border-b border-[var(--line)] bg-transparent px-0 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--line-2)]" />
      </label>
      <button type="submit" disabled={pending} className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 text-sm font-medium text-[var(--ink)] hover:bg-[var(--hover-bg)] disabled:opacity-50">
        <Mail size={14} />
        {pending ? "Sending" : "Send message"}
      </button>
      {status === "error" && <span className="ml-3 text-sm text-[var(--loss)]">{errorMessage || "Could not send. Try again in a bit."}</span>}
    </form>
  )
}
