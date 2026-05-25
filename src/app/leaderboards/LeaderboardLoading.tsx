type LeaderboardLoadingKind = "players" | "clubs" | "brawlers"

const tabs: { key: LeaderboardLoadingKind; width: string }[] = [
  { key: "players", width: "w-[58px]" },
  { key: "clubs", width: "w-[48px]" },
  { key: "brawlers", width: "w-[66px]" },
]

const rowCounts: Record<LeaderboardLoadingKind, number> = {
  players: 12,
  clubs: 12,
  brawlers: 12,
}

const loadingSubnavSlotClass =
  "relative z-[70] min-h-[54px] w-full px-3.5 max-[640px]:min-h-[50px] max-[640px]:px-2.5"

const loadingSubnavWrapClass =
  "sticky top-[86px] z-[80] mx-auto w-[min(1180px,calc(100vw-28px))] overflow-hidden rounded-[14px] border border-[rgba(255,255,255,0.10)] bg-[rgba(16,16,22,0.74)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_36px_-28px_rgba(0,0,0,0.82)] backdrop-blur-[18px] backdrop-saturate-[1.18] max-[820px]:top-[76px] max-[640px]:w-[calc(100vw-20px)]"

const loadingSubnavClass =
  "flex h-11 w-full items-center justify-center gap-1 border-0 p-1 max-[640px]:h-[42px]"

const loadingToolbarClass =
  "mb-2.5 flex items-center justify-between gap-2.5 p-0 max-[1024px]:flex-col max-[1024px]:items-stretch"

const loadingToolbarActionsClass =
  "flex min-w-0 items-center justify-end gap-2 max-[1024px]:justify-between max-[560px]:flex-col max-[560px]:items-stretch"

const loadingShellClass =
  "min-h-[calc(100dvh-60px)] w-full overflow-x-clip bg-[var(--bg)] text-[#f5f4f1] [--lb-accent:#7c5cff] [--lb-line:rgba(245,244,241,0.07)] [--lb-line-2:rgba(245,244,241,0.10)] [--lb-panel:#0d0d11] [--lb-panel-2:#15151b] [--lb-text:#f5f4f1] [--lb-text-3:rgba(245,244,241,0.52)] [font-family:var(--font-ui)]"

const loadingFrameClass =
  "mx-auto w-[min(1120px,calc(100vw-20px))] px-0 pb-[18px] pt-2.5 max-[560px]:w-[min(1120px,calc(100vw-48px))]"

const loadingBoardClass =
  "overflow-hidden rounded-[8px] border border-[rgba(245,244,241,0.055)] bg-[var(--panel)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_22px_60px_-46px_rgba(0,0,0,0.82)] max-[560px]:p-2"

const loadingPanelClass =
  "mt-1.5 overflow-x-auto overflow-y-visible rounded-none border-0 bg-transparent [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[560px]:-mx-0.5"

const skeletonClass =
  "animate-pulse overflow-hidden bg-[rgba(245,244,241,0.075)]"

function LoadingTabs({ active }: { active: LeaderboardLoadingKind }) {
  return (
    <div className={loadingSubnavSlotClass}>
      <div className={loadingSubnavWrapClass}>
        <div className={loadingSubnavClass}>
          {tabs.map(tab => (
            <div
              key={tab.key}
              className={`${skeletonClass} relative h-[18px] rounded-[5px] ${tab.width} ${tab.key === active ? "after:absolute after:-bottom-[11px] after:left-2.5 after:right-2.5 after:h-[3px] after:rounded-t-full after:bg-[var(--lb-accent)]" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function LoadingTeamRail() {
  return (
    <div className="mb-3 mt-2.5 grid grid-cols-4 gap-3 max-[1024px]:grid-cols-2 max-[560px]:grid-cols-1">
      {[0, 1, 2, 3].map(index => (
        <div key={index} className={`${skeletonClass} h-[138px] rounded-[8px] border border-[var(--lb-line)]`} />
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
    <div className="mb-3 block min-h-[116px] rounded-[8px] border border-[rgba(245,244,241,0.065)] bg-[var(--panel)] px-7 py-[27px] pb-[25px] text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="min-w-0">
        <div className={`${skeletonClass} mx-auto mb-3 h-[30px] max-w-full rounded-[5px] ${titleWidth}`} />
        <div className={`${skeletonClass} mx-auto h-[13px] w-[min(650px,92%)] rounded-[5px]`} />
      </div>
      {withIcon && (
        <div className="hidden items-center gap-3">
          <div className={`${skeletonClass} size-[68px] rounded-[10px] border border-[var(--lb-line)]`} />
        </div>
      )}
    </div>
  )
}

function LoadingToolbar({ kind }: { kind: LeaderboardLoadingKind }) {
  return (
    <div className={loadingToolbarClass}>
      <div className={`${skeletonClass} h-[34px] w-[min(100%,330px)] rounded-[5px]`} />
      <div className={loadingToolbarActionsClass}>
        {kind === "brawlers" ? (
          <div className={`${skeletonClass} h-[34px] w-[204px] rounded-[5px]`} />
        ) : (
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4, 5].map(index => (
              <div key={index} className={`${skeletonClass} h-[34px] w-[38px] rounded-[5px]`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingBoard({ kind }: { kind: LeaderboardLoadingKind }) {
  return (
    <section className={loadingBoardClass}>
      <LoadingToolbar kind={kind} />
      <div className="mb-2.5 grid grid-cols-3 gap-2.5 max-[760px]:flex max-[760px]:overflow-x-auto max-[560px]:gap-2">
        {[0, 1, 2].map(index => (
          <div key={index} className={`${skeletonClass} h-[210px] rounded-[5px] border border-[var(--lb-line)] max-[760px]:flex-[0_0_min(278px,84vw)]`} />
        ))}
      </div>
      <div className={loadingPanelClass}>
        <div className="grid gap-[3px] bg-transparent">
          {Array.from({ length: rowCounts[kind] }).map((_, index) => (
            <div key={index} className={`${skeletonClass} h-[39px] rounded`} />
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
    <main className={loadingShellClass}>
      <LoadingTabs active={kind} />
      <div className={loadingFrameClass}>
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
    <main className={loadingShellClass}>
      <LoadingTabs active={active} />
      <div className={loadingFrameClass}>
        <section className="relative my-2.5 min-h-[104px] overflow-hidden rounded-[8px] border border-[rgba(245,244,241,0.07)] bg-[#15171d] px-6 py-5">
          <div className="relative z-[2] max-w-[690px]">
            <div className={`${skeletonClass} mb-3 h-[30px] w-64 rounded-[5px]`} />
            <div className={`${skeletonClass} h-[13px] w-[min(560px,92%)] rounded-[5px]`} />
          </div>
          <div className={`${skeletonClass} absolute right-6 top-1/2 size-24 -translate-y-1/2 rounded-[10px] opacity-60`} />
        </section>
        <section className={loadingBoardClass}>
          <div className="mb-2.5 flex items-center justify-between gap-2.5 max-[860px]:flex-col max-[860px]:items-start">
            <div className="inline-flex h-[34px] min-w-0 overflow-hidden rounded-[5px] border border-[rgba(245,244,241,0.07)] bg-[var(--panel)] p-[3px]">
              {[0, 1, 2].map(index => (
                <div key={index} className={`${skeletonClass} h-[30px] w-[74px] rounded`} />
              ))}
            </div>
            <div className="flex min-w-0 items-center justify-end gap-1.5 max-[860px]:flex-wrap">
              {[0, 1, 2].map(index => (
                <div key={index} className={`${skeletonClass} h-8 w-[116px] rounded`} />
              ))}
            </div>
          </div>
          <div className={loadingPanelClass}>
            <div className="grid gap-[3px] bg-transparent">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className={`${skeletonClass} h-[39px] rounded`} />
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
    <main className={`${loadingShellClass} flex-1 px-8 pt-6 pb-16 lg:px-12`}>
      <div className={`${skeletonClass} mb-6 h-3 w-32 rounded-[5px]`} />
      <div className={`${skeletonClass} mb-3 h-8 w-56 rounded-[5px]`} />
      <div className={`${skeletonClass} mb-10 h-4 w-[min(420px,80%)] rounded-[5px]`} />
      <div className="space-y-1">
        <div className="grid grid-cols-[52px_1fr_auto_auto_24px] gap-4 px-5 py-2 max-md:hidden">
          {[0, 1, 2, 3].map(index => (
            <div key={index} className={`${skeletonClass} h-3 w-16 rounded-[5px]`} />
          ))}
        </div>
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className={`${skeletonClass} h-[58px] rounded-xl`} />
        ))}
      </div>
      <div className="mx-auto mt-16 max-w-2xl border border-[var(--line)] bg-[var(--panel)] p-8">
        <div className={`${skeletonClass} mx-auto mb-4 h-3 w-40 rounded-[5px]`} />
        <div className={`${skeletonClass} mx-auto h-4 w-[min(520px,90%)] rounded-[5px]`} />
      </div>
    </main>
  )
}
