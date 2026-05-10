type LeaderboardLoadingKind = "players" | "clubs" | "brawlers"

const tabs: { key: LeaderboardLoadingKind | "community"; width: string }[] = [
  { key: "players", width: "w-[58px]" },
  { key: "clubs", width: "w-[48px]" },
  { key: "brawlers", width: "w-[66px]" },
  { key: "community", width: "w-[84px]" },
]

const rowCounts: Record<LeaderboardLoadingKind, number> = {
  players: 12,
  clubs: 12,
  brawlers: 12,
}

function LoadingTabs({ active }: { active: LeaderboardLoadingKind }) {
  return (
    <div className="bl-lb-subnav-slot">
      <div className="bl-lb-subnav-wrap">
        <div className="bl-lb-subnav">
          {tabs.map(tab => (
            <div
              key={tab.key}
              className={`bl-lb-skeleton-tab ${tab.width} ${tab.key === active ? "bl-lb-skeleton-tab-active" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function LoadingTeamRail() {
  return (
    <div className="bl-lb-team-rail">
      {[0, 1, 2, 3].map(index => (
        <div key={index} className="bl-lb-skeleton-card bl-lb-skeleton-team" />
      ))}
    </div>
  )
}

function LoadingHero({
  titleWidth = "w-72",
  withIcon = false,
}: {
  titleWidth?: string
  withIcon?: boolean
}) {
  return (
    <div className="bl-lb-hero">
      <div className="bl-lb-skeleton-copy">
        <div className={`bl-lb-skeleton-line bl-lb-skeleton-title ${titleWidth}`} />
        <div className="bl-lb-skeleton-line bl-lb-skeleton-text" />
      </div>
      {withIcon && (
        <div className="bl-lb-hero-side">
          <div className="bl-lb-skeleton-icon" />
        </div>
      )}
    </div>
  )
}

function LoadingToolbar({ kind }: { kind: LeaderboardLoadingKind }) {
  return (
    <div className="bl-lb-toolbar">
      <div className="bl-lb-skeleton-input" />
      <div className="bl-lb-toolbar-actions">
        {kind === "brawlers" ? (
          <div className="bl-lb-skeleton-pill w-[204px]" />
        ) : (
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4, 5].map(index => (
              <div key={index} className="bl-lb-skeleton-pill !w-[38px]" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingBoard({ kind }: { kind: LeaderboardLoadingKind }) {
  return (
    <section className="bl-lb-board">
      <LoadingToolbar kind={kind} />
      <div className="bl-lb-podium-grid">
        {[0, 1, 2].map(index => (
          <div key={index} className="bl-lb-skeleton-card bl-lb-skeleton-podium" />
        ))}
      </div>
      <div className="bl-lb-panel">
        <div className="bl-lb-table-list">
          {Array.from({ length: rowCounts[kind] }).map((_, index) => (
            <div key={index} className="bl-lb-skeleton-row" />
          ))}
        </div>
      </div>
    </section>
  )
}

export function LeaderboardLoading({
  titleWidth = "w-72",
  kind = "players",
}: {
  titleWidth?: string
  kind?: LeaderboardLoadingKind
}) {
  return (
    <main className="bl-lb-shell">
      <LoadingTabs active={kind} />
      <div className="bl-lb-frame">
        <LoadingTeamRail />
        <LoadingHero titleWidth={titleWidth} withIcon={kind === "brawlers"} />
        <LoadingBoard kind={kind} />
      </div>
    </main>
  )
}

export function ProTeamLoading({
  active = "players",
}: {
  active?: LeaderboardLoadingKind
}) {
  return (
    <main className="bl-lb-shell">
      <LoadingTabs active={active} />
      <div className="bl-lb-frame">
        <section className="bl-pro-hero">
          <div className="bl-pro-hero-copy">
            <div className="bl-lb-skeleton-line bl-lb-skeleton-title w-64 !mx-0" />
            <div className="bl-lb-skeleton-line bl-lb-skeleton-text !mx-0 !w-[min(560px,92%)]" />
          </div>
          <div className="bl-lb-skeleton-icon !h-24 !w-24 opacity-60" />
        </section>
        <section className="bl-lb-board">
          <div className="bl-pro-board-top">
            <div className="bl-pro-segments">
              {[0, 1, 2].map(index => (
                <div key={index} className="bl-lb-skeleton-pill !h-[30px] !w-[74px]" />
              ))}
            </div>
            <div className="bl-pro-summary-strip">
              {[0, 1, 2].map(index => (
                <div key={index} className="bl-lb-skeleton-pill !h-[32px] !w-[116px]" />
              ))}
            </div>
          </div>
          <div className="bl-lb-panel">
            <div className="bl-lb-table-list">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bl-lb-skeleton-row" />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export function BrawlerRankingLoading() {
  return (
    <main className="bl-lb-shell flex-1 px-8 pt-6 pb-16 lg:px-12">
      <div className="bl-lb-skeleton-line mb-6 h-3 w-32" />
      <div className="bl-lb-skeleton-line mb-3 h-8 w-56" />
      <div className="bl-lb-skeleton-line mb-10 h-4 w-[min(420px,80%)]" />
      <div className="space-y-1">
        <div className="grid grid-cols-[52px_1fr_auto_auto_24px] gap-4 px-5 py-2 max-md:hidden">
          {[0, 1, 2, 3].map(index => (
            <div key={index} className="bl-lb-skeleton-line h-3 w-16" />
          ))}
        </div>
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="bl-lb-skeleton-row !h-[58px] !rounded-xl" />
        ))}
      </div>
      <div className="mx-auto mt-16 max-w-2xl border border-[var(--line)] bg-[var(--panel)] p-8">
        <div className="bl-lb-skeleton-line mx-auto mb-4 h-3 w-40" />
        <div className="bl-lb-skeleton-line mx-auto h-4 w-[min(520px,90%)]" />
      </div>
    </main>
  )
}
