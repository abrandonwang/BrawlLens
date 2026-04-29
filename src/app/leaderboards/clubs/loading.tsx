import { LeaderboardSkeleton, SkeletonBlock } from "@/components/PolishStates"

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 pt-9 pb-20 max-md:px-4 max-md:pt-6">
      <div className="mb-[18px] space-y-3">
        <SkeletonBlock className="h-10 w-64 max-w-full" />
        <SkeletonBlock className="h-4 w-[min(460px,90%)]" />
      </div>
      <div className="mb-7 rounded-[12px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_78%,transparent)] p-2.5">
        <SkeletonBlock className="h-10 w-full" />
      </div>
      <LeaderboardSkeleton rows={12} />
    </div>
  )
}
