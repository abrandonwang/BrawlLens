import Link from "next/link"

const stateActionClass = "inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md border border-transparent bg-[var(--ink)] px-4 text-[14px] font-normal text-[#fcfbf8] no-underline shadow-[var(--shadow-lift)] active:scale-95 hover:bg-[var(--accent-focus)]"

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col items-center px-6 py-24 text-center">
      <div className="mb-3 font-mono text-[14px] leading-normal tracking-normal text-[var(--ink-4)]">404</div>
      <h1 className="m-0 text-[28px] font-bold tracking-tight text-[var(--ink)]">Page not found</h1>
      <p className="mt-3 max-w-[440px] text-[14px] leading-relaxed text-[var(--ink-3)]">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <Link href="/" className={stateActionClass}>Home</Link>
        <Link href="/leaderboards/players" className={stateActionClass}>Leaderboards</Link>
        <Link href="/brawlers" className={stateActionClass}>Brawlers</Link>
      </div>
    </main>
  )
}
