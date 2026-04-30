import Link from "next/link"

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col items-center px-6 py-24 text-center">
      <div className="bl-mono bl-caption mb-3 text-[var(--ink-4)]">404</div>
      <h1 className="m-0 text-[28px] font-bold tracking-tight text-[var(--ink)]">Page not found</h1>
      <p className="mt-3 max-w-[440px] text-[14px] leading-relaxed text-[var(--ink-3)]">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <Link href="/" className="bl-state-action">Home</Link>
        <Link href="/leaderboards/players" className="bl-state-action">Leaderboards</Link>
        <Link href="/brawlers" className="bl-state-action">Brawlers</Link>
      </div>
    </main>
  )
}
