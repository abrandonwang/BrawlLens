import Link from "next/link"
import type { ReactNode } from "react"

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`bl-skeleton ${className}`} aria-hidden="true" />
}

export function EmptyState({
  title,
  description,
  action,
  secondary,
}: {
  title: string
  description: string
  action?: ReactNode
  secondary?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--line-2)] bg-[color-mix(in_srgb,var(--panel)_78%,transparent)] px-5 py-12 text-center shadow-[var(--shadow-lift)]">
      <p className="m-0 text-[15px] font-semibold leading-snug text-[var(--ink)]">{title}</p>
      <p className="mx-auto mt-2 mb-0 max-w-[420px] text-[13px] leading-relaxed text-[var(--ink-3)]">{description}</p>
      {(action || secondary) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondary}
        </div>
      )}
    </div>
  )
}

export function StateButton({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="bl-state-action">
      {children}
    </button>
  )
}

export function StateLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="bl-state-action">
      {children}
    </Link>
  )
}

export function LeaderboardSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="leaderboard-table overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow-lift)]">
      <div className="leaderboard-header grid grid-cols-[48px_1fr_180px_100px_24px] gap-3 border-b border-[var(--line)] bg-[var(--panel-2)] px-5 py-2.5">
        <SkeletonBlock className="h-3 w-5" />
        <SkeletonBlock className="h-3 w-16" />
        <SkeletonBlock className="h-3 w-14 max-md:hidden" />
        <SkeletonBlock className="ml-auto h-3 w-16" />
        <span />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="leaderboard-row grid grid-cols-[48px_1fr_180px_100px_24px] items-center gap-3 px-5 py-3 max-md:grid-cols-[40px_1fr_90px_20px] max-md:px-3.5" style={{ borderBottom: i < rows - 1 ? "1px solid var(--line)" : "none" }}>
          <SkeletonBlock className="h-4 w-6" />
          <div className="space-y-1.5">
            <SkeletonBlock className="h-3.5 w-[min(180px,70%)]" />
            <SkeletonBlock className="h-2.5 w-20" />
          </div>
          <SkeletonBlock className="h-3 w-24 max-md:hidden" />
          <SkeletonBlock className="ml-auto h-3.5 w-16" />
          <SkeletonBlock className="size-3" />
        </div>
      ))}
    </div>
  )
}

export function MapGridSkeleton({ cards = 12 }: { cards?: number }) {
  return (
    <div className="relative pt-1">
      <div className="mb-3.5 flex items-end justify-between gap-2.5 rounded-lg bg-[color-mix(in_srgb,var(--panel)_72%,transparent)] px-3.5 py-3">
        <div className="min-w-0 space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-5 w-32" />
        </div>
        <div className="flex gap-1.5">
          <SkeletonBlock className="h-[26px] w-16 rounded-full" />
          <SkeletonBlock className="h-[26px] w-24 rounded-full" />
        </div>
      </div>
      <div className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3.5 max-[520px]:grid-cols-2 max-[520px]:gap-2.5">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow-lift)]">
            <SkeletonBlock className="aspect-[3/4] w-full rounded-none" />
            <div className="space-y-2 border-t border-[var(--line)] px-3 pt-2.5 pb-3">
              <SkeletonBlock className="h-3.5 w-3/4" />
              <SkeletonBlock className="h-2.5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
