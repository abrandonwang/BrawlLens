import TierlistSubNav from "@/components/TierlistSubNav"
import { SkeletonBlock } from "@/components/PolishStates"

export default function Loading() {
  return (
    <main className="bl-bd-shell">
      <TierlistSubNav active="brawlers" />

      <section className="bl-bd-hero">
        <div className="bl-bd-hero-inner">
          <div className="bl-bd-identity">
            <SkeletonBlock className="bl-bd-avatar rounded-[12px]" />
            <div className="bl-bd-title-block">
              <SkeletonBlock className="h-7 w-[min(420px,82vw)]" />
              <div className="bl-bd-abilities">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-[34px] w-[34px] rounded-[7px]" />
                ))}
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
          <section className="bl-bd-stat-strip" aria-label="Loading brawler summary">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="bl-bd-stat">
                <SkeletonBlock className="h-7 w-20" />
                <SkeletonBlock className="h-2.5 w-16" />
              </div>
            ))}
          </section>

          <section className="bl-bd-main-grid">
            <div className="bl-bd-panel bl-bd-build-panel">
              <div className="bl-bd-panel-head">
                <SkeletonBlock className="h-3.5 w-36" />
                <SkeletonBlock className="h-2.5 w-24" />
              </div>
              <div className="bl-bd-build-grid">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-[92px] w-full rounded-[7px]" />
                ))}
              </div>
            </div>

            {Array.from({ length: 2 }).map((_, panel) => (
              <div key={panel} className="bl-bd-panel">
                <div className="bl-bd-panel-head">
                  <SkeletonBlock className="h-3.5 w-24" />
                  <SkeletonBlock className="h-2.5 w-20" />
                </div>
                <div className="bl-bd-map-list">
                  {Array.from({ length: 4 }).map((__, row) => (
                    <SkeletonBlock key={row} className="h-[46px] w-full rounded-[7px]" />
                  ))}
                </div>
              </div>
            ))}
          </section>
        </section>
      </div>
    </main>
  )
}
