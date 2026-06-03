import type { Metadata } from "next"
import Link from "next/link"
import { Bot, BookOpen, ChevronRight, Wrench } from "lucide-react"

export const metadata: Metadata = {
  title: "Guides Maintenance - BrawlLens",
  description: "BrawlLens guides are temporarily unavailable while the section is being revised.",
}

export default function GuidesMaintenanceLayout() {
  return (
    <main className="bl-guides-maintenance mx-auto grid min-h-[calc(100dvh-220px)] w-[min(760px,calc(100vw-16px))] items-start justify-items-center pb-16 pt-4 text-[#f5f4f1] max-[560px]:w-[calc(100vw-12px)] max-[560px]:pt-1">
      <section className="w-full overflow-hidden rounded-[8px] border border-[rgba(245,244,241,0.09)] bg-[linear-gradient(180deg,rgba(20,22,30,0.94),rgba(12,13,18,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
        <div className="border-b border-[rgba(245,244,241,0.08)] px-5 py-5 sm:px-6">
          <span className="mb-4 grid size-11 place-items-center rounded-[8px] border border-[rgba(244,183,64,0.34)] bg-[rgba(244,183,64,0.10)] text-[#f4b740]">
            <Wrench size={23} strokeWidth={2.4} aria-hidden="true" />
          </span>
          <h1 className="m-0 text-[clamp(28px,5vw,44px)] font-[900] leading-[1.02] tracking-[0] [font-family:var(--font-heading)]">
            Guides are being rebuilt
          </h1>
          <p className="mt-2 max-w-[560px] text-[14px] font-[580] leading-[1.5] text-[rgba(245,244,241,0.68)]">
            The guide system is temporarily offline while the data model is being revised.
          </p>
        </div>

        <div className="grid gap-2 p-3">
          <Link
            href="/help"
            className="group grid min-h-[64px] grid-cols-[38px_minmax(0,1fr)_18px] items-center gap-3 rounded-[8px] border border-[rgba(245,244,241,0.08)] bg-[rgba(17,18,24,0.72)] px-3.5 py-3 text-inherit no-underline transition-[border-color,background-color] hover:border-[rgba(47,128,255,0.34)] hover:bg-[rgba(22,24,32,0.92)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f80ff]"
          >
            <span className="grid size-9 place-items-center rounded-[7px] bg-[rgba(47,128,255,0.10)] text-[#2f80ff]">
              <BookOpen size={18} strokeWidth={2.4} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <strong className="block text-[14px] font-[850] leading-[1.2] text-[#f5f4f1]">Open help center</strong>
              <span className="mt-1 block text-[12.5px] font-[560] leading-[1.25] text-[rgba(245,244,241,0.58)]">Find account, billing, and product answers.</span>
            </span>
            <ChevronRight size={17} className="text-[rgba(245,244,241,0.34)] transition-colors group-hover:text-[#7ab0ff]" strokeWidth={2.4} aria-hidden="true" />
          </Link>

          <Link
            href="/ask"
            className="group grid min-h-[64px] grid-cols-[38px_minmax(0,1fr)_18px] items-center gap-3 rounded-[8px] border border-[rgba(245,244,241,0.08)] bg-[rgba(17,18,24,0.72)] px-3.5 py-3 text-inherit no-underline transition-[border-color,background-color] hover:border-[rgba(47,128,255,0.34)] hover:bg-[rgba(22,24,32,0.92)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f80ff]"
          >
            <span className="grid size-9 place-items-center rounded-[7px] bg-[rgba(34,211,238,0.10)] text-[#22d3ee]">
              <Bot size={18} strokeWidth={2.4} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <strong className="block text-[14px] font-[850] leading-[1.2] text-[#f5f4f1]">Ask BrawlLens AI</strong>
              <span className="mt-1 block text-[12.5px] font-[560] leading-[1.25] text-[rgba(245,244,241,0.58)]">Get live answers about meta, maps, and builds.</span>
            </span>
            <ChevronRight size={17} className="text-[rgba(245,244,241,0.34)] transition-colors group-hover:text-[#7ab0ff]" strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  )
}
