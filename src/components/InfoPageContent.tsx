"use client"

import { useState, type SyntheticEvent } from "react"
import Link from "next/link"
import { CheckCircle2, ChevronRight, Mail } from "lucide-react"
import { sendContactEmail } from "@/app/actions/contact"

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

  function toggleGroup(title: string) {
    setOpenGroups(current => ({ ...current, [title]: !current[title] }))
  }

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
                    <div className="mt-2.5 ml-0.5 flex flex-col items-start gap-3 text-sm text-[var(--ink-2)]">
                      {group.links.map(([label, href]) => (
                        <a key={href} href={href} className="no-underline hover:text-[var(--ink)]">
                          {label}
                        </a>
                      ))}
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
                <ul>
                  <li>
                    <p><strong>Leaderboards</strong><br />Leaderboard pages are ordered by trophy totals and grouped by the surface being inspected.</p>
                    <ul>
                      <li>Global and regional player rankings</li>
                      <li>Club rankings</li>
                      <li>Brawler trophy leaderboards</li>
                      <li>Top-three emphasis for faster scanning without changing rank order</li>
                    </ul>
                  </li>
                  <li>
                    <p><strong>Brawlers</strong><br />The brawler catalog joins static metadata with aggregate battle performance. The page is meant to answer both “what is this brawler?” and “how is this brawler doing?”</p>
                    <ul>
                      <li>Rarity, class, ability, gadget, star power, gear, and hypercharge context</li>
                      <li>Overall score, win rate, stability, and map-level performance</li>
                      <li>Detail sheets for compact inspection without leaving the catalog</li>
                    </ul>
                  </li>
                  <li>
                    <p><strong>Maps</strong><br />Map pages combine layout metadata, observed battle volume, live rotation information, and brawler matchup aggregates.</p>
                    <ul>
                      <li>Most popular map spotlight based on tracked battle count</li>
                      <li>Mode filters for reducing cross-mode noise</li>
                      <li>Map-specific brawler sorting by picks, wins, or win rate</li>
                    </ul>
                  </li>
                  <li>
                    <p><strong>Ask AI</strong><br />A plain-language interface for asking questions about public player profiles, brawlers, maps, rankings, and matchup data.</p>
                  </li>
                </ul>

                <h2 id="data-sources">
                  <a aria-hidden="true" tabIndex={-1} href="#data-sources"><span className="icon icon-link" /></a>
                  Data Sources
                </h2>
                <p>
                  BrawlLens combines public game data, static brawler metadata, live rotation context, and tracked battle aggregates. Each surface intentionally uses the source that best matches the metric being shown.
                </p>
                <ul>
                  <li>
                    <p><strong>Brawler catalog</strong><br />Static metadata supplies names, icons, classes, rarities, and ability references. This data changes slowly and is treated as descriptive context.</p>
                  </li>
                  <li>
                    <p><strong>Player and leaderboard data</strong><br />Public game endpoints provide profile and ranking information. Trophy values are treated as ordering fields, not as performance rates.</p>
                  </li>
                  <li>
                    <p><strong>Map statistics</strong><br />Tracked battle rows are grouped by map, mode, and brawler before rates are calculated. Aggregating first avoids accidentally averaging percentages from uneven samples.</p>
                  </li>
                  <li>
                    <p><strong>Rotation data</strong><br />Rotation data is used for live labels and map context. It is not used as a substitute for battle volume.</p>
                  </li>
                  <li>
                    <p><strong>Normalization</strong><br />Names and modes are normalized before lookup so display labels, route parameters, and aggregate rows can resolve to the same entity.</p>
                  </li>
                </ul>

                <h2 id="calculations">
                  <a aria-hidden="true" tabIndex={-1} href="#calculations"><span className="icon icon-link" /></a>
                  Calculations
                </h2>
                <p>
                  The goal is to keep every metric readable while still filtering out obvious noise. The site favors simple formulas with visible supporting context instead of opaque black-box scoring.
                </p>
                <ul>
                  <li>
                    <p><strong>Win rate</strong><br /><code>wins / picks * 100</code>. For map stats, wins and picks are aggregated first, then the rate is calculated.</p>
                    <ul>
                      <li>A brawler with 60 wins from 100 picks has a 60% win rate.</li>
                      <li>Two separate 60% rows are not averaged unless their pick counts are equal.</li>
                    </ul>
                  </li>
                  <li>
                    <p><strong>Best overall brawler</strong><br /><code>0.68 win rate + 0.18 volume + 0.14 stability</code>.</p>
                    <ul>
                      <li><strong>Win rate</strong> is the primary signal because it measures conversion from pick to win.</li>
                      <li><strong>Volume</strong> uses a logarithmic pick score, so popularity matters without letting raw pick count dominate.</li>
                      <li><strong>Stability</strong> measures qualifying map volume at or above 50% win rate.</li>
                      <li>The score is intentionally not a tier list. It is a banner selection heuristic for one highlighted brawler.</li>
                    </ul>
                  </li>
                  <li>
                    <p><strong>Qualifying thresholds</strong><br />Some highlights use minimum pick floors before a brawler can be considered. This keeps single-match outliers from winning banner slots.</p>
                  </li>
                  <li>
                    <p><strong>Map spotlight</strong><br />The Maps banner starts with the most-played tracked map. Its supporting brawler stat uses the highest qualifying win rate on that map.</p>
                  </li>
                  <li>
                    <p><strong>Leaderboard top three</strong><br />Ranking order follows trophy totals. The larger top-three treatment is visual emphasis only.</p>
                  </li>
                  <li>
                    <p><strong>Display formatting</strong><br />Large counts may be abbreviated for readability, but the underlying ordering should be based on numeric values.</p>
                  </li>
                </ul>

                <h2 id="metric-notes">
                  <a aria-hidden="true" tabIndex={-1} href="#metric-notes"><span className="icon icon-link" /></a>
                  Metric Notes
                </h2>
                <p>
                  This section describes how to read the numbers. The stats are designed for fast comparison, not perfect prediction.
                </p>
                <ul>
                  <li>
                    <p><strong>Entity normalization</strong><br />Map names, brawler names, and modes are normalized before lookup. This reduces mismatches between display labels, route parameters, and aggregate rows.</p>
                  </li>
                  <li>
                    <p><strong>Aggregation order</strong><br />Counts are summed before rates are calculated. This matters because a 10-pick row and a 1,000-pick row should not contribute equally to a combined win rate.</p>
                  </li>
                  <li>
                    <p><strong>Sample floors</strong><br />Highlights can require a minimum number of picks before a brawler qualifies. This is a guardrail against small samples, not a claim that the remaining data is perfect.</p>
                  </li>
                  <li>
                    <p><strong>Ranking fields</strong><br />Leaderboards use trophy totals for order. Meta surfaces use performance fields such as picks, wins, win rate, or blended score depending on the control selected.</p>
                  </li>
                  <li>
                    <p><strong>Display values</strong><br />Abbreviated labels like <code>2.7k</code> are for readability. Ordering and score calculations should use the underlying numeric value.</p>
                  </li>
                  <li>
                    <p><strong>Interpretation</strong><br />A high win rate does not automatically mean a brawler is universally best. Map shape, mode, team composition, pick volume, and sample size all affect the reading.</p>
                  </li>
                </ul>

                <h2 id="search-help">
                  <a aria-hidden="true" tabIndex={-1} href="#search-help"><span className="icon icon-link" /></a>
                  Search Help
                </h2>
                <p>
                  Global search works like a small command palette. It is meant for jumping to pages, documentation anchors, leaderboard surfaces, or public player profiles without deciding which navigation path to use first.
                </p>
                <ul>
                  <li>
                    <p><strong>Commands</strong><br />Search for a page name, a metric name, or a related word. For example, searching <code>formula</code> can open Calculations, while <code>clubs</code> can open Club Leaderboards.</p>
                  </li>
                  <li>
                    <p><strong>Player lookup</strong><br />Paste a player tag with or without the <code>#</code>. The search panel will offer a direct public profile lookup when the query looks like a tag.</p>
                  </li>
                  <li>
                    <p><strong>Keyboard flow</strong><br />Use arrow keys to move through results, Enter to open the highlighted result, and Escape to close the panel.</p>
                  </li>
                  <li>
                    <p><strong>Recent jumps</strong><br />Recently opened commands may appear first. This is stored in the browser so repeat navigation stays fast without requiring an account.</p>
                  </li>
                </ul>

                <h2 id="data-status">
                  <a aria-hidden="true" tabIndex={-1} href="#data-status"><span className="icon icon-link" /></a>
                  Data Status
                </h2>
                <p>
                  Different parts of the site update on different rhythms. The labels on each page should be read as context for the current view, not as a promise that every surface refreshes at the exact same moment.
                </p>
                <ul>
                  <li>
                    <p><strong>Static metadata</strong><br />Brawler names, rarities, classes, map names, and images are descriptive references. They change when the underlying catalog changes.</p>
                  </li>
                  <li>
                    <p><strong>Public rankings</strong><br />Leaderboards are ordered from public trophy data. If a row appears stale, retrying the page or switching regions is the safest first check.</p>
                  </li>
                  <li>
                    <p><strong>Tracked aggregates</strong><br />Map and brawler performance views depend on observed battle rows. Empty states usually mean there is not enough matching data for the current filter.</p>
                  </li>
                  <li>
                    <p><strong>Interface state</strong><br />Theme, recent command jumps, and similar preferences can be stored locally in the browser. They do not require a BrawlLens account.</p>
                  </li>
                </ul>

                <h2 id="changelog">
                  <a aria-hidden="true" tabIndex={-1} href="#changelog"><span className="icon icon-link" /></a>
                  Changelog
                </h2>
                <p>
                  This page tracks high-level product changes so the documentation does not feel detached from the interface.
                </p>
                <ul>
                  <li>
                    <p><strong>Interface polish</strong><br />Map cards, brawler cards, modals, loading states, and route motion were tightened so navigation feels less abrupt.</p>
                  </li>
                  <li>
                    <p><strong>Search</strong><br />Global search now behaves like a command palette with grouped destinations, recent jumps, keyboard navigation, and player tag lookup.</p>
                  </li>
                  <li>
                    <p><strong>Ranking emphasis</strong><br />Leaderboard top-three rows use a shared hover and emphasis system while preserving trophy-based ordering.</p>
                  </li>
                  <li>
                    <p><strong>Documentation</strong><br />The About page was rebuilt as a text-first reference for calculations, data interpretation, privacy, contact, and feature help.</p>
                  </li>
                </ul>

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
                  <div className="ml-0.5 flex flex-col gap-2.5 text-sm text-[var(--ink-2)]">
                    {toc.map(([label, href]) => (
                      <a key={href} href={href} className="pl-0 no-underline hover:text-[var(--ink)]">{label}</a>
                    ))}
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

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const result = await sendContactEmail(new FormData(e.currentTarget))
    setPending(false)
    setStatus(result.error ? "error" : "success")
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
    <form onSubmit={handleSubmit} className="my-6 space-y-5">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-[var(--ink)]">Email</span>
        <input name="email" type="email" required className="h-9 w-full border-0 border-b border-[var(--line)] bg-transparent px-0 text-sm text-[var(--ink)] outline-none focus:border-[var(--line-2)]" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-[var(--ink)]">Message</span>
        <textarea name="message" rows={3} required className="w-full resize-none border-0 border-b border-[var(--line)] bg-transparent px-0 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--line-2)]" />
      </label>
      <button type="submit" disabled={pending} className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 text-sm font-medium text-[var(--ink)] hover:bg-[var(--hover-bg)] disabled:opacity-50">
        <Mail size={14} />
        {pending ? "Sending" : "Send message"}
      </button>
      {status === "error" && <span className="ml-3 text-sm text-[#F87171]">Could not send. Try again in a bit.</span>}
    </form>
  )
}
