export const revalidate = 300

import type { Metadata } from "next"
import Link from "next/link"
import { GuideHero, GuideMetric, GuideSection, GuideShell, MapGuideRow, formatNumber } from "../GuideContent"
import { fetchGuideDataset } from "@/lib/guideData"

export const metadata: Metadata = {
  title: "Map Guide - BrawlLens",
  description: "A BrawlLens map wiki with battle volume, modes, and links into matchup data.",
}

export default async function MapGuidePage() {
  const data = await fetchGuideDataset()
  const topMaps = data.maps.slice(0, 36)
  const modeCounts = Array.from(
    data.maps.reduce((modes, map) => {
      const current = modes.get(map.mode) ?? { battles: 0, count: 0 }
      current.battles += map.battles
      current.count += 1
      modes.set(map.mode, current)
      return modes
    }, new Map<string, { battles: number; count: number }>())
  ).sort((a, b) => b[1].battles - a[1].battles)

  return (
    <GuideShell>
      <GuideHero
        breadcrumb={[
          { label: "Documentation", href: "/guides" },
          { label: "Maps" },
        ]}
        title="Map wiki"
        description={(
          <p>
            A wiki-style map index using BrawlLens battle volume. Open a map to inspect brawler matchup rows, or
            cross-reference with the live <Link href="/meta">map tierlist</Link> and{" "}
            <Link href="/brawlers">brawler tierlist</Link>.
          </p>
        )}
        meta={(
          <>
            <GuideMetric label="Maps tracked" value={formatNumber(data.maps.length)} />
            <GuideMetric label="Battles" value={formatNumber(data.totalBattles)} />
            <GuideMetric label="Modes" value={formatNumber(modeCounts.length)} />
          </>
        )}
      />

      <GuideSection
        title="Rankings"
        help={(
          <>
            High-volume maps have the most evidence behind their matchup tables. For brawler-side reads, jump to the{" "}
            <Link href="/guides/brawlers">brawler wiki</Link>.
          </>
        )}
      >
        <div className="bl-doc-list">
          {topMaps.map((map, index) => (
            <MapGuideRow key={`${map.mode}-${map.name}`} map={map} rank={index + 1} />
          ))}
        </div>
      </GuideSection>

      <GuideSection
        title="Mode coverage"
        help={(
          <>
            Where BrawlLens currently has the most tracked battle evidence. Use the{" "}
            <Link href="/meta">map tierlist</Link> to drill into specific modes.
          </>
        )}
      >
        <div className="bl-doc-list">
          {modeCounts.map(([mode, info], index) => (
            <div key={mode} className="bl-doc-row">
              <span className="bl-doc-row-rank">{(index + 1).toString().padStart(2, "0")}</span>
              <span className="bl-doc-row-main">
                <strong>{mode}</strong>
                <span>{formatNumber(info.count)} maps</span>
              </span>
              <span className="bl-doc-row-meta">{formatNumber(info.battles)}</span>
              <span className="bl-doc-row-muted">battles</span>
            </div>
          ))}
        </div>
      </GuideSection>
    </GuideShell>
  )
}
