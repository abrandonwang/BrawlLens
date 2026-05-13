import TierlistSubNav from "@/components/TierlistSubNav"
import { SkeletonBlock } from "@/components/PolishStates"
import { LeaderboardPanel, TableHead } from "@/app/leaderboards/LeaderboardDpmShell"

const performanceGrid = "grid grid-cols-[44px_minmax(190px,1.2fr)_96px_82px_82px_60px] items-center gap-1"
const compactSignalGrid = "grid grid-cols-[34px_minmax(0,1fr)_72px] items-center gap-1"

function CompactRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bl-lb-table-list bl-md-compact-list">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className={`bl-lb-row bl-md-compact-row ${compactSignalGrid}`} aria-hidden="true">
          <SkeletonBlock className="mx-auto h-4 w-4" />
          <span className="bl-lb-identity">
            <SkeletonBlock className="bl-lb-avatar !h-7 !w-7 rounded-[5px]" />
            <span className="bl-lb-row-main grid gap-1.5">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-2.5 w-16" />
            </span>
          </span>
          <SkeletonBlock className="ml-auto h-3.5 w-12" />
        </div>
      ))}
    </div>
  )
}

export default function Loading() {
  return (
    <main className="bl-bd-shell bl-md-shell">
      <TierlistSubNav active="maps" />

      <section className="bl-bd-hero">
        <div className="bl-bd-hero-inner">
          <div className="bl-bd-identity bl-md-identity">
            <div className="bl-md-map-thumb">
              <SkeletonBlock className="size-full rounded-none" />
            </div>

            <div className="bl-bd-title-block">
              <SkeletonBlock className="h-7 w-[min(430px,82vw)]" />
              <div className="bl-md-tags">
                <SkeletonBlock className="h-6 w-14 rounded-[5px]" />
                <SkeletonBlock className="h-6 w-20 rounded-[5px]" />
                <SkeletonBlock className="h-6 w-40 rounded-[5px]" />
              </div>
            </div>

            <div className="bl-bd-summary grid gap-2">
              <SkeletonBlock className="h-3.5 w-full" />
              <SkeletonBlock className="h-3.5 w-4/5" />
            </div>
          </div>
        </div>
      </section>

      <div className="bl-lb-frame bl-bd-frame">
        <section className="bl-lb-board bl-bd-board">
          <section className="bl-bd-stat-strip" aria-label="Loading map summary">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="bl-bd-stat">
                <SkeletonBlock className="h-7 w-28" />
                <SkeletonBlock className="h-2.5 w-20" />
              </div>
            ))}
          </section>

          <section className="bl-md-snapshot-grid">
            <div className="bl-bd-panel bl-md-snapshot-card">
              <div className="bl-bd-panel-head">
                <SkeletonBlock className="h-3.5 w-20" />
                <SkeletonBlock className="h-2.5 w-16" />
              </div>
              <div className="bl-md-map-read">
                <div><SkeletonBlock className="h-4 w-28" /><SkeletonBlock className="h-3 w-full" /></div>
                <div><SkeletonBlock className="h-4 w-32" /><SkeletonBlock className="h-3 w-4/5" /></div>
              </div>
            </div>

            <div className="bl-bd-panel bl-md-snapshot-card">
              <div className="bl-bd-panel-head">
                <SkeletonBlock className="h-3.5 w-24" />
                <SkeletonBlock className="h-2.5 w-20" />
              </div>
              <div className="bl-md-snapshot-stack">
                <SkeletonBlock className="h-[58px] w-full rounded-[7px]" />
                <SkeletonBlock className="h-[58px] w-full rounded-[7px]" />
              </div>
            </div>

            <div className="bl-bd-panel bl-md-snapshot-card">
              <div className="bl-bd-panel-head">
                <SkeletonBlock className="h-3.5 w-28" />
                <SkeletonBlock className="h-2.5 w-20" />
              </div>
              <CompactRows />
            </div>
          </section>

          <section className="bl-md-performance">
            <div className="bl-bd-panel bl-md-table-panel">
              <div className="bl-md-table-head">
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="h-3 w-28" />
              </div>
              <div className="bl-md-filters">
                <SkeletonBlock className="h-[38px] w-[min(240px,100%)] rounded-[6px]" />
                <SkeletonBlock className="h-[38px] w-[210px] rounded-[6px]" />
                <SkeletonBlock className="h-[38px] w-[120px] rounded-[6px]" />
              </div>

              <LeaderboardPanel>
                <TableHead className={`${performanceGrid} bl-md-performance-head`}>
                  <span>Rank</span>
                  <span>Brawler</span>
                  <span>Win rate</span>
                  <span>Wins</span>
                  <span>Games</span>
                  <span>Tier</span>
                </TableHead>
                <div className="bl-lb-table-list">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className={`bl-lb-row bl-md-performance-row ${performanceGrid}`} aria-hidden="true">
                      <SkeletonBlock className="mx-auto h-4 w-5" />
                      <span className="bl-lb-identity">
                        <SkeletonBlock className="bl-lb-avatar rounded-[5px]" />
                        <span className="bl-lb-row-main grid gap-1.5">
                          <SkeletonBlock className="h-3.5 w-28" />
                          <SkeletonBlock className="h-2.5 w-20" />
                        </span>
                      </span>
                      <SkeletonBlock className="h-4 w-14" />
                      <SkeletonBlock className="h-3.5 w-12" />
                      <SkeletonBlock className="h-3.5 w-12" />
                      <SkeletonBlock className="h-7 w-7" />
                    </div>
                  ))}
                </div>
              </LeaderboardPanel>
            </div>

            <div className="bl-bd-panel bl-md-reliable-panel">
              <div className="bl-bd-panel-head">
                <SkeletonBlock className="h-3.5 w-24" />
                <SkeletonBlock className="h-2.5 w-20" />
              </div>
              <CompactRows rows={6} />
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
