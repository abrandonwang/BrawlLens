import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Guides Maintenance - BrawlLens",
  description: "BrawlLens guides are temporarily unavailable while the section is being revised.",
}

export default function GuidesMaintenanceLayout() {
  return (
    <main className="mx-auto grid min-h-[calc(100dvh-180px)] w-[min(720px,calc(100vw-28px))] place-items-center pt-28 pb-16 text-[#f5f4f1]">
      <section className="w-full rounded-[12px] border border-[rgba(245,244,241,0.10)] bg-[#101015] px-6 py-7 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <h1 className="m-0 text-[clamp(24px,4vw,36px)] font-[900] leading-none tracking-[0] [font-family:var(--font-heading)]">
          Guides are under maintenance
        </h1>
        <p className="mx-auto mt-3 max-w-[520px] text-[13px] font-[620] leading-[1.55] text-[rgba(245,244,241,0.78)]">
          This section is temporarily disabled while the guide system is being rebuilt.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-9 items-center justify-center rounded-[8px] bg-[#7c5cff] px-4 text-[12px] font-[820] text-white no-underline transition-colors hover:bg-[#6b4cff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a78bff] [font-family:var(--font-label)]"
        >
          Back to home
        </Link>
      </section>
    </main>
  )
}
