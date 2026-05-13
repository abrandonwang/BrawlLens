import TierlistSubNav from "@/components/TierlistSubNav"
import { SkeletonBlock } from "@/components/PolishStates"

export default function Loading() {
  return (
    <main className="bl-tier-shell">
      <TierlistSubNav active="brawlers" />
      <div className="bl-tier-content">
        <section className="bl-tier-intro-card" aria-labelledby="brawlers-loading-title">
          <h1 id="brawlers-loading-title">Brawlers Tierlist</h1>
          <div className="bl-tier-analyzed">
            <span>BRAWLERS ANALYZED</span>
            <SkeletonBlock className="h-7 w-36" />
          </div>
          <div className="mx-auto mt-5 grid max-w-[660px] justify-items-center gap-2">
            <SkeletonBlock className="h-3.5 w-[min(520px,86vw)]" />
            <SkeletonBlock className="h-3.5 w-[min(400px,74vw)]" />
          </div>
        </section>

        <section className="bl-tier-board" aria-label="Loading brawlers">
          <div className="bl-tier-toolbar">
            <div className="bl-tier-selector-group">
              <SkeletonBlock className="h-[34px] w-[176px] rounded-[4px]" />
              <SkeletonBlock className="h-[34px] w-[176px] rounded-[4px]" />
              <SkeletonBlock className="h-[34px] w-[176px] rounded-[4px]" />
            </div>
            <SkeletonBlock className="h-[34px] w-[min(260px,100%)] rounded-[4px]" />
          </div>

          <div className="bl-tier-table-scroll">
            <div className="bl-tier-table">
              <div className="bl-tier-table-head" role="row">
                <span>Rank</span>
                <span>Brawler</span>
                <span>Rarity</span>
                <span>Class</span>
                <span>Tier</span>
                <span>Winrate</span>
                <span>Pickrate</span>
                <span>Games</span>
              </div>
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="bl-tier-row" aria-hidden="true">
                  <SkeletonBlock className="mx-auto h-4 w-5" />
                  <span className="bl-tier-brawler-cell">
                    <SkeletonBlock className="bl-tier-brawler-icon rounded-[5px]" />
                    <span className="min-w-0 space-y-1.5">
                      <SkeletonBlock className="h-3.5 w-28" />
                      <SkeletonBlock className="h-2.5 w-16" />
                    </span>
                  </span>
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock className="mx-auto h-5 w-7" />
                  <SkeletonBlock className="mx-auto h-3.5 w-16" />
                  <SkeletonBlock className="mx-auto h-3.5 w-16" />
                  <SkeletonBlock className="mx-auto h-3.5 w-20" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
