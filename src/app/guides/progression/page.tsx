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
        breadcrumb={[
          { label: "Documentation", href: "/guides" },
          { label: "Progression" },
        ]}
        title="Progression guide"
        description={(
          <p>
            A first-pass upgrade list: prioritize brawlers with strong current results, broad map coverage, and enough
            games to trust. Pair this with the live <Link href="/brawlers">brawler tierlist</Link> and your{" "}
            <Link href="/account">profile</Link> for personal recommendations.
          </p>
        )}
        meta={(
          <>
            <GuideMetric label="Formula" value="Score + coverage" />
            <GuideMetric label="Min sample" value="1,000 games" />
            <GuideMetric label="Data pool" value={formatNumber(data.totalPicks)} />
          </>
        )}
      />

      <GuideSection
        title="Upgrade first"
        help={(
          <>
            Default upgrades from the current dataset. Broad picks, not single-map spikes. Cross-reference with the{" "}
            <Link href="/brawlers">brawler tierlist</Link> if you want raw ranking.
          </>
        )}
      >
        <div className="bl-doc-list">
          {upgradeFirst.map((brawler, index) => (
            <BrawlerGuideRow
              key={brawler.id}
              brawler={brawler}
              rank={index + 1}
              label={`${formatPercent(brawler.consistency)} consistency · ${brawler.mapCoverage} maps`}
            />
          ))}
        </div>
      </GuideSection>

      <GuideSection
        title="Specialist upgrades"
        help={(
          <>
            More map-dependent. Upgrade when you actively play their strongest maps or modes — open any map row in the{" "}
            <Link href="/meta">map tierlist</Link> to confirm rotation fit.
          </>
        )}
      >
        <div className="bl-doc-list">
          {specialists.map((brawler, index) => (
            <Link key={brawler.id} href={`/brawlers/${brawler.id}`} className="bl-doc-row">
              <span className="bl-doc-row-rank">{(index + 1).toString().padStart(2, "0")}</span>
              <span className="bl-doc-row-main">
                <strong>{formatBrawlerName(brawler.name)}</strong>
                <span>{brawler.bestMap ? `best on ${brawler.bestMap.name.toLowerCase()}` : "no map sample"}</span>
              </span>
              <span className="bl-doc-row-meta">{brawler.bestMap ? formatPercent(brawler.bestMap.winRate) : "-"}</span>
              <span className="bl-doc-row-muted">{brawler.bestMap ? `${formatNumber(brawler.bestMap.picks)} games` : ""}</span>
            </Link>
          ))}
        </div>
      </GuideSection>

      <GuideSection
        title="Upgrade later"
        help="Tracked enough but weaker current scores. Lower priority unless you main them."
      >
        <div className="bl-doc-list">
          {hold.map((brawler, index) => (
            <BrawlerGuideRow
              key={brawler.id}
              brawler={brawler}
              rank={index + 1}
              label={`${formatPercent(brawler.winRate)} win rate`}
            />
          ))}
        </div>
      </GuideSection>

      <GuideSection
        title="How to use it"
        help={(
          <>
            Public meta guidance. Player-specific recommendations layer in once you connect your{" "}
            <Link href="/account">profile</Link>.
          </>
        )}
      >
        <div className="bl-doc-prose">
          <p>
            Upgrade broad, stable brawlers first when resources are limited. The list above ranks them by score plus
            coverage so a one-map carry never beats a consistent generalist.
          </p>
          <p>
            Pick specialists when your favorite modes or current rotation maps match their best samples. Use the{" "}
            <Link href="/meta">map tierlist</Link> to check what is live, then upgrade only the specialists whose top
            maps you actually play.
          </p>
          <p>
            Use lower-priority picks for comfort, quests, or personal mains rather than pure efficiency. Want a deeper
            read? Drop the name into <Link href="/ask">Ask AI</Link> for a tailored breakdown.
          </p>
        </div>
      </GuideSection>
    </GuideShell>
  )
}
