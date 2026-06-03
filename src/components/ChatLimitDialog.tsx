"use client"

import { X } from "lucide-react"
import { AI_LIMITS, type ChatLimitPayload } from "@/lib/aiLimits"

interface ChatLimitDialogProps {
  gate: ChatLimitPayload | null
  onClose: () => void
}

function resetLabel(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date)
}

export default function ChatLimitDialog({ gate, onClose }: ChatLimitDialogProps) {
  if (!gate) return null

  const loginGate = gate.reason === "auth_required"
  const title = loginGate ? "Daily limit reached" : "Daily limit reached"
  const body = loginGate
    ? `Log in to get ${AI_LIMITS.freeDailyMessages} messages per day instead of ${gate.limit}.`
    : `You've used ${gate.limit} messages today.`
  const reset = resetLabel(gate.resetAt)

  function openLogin() {
    onClose()
    window.dispatchEvent(new CustomEvent("brawllens:open-login", { detail: { mode: "signup", next: "/ask" } }))
  }

  return (
    <div
      className="fixed inset-0 z-[700] grid place-items-center bg-[rgba(6,7,10,0.62)] px-4 backdrop-blur-[14px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-limit-title"
      onClick={onClose}
    >
      <section
        className="relative w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[#0f1016] p-6 text-[#f5f4f1] shadow-[0_40px_90px_-32px_rgba(0,0,0,0.9)]"
        onClick={event => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 grid size-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[rgba(245,244,241,0.55)] outline-none transition-colors hover:bg-[rgba(245,244,241,0.06)] hover:text-[#f5f4f1] focus-visible:bg-[rgba(245,244,241,0.06)] focus-visible:text-[#f5f4f1]"
          aria-label="Close"
        >
          <X size={15} strokeWidth={2.4} aria-hidden="true" />
        </button>

        <h2 id="chat-limit-title" className="m-0 pr-6 text-[20px] font-[780] leading-[1.15] tracking-[-0.012em]">
          {title}
        </h2>
        <p className="mb-0 mt-2 text-[13.5px] font-[520] leading-[1.55] text-[rgba(245,244,241,0.72)]">
          {body}
        </p>
        {reset ? (
          <p className="mb-0 mt-2 text-[12px] font-[520] leading-[1.4] text-[rgba(245,244,241,0.46)]">
            Resets around {reset}.
          </p>
        ) : null}

        {loginGate ? (
          <div className="mt-5">
            <button
              type="button"
              onClick={openLogin}
              className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-[9px] border-0 bg-[#f5f4f1] px-4 text-[13.5px] font-[760] leading-none text-[#0d0d11] outline-none transition-opacity hover:opacity-90 focus-visible:opacity-90"
            >
              Sign up free
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}
