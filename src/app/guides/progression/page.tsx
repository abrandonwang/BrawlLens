export const revalidate = 300

import type { Metadata } from "next"
import Link from "next/link"
import { BrawlerGuideRow, GuideHero, GuideMetric, GuideSection, GuideShell, formatNumber, formatPercent } from "../GuideContent"
import { fetchGuideDataset } from "@/lib/guideData"

export const metadata: Metadata = {
  title: "Progression Guide - BrawlLens",
  description: "Data-backed Brawl Stars upgrade priorities from BrawlLens win rate, pick volume, and map coverage.",
}

function progressionScore(score: number, consistency: number, coverage: number) {
  return score * 0.62 + consistency * 0.25 + Math.min(coverage, 10) * 1.3
}

export default async function ProgressionGuidePage() {
  const data = await fetchGuideDataset()
  const upgradeFirst = [...data.brawlers]
    .filter(brawler => brawler.picks >= 1_000 && brawler.mapCoverage >= 2)
    .sort((a, b) => progressionScore(b.score, b.consistency, b.mapCoverage) - progressionScore(a.score, a.consistency, a.mapCoverage))
    .slice(0, 10)
  const specialists = [...data.brawlers]
    .filter(brawler => brawler.bestMap && brawler.bestMap.picks >= 1_000)
    .sort((a, b) => (b.bestMap?.winRate ?? 0) - (a.bestMap?.winRate ?? 0))
    .slice(0, 6)
  const hold = [...data.brawlers]
    .filter(brawler => brawler.picks >= 1_000)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)

  return (
    <GuideShell>
      <GuideHero
        title="Progression Guide"
        description="Use this as a first upgrade pass: prioritize brawlers with strong current results, broad map coverage, and enough games to trust."
        meta={(
          <>
            <GuideMetric label="Upgrade formula" value="Score + coverage" help="The priority list blends guide score, consistency, and qualifying map coverage." />
            <GuideMetric label="Minimum sample" value="1,000 games" help="Upgrade recommendations ignore very tiny tracked samples." />
            <GuideMetric label="Data pool" value={formatNumber(data.totalPicks)} help="Total tracked brawler pick rows considered for this guide." />
          </>
        )}
      />

      <div className="bl-guide-grid">
        <GuideSection title="Upgrade First" help="Best default upgrades from the current dataset. These are broad picks, not only single-map spikes.">
          <div className="bl-guide-list">
            {upgradeFirst.map((brawler, index) => (
              <BrawlerGuideRow
                key={brawler.id}
                brawler={brawler}
                rank={index + 1}
                label={`${brawler.role} · ${formatPercent(brawler.consistency)} consistency · ${brawler.mapCoverage} maps`}
              />
            ))}
          </div>
        </GuideSection>

        <GuideSection title="Specialist Upgrades" help="These are more map-dependent. Upgrade them when you actively play their strongest maps or modes.">
          <div className="bl-guide-note-list">
            {specialists.map((brawler, index) => (
              <Link key={brawler.id} href={`/brawlers/${brawler.id}`}>
                <span className="bl-guide-rank">{index + 1}</span>
                <strong>{brawler.name}</strong>
                <span>{brawler.bestMap ? `${brawler.bestMap.name} · ${formatPercent(brawler.bestMap.winRate)} · ${formatNumber(brawler.bestMap.picks)} games` : "No map sample"}</span>
              </Link>
            ))}
          </div>
        </GuideSection>

        <GuideSection title="Upgrade Later" help="These brawlers have enough tracked games but weaker current guide scores, so they are lower priority unless you personally main them.">
          <div className="bl-guide-note-list">
            {hold.map((brawler, index) => (
              <Link key={brawler.id} href={`/brawlers/${brawler.id}`}>
                <span className="bl-guide-rank">{index + 1}</span>
                <strong>{brawler.name}</strong>
                <span>{formatPercent(brawler.winRate)} win rate · {formatNumber(brawler.picks)} games</span>
              </Link>
            ))}
          </div>
        </GuideSection>

        <GuideSection title="How To Use It" help="This page is public meta guidance. Player-specific inventory recommendations can layer on later from a searched profile.">
          <div className="bl-guide-copy">
            <p>Upgrade broad, stable brawlers first when resources are limited.</p>
            <p>Pick specialists when your favorite modes or current rotation maps match their best samples.</p>
            <p>Use lower-priority picks for comfort, quests, or personal mains rather than pure efficiency.</p>
          </div>
        </GuideSection>
      </div>
    </GuideShell>
  )
}
