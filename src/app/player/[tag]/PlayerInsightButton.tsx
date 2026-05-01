"use client"

import { Sparkles } from "lucide-react"

export default function PlayerInsightButton({ playerName, tag }: { playerName: string; tag: string }) {
  function askAssistant() {
    window.dispatchEvent(new CustomEvent("brawllens:open-assistant", {
      detail: {
        query: `Analyze player ${playerName} #${tag}. Give me their strengths, roster gaps, best brawlers, and what they should push next.`,
      },
    }))
  }

  return (
    <button
      type="button"
      onClick={askAssistant}
      className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--ink)] px-3.5 text-[13px] font-medium text-[var(--bg)] shadow-[var(--shadow-lift)] transition-colors hover:bg-[var(--accent-focus)]"
    >
      <Sparkles size={14} />
      Ask AI
    </button>
  )
}
