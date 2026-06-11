import type { Metadata } from "next"
import Link from "next/link"
import { Fragment } from "react"
import { GuideHero, GuideSection, GuideShell } from "../guides/GuideContent"
import GuideNav from "../guides/GuideNav"

export const metadata: Metadata = {
  title: "Help - BrawlLens",
  description: "BrawlLens help center: how to use the site, what each section does, and how to get support.",
}

const gettingAround = [
  {
    title: "Searching for a player",
    body: "Open the search bar in the top navigation and paste a Brawl Stars player tag (the # is optional). We resolve the tag, store recent stats, and open the full profile.",
  },
  {
    title: "Profiles",
    body: "A profile shows recent battles, brawler progression, club history, and the trophy curve. Profiles are rebuilt on visit when the underlying data is older than a few minutes.",
  },
  {
    href: "/leaderboards",
    title: "Rankings",
    body: "Rankings pull from the Supercell API on a refresh cadence. Use the region filter to scope to a country, and the search box to jump to a tag inside the current list.",
  },
  {
    href: "/brawlers",
    title: "Brawler tierlist",
    body: "Each brawler surfaces win rate, pick rate, and a score weighted by sample size. Open any brawler to drill into its per-map matchup table.",
  },
] as const

const support = [
  {
    href: "/ask",
    title: "Ask AI",
    body: "Guided answers for meta, builds, maps, and account questions, backed by the live dataset.",
  },
  {
    href: "/contact",
    title: "Contact support",
    body: "Bug reports, account problems, and billing issues go straight to the team.",
  },
] as const

function Defs({ items }: { items: ReadonlyArray<{ href?: string; title: string; body: string }> }) {
  return (
    <dl className="bl-doc-defs">
      {items.map(item => (
        <Fragment key={item.title}>
          <dt>{item.href ? <Link href={item.href}>{item.title}</Link> : item.title}</dt>
          <dd>{item.body}</dd>
        </Fragment>
      ))}
    </dl>
  )
}

export default function HelpPage() {
  return (
    <div className="bl-doc-frame">
      <GuideNav />
      <div className="bl-doc-content">
        <GuideShell>
          <GuideHero
            breadcrumb={[{ label: "Documentation", href: "/guides" }, { label: "Help" }]}
            title="Help center"
            description={(
              <>
                <p>
                  How to use BrawlLens: searching players, reading the rankings, and linking your account. Most pages
                  explain themselves once you know where the data comes from. This page covers the rest.
                </p>
                <p>
                  For live game data questions, ask the <Link href="/ask">BrawlLens AI</Link>. For anything broken,{" "}
                  <Link href="/contact">contact support</Link>.
                </p>
              </>
            )}
          />

          <GuideSection
            title="Ask a question"
            help="Questions go to the BrawlLens AI, which answers from the live tierlist, map, and profile data."
          >
            <form action="/ask" role="search" className="bl-doc-ask">
              <input
                name="q"
                type="search"
                placeholder="Ask about tags, rankings, maps…"
                aria-label="Ask BrawlLens AI"
              />
              <button type="submit">Ask →</button>
            </form>
          </GuideSection>

          <GuideSection title="Getting around">
            <Defs items={gettingAround} />
          </GuideSection>

          <GuideSection
            title="Your account"
            help={(
              <>
                Signing in is optional: every tierlist, ranking, and profile works without it. Linking a tag adds the
                personal layer on top.
              </>
            )}
          >
            <Defs
              items={[
                {
                  href: "/account",
                  title: "Link your player tag",
                  body: "Sign in from the top right, then attach your tag under Account → Settings. Once linked, your tag is remembered across sessions and unlocks personalized recommendations.",
                },
              ]}
            />
          </GuideSection>

          <GuideSection title="Still stuck?">
            <Defs items={support} />
          </GuideSection>
        </GuideShell>
      </div>
    </div>
  )
}
