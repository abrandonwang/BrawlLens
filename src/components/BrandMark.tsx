import Image from "next/image"

type BrandMarkProps = {
  className?: string
  size?: "sm" | "md"
  showWordmark?: boolean
}

export default function BrandMark({ className = "", size = "sm", showWordmark = true }: BrandMarkProps) {
  const markSizeClass = size === "md" ? "text-[19px]" : "text-[18px]"
  const glyphSizeClass = size === "md" ? "size-[38px]" : "size-[25px]"

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-start gap-3 ${markSizeClass} font-medium leading-none tracking-normal text-[var(--bt-text)] [font-family:var(--font-ui)] [text-shadow:none] ${className}`}
      aria-hidden="true"
    >
      <span className={`relative inline-flex ${glyphSizeClass} shrink-0 items-center justify-center overflow-visible rounded-none bg-transparent [filter:drop-shadow(0_0_10px_rgba(124,92,255,0.22))]`}>
        <Image className="block h-full w-full object-contain" src="/brawllens-mark.svg" alt="" width={52} height={34} priority unoptimized />
      </span>
      {showWordmark && (
        <span className="inline-block text-[18px] font-medium leading-[18px] !tracking-[-0.005em] text-[var(--bt-text)] [font-family:var(--font-ui)] [text-shadow:none]">
          BrawlLens
        </span>
      )}
    </span>
  )
}
