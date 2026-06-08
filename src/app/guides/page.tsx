export const revalidate = 300

import { Fragment } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import {
  BrawlerGuideRow,
  GuideHero,
  GuideMetric,
  GuideSection,
  GuideShell,
  MapGuideRow,
  formatBrawlerName,
  formatNumber,
  formatPercent,
} from "./GuideContent"
import { fetchGuideDataset } from "@/lib/guideData"

export const metadata: Metadata = {
  title: "Guides - BrawlLens",
  description: "BrawlLens guides for brawler picks, maps, progression, and data interpretation.",
}

export default async function GuidesPage() {
  const data = await fetchGuideDataset()
  const topBrawlers = data.brawlers.slice(0, 5)
  const topMaps = data.maps.slice(0, 5)
  const safest = [...data.brawlers]
    .filter(brawler => brawler.mapCoverage >= 3)
    .sort((a, b) => (b.consistency + b.score) - (a.consistency + a.score))
    .slice(0, 6)

  const startHere = [
    { href: "/guides/progression", title: "Progression guide", description: "Upgrade priorities based on win rate, sample volume, and map coverage." },
    { href: "/guides/brawlers", title: "Brawler wiki", description: "Ranked brawler notes with roles, samples, and best maps." },
    { href: "/guides/maps", title: "Map wiki", description: "High-volume maps and where matchup data lives." },
  ]

  const glossary = [
    { label: "Score", description: "Blends win rate, tracked volume, and consistency so tiny spikes do not dominate the rankings." },
    { label: "Sample", description: "Shows how much evidence sits behind a recommendation. Higher samples are steadier reads." },
    { label: "Coverage", description: "Counts qualifying maps behind a brawler. Broad coverage is safer for upgrades than one-map strength." },
  ]

  return (
    <GuideShell>
      <GuideHero
        breadcrumb={[{ label: "Documentation" }]}
        title="BrawlLens Guides"
        description={(
          <>
            <p>
              A data-backed wiki for the current BrawlLens dataset: what to play, what to inspect, and what to upgrade
              first. Pages mirror the live signal from the <Link href="/brawlers">brawler tierlist</Link>, the{" "}
              <Link href="/meta">map tierlist</Link>, and the underlying battle dataset.
            </p>
            <p>
              New here? Start with the <Link href="/guides/progression">progression guide</Link>, then connect your{" "}
              <Link href="/account">profile</Link> so personal upgrade recommendations layer on top. Want a direct
              answer? Ask the <Link href="/ask">BrawlLens AI</Link>.
            </p>
          </>
        )}
        meta={(
          <>
            <GuideMetric label="Tracked picks" value={formatNumber(data.totalPicks)} />
            <GuideMetric label="Map battles" value={formatNumber(data.totalBattles)} />
            <GuideMetric label="Top score" value={topBrawlers[0] ? formatPercent(topBrawlers[0].score) : "-"} />
          </>
        )}
      />

      <GuideSection
        title="Start here"
        help={(
          <>
            The pages below are built from BrawlLens stats, not hand-written tier guesses. For raw rankings without
            commentary, jump straight to the <Link href="/brawlers">brawler tierlist</Link> or{" "}
            <Link href="/meta">map tierlist</Link>.
          </>
        )}
      >
        <dl className="bl-doc-defs">
          {startHere.map(item => (
            <Fragment key={item.href}>
              <dt><Link href={item.href}>{item.title}</Link></dt>
              <dd>{item.description}</dd>
            </Fragment>
          ))}
        </dl>
      </GuideSection>

      <GuideSection
        title="How to read the docs"
        help={(
          <>
            Pages read like reference: skim the signal, open the table when you need proof. Every brawler row links
            into the full <Link href="/brawlers">tierlist</Link>; every map row opens its{" "}
            <Link href="/meta">matchup view</Link>.
          </>
        )}
      >
        <dl className="bl-doc-defs">
          {glossary.map(item => (
            <Fragment key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.description}</dd>
            </Fragment>
          ))}
        </dl>
      </GuideSection>

      <GuideSection
        title="Current meta core"
        help={(
          <>
            The highest guide scores combine win rate, meaningful volume, and stable cross-map performance. Click any
            row to open the brawler page, or compare against the live <Link href="/brawlers">tierlist</Link>.
          </>
        )}
      >
        <div className="bl-doc-list">
          {topBrawlers.map((brawler, index) => (
            <BrawlerGuideRow key={brawler.id} brawler={brawler} rank={index + 1} />
          ))}
        </div>
      </GuideSection>

      <GuideSection
        title="Safest upgrade pool"
        help="Broad coverage means these are safer upgrades than one-map specialists."
      >
        <p className="bl-doc-inline">
          {safest.map((brawler, index) => (
            <Fragment key={brawler.id}>
              {index > 0 && ", "}
              <Link href={`/brawlers/${brawler.id}`}>
                {formatBrawlerName(brawler.name)} <span>({formatPercent(brawler.winRate)})</span>
              </Link>
            </Fragment>
          ))}
          . Full progression context is in the <Link href="/guides/progression">progression guide</Link>.
        </p>
      </GuideSection>

      <GuideSection
        title="Most analyzed maps"
        help={(
          <>
            More battle volume means more evidence behind a map's matchup table. The full map index lives in the{" "}
            <Link href="/guides/maps">map wiki</Link> and live data in the <Link href="/meta">map tierlist</Link>.
          </>
        )}
      >
        <div className="bl-doc-list">
          {topMaps.map((map, index) => (
            <MapGuideRow key={`${map.mode}-${map.name}`} map={map} rank={index + 1} />
          ))}
        </div>
      </GuideSection>

      <GuideSection title="Keep exploring">
        <p className="bl-doc-prose-p">
          BrawlLens grows with every battle the dataset ingests. Bookmark the <Link href="/brawlers">brawler tierlist</Link>{" "}
          and <Link href="/meta">map tierlist</Link> for daily checks. Use the <Link href="/leaderboards">leaderboards</Link>{" "}
          to track top players, the <Link href="/ask">AI assistant</Link> for natural-language questions, and your{" "}
          <Link href="/account">profile</Link> to surface personal recommendations. Have feedback?{" "}
          <Link href="/contact">Reach out</Link>.
        </p>
      </GuideSection>
    </GuideShell>
  )
}
