"use client"

import Image from "next/image"

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
      className="bl-profile-ai-button"
    >
      <Image src="/ai-sparkle-512.png" alt="" width={18} height={18} className="size-[18px] shrink-0" />
      Ask AI
    </button>
  )
}
