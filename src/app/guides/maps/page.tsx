export const revalidate = 300

import type { Metadata } from "next"
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
        title="Map Guide"
        description="A wiki-style map index using BrawlLens battle volume. Open a map to inspect brawler matchup rows."
        meta={(
          <>
            <GuideMetric label="Maps tracked" value={formatNumber(data.maps.length)} help="Maps with current tracked battle rows in BrawlLens." />
            <GuideMetric label="Battles analyzed" value={formatNumber(data.totalBattles)} help="Summed battle counts across visible map rows." />
            <GuideMetric label="Modes" value={formatNumber(modeCounts.length)} help="Distinct mode labels represented by the current map dataset." />
          </>
        )}
      />

      <div className="bl-guide-grid">
        <GuideSection title="Map Wiki Rankings" help="High-volume maps have the most evidence behind their matchup tables.">
          <div className="bl-guide-list">
            {topMaps.map((map, index) => (
              <MapGuideRow key={`${map.mode}-${map.name}`} map={map} rank={index + 1} />
            ))}
          </div>
        </GuideSection>

        <GuideSection title="Mode Coverage" help="Mode coverage shows where BrawlLens currently has the most tracked battle evidence.">
          <div className="bl-guide-note-list">
            {modeCounts.map(([mode, info], index) => (
              <div key={mode}>
                <span className="bl-guide-rank">{index + 1}</span>
                <strong>{mode}</strong>
                <span>{formatNumber(info.battles)} battles · {formatNumber(info.count)} maps</span>
              </div>
            ))}
          </div>
        </GuideSection>
      </div>
    </GuideShell>
  )
}
