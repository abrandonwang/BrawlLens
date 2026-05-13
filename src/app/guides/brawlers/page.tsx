export const revalidate = 300

import type { Metadata } from "next"
import Link from "next/link"
import { BrawlerGuideRow, GuideHero, GuideMetric, GuideSection, GuideShell, formatNumber, formatPercent } from "../GuideContent"
import { fetchGuideDataset } from "@/lib/guideData"

export const metadata: Metadata = {
  title: "Brawler Guide - BrawlLens",
  description: "A data-backed BrawlLens brawler wiki with win rates, games, roles, and best maps.",
}

export default async function BrawlerGuidePage() {
  const data = await fetchGuideDataset()
  const ranked = data.brawlers.slice(0, 30)
  const bestByRole = Array.from(
    data.brawlers.reduce((roles, brawler) => {
      const current = roles.get(brawler.role)
      if (!current || brawler.score > current.score) roles.set(brawler.role, brawler)
      return roles
    }, new Map<string, typeof data.brawlers[number]>())
  ).sort((a, b) => b[1].score - a[1].score)

  return (
    <GuideShell>
      <GuideHero
        title="Brawler Guide"
        description="A compact wiki view of the brawler dataset: score, role, sample size, and best map context."
        meta={(
          <>
            <GuideMetric label="Brawlers ranked" value={formatNumber(data.brawlers.length)} help="Brawlers with enough tracked picks to enter the guide dataset." />
            <GuideMetric label="Top win rate" value={ranked[0] ? formatPercent(ranked[0].winRate) : "-"} help="The win rate of the current highest guide-score brawler." />
            <GuideMetric label="Tracked picks" value={formatNumber(data.totalPicks)} help="Total brawler pick rows represented in this guide." />
          </>
        )}
      />

      <div className="bl-guide-grid">
        <GuideSection title="Brawler Wiki Rankings" help="Guide score is not just raw win rate. It blends win rate, volume, and consistency to avoid overrating tiny samples.">
          <div className="bl-guide-list">
            {ranked.map((brawler, index) => (
              <BrawlerGuideRow
                key={brawler.id}
                brawler={brawler}
                rank={index + 1}
                label={brawler.bestMap ? `${brawler.role} · best on ${brawler.bestMap.name}` : `${brawler.role} · ${brawler.rarity}`}
              />
            ))}
          </div>
        </GuideSection>

        <GuideSection title="Best By Role" help="This is useful when you need a role fit rather than a single overall best brawler.">
          <div className="bl-guide-note-list">
            {bestByRole.map(([role, brawler], index) => (
              <Link key={role} href={`/brawlers/${brawler.id}`}>
                <span className="bl-guide-rank">{index + 1}</span>
                <strong>{role}</strong>
                <span>{brawler.name} · {formatPercent(brawler.winRate)} · {formatNumber(brawler.picks)} games</span>
              </Link>
            ))}
          </div>
        </GuideSection>
      </div>
    </GuideShell>
  )
}
