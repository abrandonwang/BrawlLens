import TierlistSubNav from "@/components/TierlistSubNav"
import { MapGridSkeleton, SkeletonBlock } from "@/components/PolishStates"

export default function MapsIndexLoading() {
  return (
    <main className="bl-tier-shell">
      <TierlistSubNav active="maps" />
      <div className="dpm-page-shell">
        <section className="bl-tier-intro-card" aria-labelledby="maps-loading-title">
          <h1 id="maps-loading-title">Maps</h1>
          <div className="bl-tier-analyzed">
            <span>BATTLES ANALYZED</span>
            <SkeletonBlock className="h-7 w-36" />
          </div>
          <div className="mx-auto mt-5 grid max-w-[700px] justify-items-center gap-2">
            <SkeletonBlock className="h-3.5 w-[min(540px,90vw)]" />
            <SkeletonBlock className="h-3.5 w-[min(440px,78vw)]" />
          </div>
        </section>

        <section className="bl-tier-board" aria-label="Loading maps">
          <div className="bl-tier-toolbar">
            <SkeletonBlock className="h-[34px] w-[min(320px,100%)] rounded-[4px]" />
            <SkeletonBlock className="h-[34px] w-[132px] rounded-[4px]" />
          </div>
          <MapGridSkeleton />
        </section>
      </div>
    </main>
  )
}
