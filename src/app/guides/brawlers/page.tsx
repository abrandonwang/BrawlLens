export const revalidate = 300

import type { Metadata } from "next"
import Link from "next/link"
import {
  BrawlerGuideRow,
  GuideHero,
  GuideMetric,
  GuideSection,
  GuideShell,
  formatBrawlerName,
  formatNumber,
  formatPercent,
} from "../GuideContent"
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
        breadcrumb={[
          { label: "Documentation", href: "/guides" },
          { label: "Brawlers" },
        ]}
        title="Brawler wiki"
        description={(
          <p>
            A compact wiki view of the brawler dataset: score, role, sample size, and best-map context. Each row links
            into the full brawler page, where you can compare against the live{" "}
            <Link href="/brawlers">brawler tierlist</Link>.
          </p>
        )}
        meta={(
          <>
            <GuideMetric label="Brawlers" value={formatNumber(data.brawlers.length)} />
            <GuideMetric label="Top win rate" value={ranked[0] ? formatPercent(ranked[0].winRate) : "-"} />
            <GuideMetric label="Tracked picks" value={formatNumber(data.totalPicks)} />
          </>
        )}
      />

      <GuideSection
        title="Rankings"
        help={(
          <>
            Guide score blends win rate, volume, and consistency so tiny samples do not lead. Open the{" "}
            <Link href="/guides/progression">progression guide</Link> for upgrade order.
          </>
        )}
      >
        <div className="bl-doc-list">
          {ranked.map((brawler, index) => (
            <BrawlerGuideRow
              key={brawler.id}
              brawler={brawler}
              rank={index + 1}
              label={brawler.bestMap ? `${brawler.role.toLowerCase()} · best on ${brawler.bestMap.name.toLowerCase()}` : `${brawler.role.toLowerCase()} · ${brawler.rarity.toLowerCase()}`}
            />
          ))}
        </div>
      </GuideSection>

      <GuideSection
        title="Best by role"
        help={(
          <>
            Useful when you need a role fit, not a single overall best brawler. For deeper comparisons, drop the role
            into <Link href="/ask">Ask AI</Link>.
          </>
        )}
      >
        <div className="bl-doc-list">
          {bestByRole.map(([role, brawler], index) => (
            <Link key={role} href={`/brawlers/${brawler.id}`} className="bl-doc-row">
              <span className="bl-doc-row-rank">{(index + 1).toString().padStart(2, "0")}</span>
              <span className="bl-doc-row-main">
                <strong>{role}</strong>
                <span>{formatBrawlerName(brawler.name)}</span>
              </span>
              <span className="bl-doc-row-meta">{formatPercent(brawler.winRate)}</span>
              <span className="bl-doc-row-muted">{formatNumber(brawler.picks)} games</span>
            </Link>
          ))}
        </div>
      </GuideSection>
    </GuideShell>
  )
}
