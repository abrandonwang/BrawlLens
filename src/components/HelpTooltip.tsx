import type { ReactNode } from "react"

type HelpTooltipProps = {
  label: string
  children: ReactNode
  align?: "center" | "left"
}

export default function HelpTooltip({ label, children, align = "center" }: HelpTooltipProps) {
  return (
    <span className={`bl-help-tooltip bl-help-tooltip-${align}`}>
      <button
        type="button"
        className="bl-help-trigger"
        aria-label={label}
      >
        ?
      </button>
      <span className="bl-help-card" role="tooltip">
        {children}
      </span>
    </span>
  )
}
