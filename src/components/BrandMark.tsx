type BrandMarkProps = {
  className?: string
  size?: "sm" | "md"
  showWordmark?: boolean
}

export default function BrandMark({ className = "", size = "sm", showWordmark = true }: BrandMarkProps) {
  return (
    <span className={`bl-brand-mark bl-brand-mark-${size} ${className}`} aria-hidden="true">
      <span className="bl-brand-glyph">
        <span className="bl-brand-glyph-core" />
      </span>
      {showWordmark && <span className="bl-brand-word nav-wordmark">BrawlLens</span>}
    </span>
  )
}
