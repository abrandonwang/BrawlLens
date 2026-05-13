export const revalidate = 300

import type { Metadata } from "next"
import Link from "next/link"
import { BrawlerGuideRow, GuideHero, GuideMetric, GuideSection, GuideShell, MapGuideRow, formatNumber, formatPercent } from "./GuideContent"
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
    .slice(0, 3)

  return (
    <GuideShell>
      <GuideHero
        title="BrawlLens Guides"
        description="A data-backed wiki for the current BrawlLens dataset: what to play, what to inspect, and what to upgrade first."
        meta={(
          <>
            <GuideMetric label="Tracked picks" value={formatNumber(data.totalPicks)} help="The summed brawler pick rows used by guide rankings." />
            <GuideMetric label="Map battles" value={formatNumber(data.totalBattles)} help="The summed battle counts from the map dataset." />
            <GuideMetric label="Top score" value={topBrawlers[0] ? formatPercent(topBrawlers[0].score) : "-"} help="Guide score combines win rate, volume, and consistency." />
          </>
        )}
      />

      <div className="bl-guide-grid">
        <GuideSection title="Start Here" help="These are entry points into the guide system. The pages are built from BrawlLens stats, not hand-written tier guesses.">
          <div className="bl-guide-link-grid">
            <Link href="/guides/progression">
              <strong>Progression Guide</strong>
              <span>Upgrade priorities based on win rate, sample volume, and map coverage.</span>
            </Link>
            <Link href="/guides/brawlers">
              <strong>Brawler Wiki</strong>
              <span>Ranked brawler notes with best maps, roles, sample size, and score.</span>
            </Link>
            <Link href="/guides/maps">
              <strong>Map Wiki</strong>
              <span>High-volume maps, modes, and where to open matchup data.</span>
            </Link>
          </div>
        </GuideSection>

        <GuideSection title="Current Meta Core" help="The highest guide scores combine good win rate, meaningful pick volume, and stable performance across maps.">
          <div className="bl-guide-list">
            {topBrawlers.map((brawler, index) => (
              <BrawlerGuideRow key={brawler.id} brawler={brawler} rank={index + 1} />
            ))}
          </div>
        </GuideSection>

        <GuideSection title="Safest Upgrade Pool" help="These brawlers have broad enough coverage to be safer upgrades than one-map specialists.">
          <div className="bl-guide-pill-list">
            {safest.map(brawler => (
              <Link key={brawler.id} href={`/brawlers/${brawler.id}`}>
                <strong>{brawler.name}</strong>
                <span>{formatPercent(brawler.winRate)} · {brawler.mapCoverage} maps</span>
              </Link>
            ))}
          </div>
        </GuideSection>

        <GuideSection title="Most Analyzed Maps" help="High battle volume means the map has more evidence behind its matchup table.">
          <div className="bl-guide-list">
            {topMaps.map((map, index) => (
              <MapGuideRow key={`${map.mode}-${map.name}`} map={map} rank={index + 1} />
            ))}
          </div>
        </GuideSection>
      </div>
    </GuideShell>
  )
}
