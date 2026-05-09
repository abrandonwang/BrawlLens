type BrandMarkProps = {
  className?: string
  size?: "sm" | "md"
}

export default function BrandMark({ className = "", size = "sm" }: BrandMarkProps) {
  return (
    <span className={`bl-brand-mark bl-brand-mark-${size} ${className}`} aria-hidden="true">
      <span className="bl-brand-glyph">
        <span className="bl-brand-glyph-core" />
      </span>
      <span className="bl-brand-word nav-wordmark">BrawlLens</span>
    </span>
  )
}
