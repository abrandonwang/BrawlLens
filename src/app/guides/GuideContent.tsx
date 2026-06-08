import Link from "next/link"
import { Fragment, type ReactNode } from "react"
import { winRateColor } from "@/lib/tiers"
import type { GuideBrawler, GuideMap } from "@/lib/guideData"

export type Crumb = { label: string; href?: string }

export function GuideShell({ children }: { children: ReactNode }) {
  return <main className="bl-doc">{children}</main>
}

export function GuideHero({
  breadcrumb,
  title,
  description,
  meta,
}: {
  breadcrumb?: Crumb[]
  title: string
  description: ReactNode
  meta?: ReactNode
}) {
  return (
    <header className="bl-doc-hero">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="bl-doc-breadcrumb" aria-label="Breadcrumb">
          {breadcrumb.map((crumb, index) => (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 && <span className="bl-doc-breadcrumb-sep" aria-hidden="true">→</span>}
              {crumb.href ? (
                <Link href={crumb.href}>{crumb.label}</Link>
              ) : (
                <span aria-current={index === breadcrumb.length - 1 ? "page" : undefined}>{crumb.label}</span>
              )}
            </Fragment>
          ))}
        </nav>
      )}
      <h1>{title}</h1>
      <div className="bl-doc-lead">{typeof description === "string" ? <p>{description}</p> : description}</div>
      {meta && <dl className="bl-doc-stats">{meta}</dl>}
    </header>
  )
}

export function GuideMetric({ label, value }: { label: string; value: string; help?: string }) {
  return (
    <div className="bl-doc-stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function GuideSection({
  title,
  help,
  children,
}: {
  title: string
  help?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="bl-doc-section">
      <h2>{title}</h2>
      {help && <p className="bl-doc-help">{help}</p>}
      {children}
    </section>
  )
}

export function BrawlerGuideRow({
  brawler,
  rank,
  label,
}: {
  brawler: GuideBrawler
  rank: number
  label?: string
}) {
  return (
    <Link href={`/brawlers/${brawler.id}`} className="bl-doc-row">
      <span className="bl-doc-row-rank">{rank.toString().padStart(2, "0")}</span>
      <span className="bl-doc-row-main">
        <strong>{formatBrawlerName(brawler.name)}</strong>
        <span>{label ?? `${brawler.role.toLowerCase()} · ${brawler.rarity.toLowerCase()}`}</span>
      </span>
      <span className="bl-doc-row-meta" style={{ color: winRateColor(brawler.winRate) }}>
        {formatPercent(brawler.winRate)}
      </span>
      <span className="bl-doc-row-muted">{formatNumber(brawler.picks)} games</span>
    </Link>
  )
}

export function MapGuideRow({ map, rank }: { map: GuideMap; rank: number }) {
  return (
    <Link href={`/meta/${encodeURIComponent(map.name)}`} className="bl-doc-row">
      <span className="bl-doc-row-rank">{rank.toString().padStart(2, "0")}</span>
      <span className="bl-doc-row-main">
        <strong>{map.name}</strong>
        <span>{map.mode.toLowerCase()}</span>
      </span>
      <span className="bl-doc-row-meta">{formatNumber(map.battles)}</span>
      <span className="bl-doc-row-muted">battles</span>
    </Link>
  )
}

export function formatNumber(value: number) {
  return Math.round(value).toLocaleString("en-US")
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`
}

export function formatBrawlerName(name: string) {
  return name
    .split(" ")
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ")
}
