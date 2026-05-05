"use client"

import { useEffect, useId, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

interface Props {
  open: boolean
  onClose: () => void
  labelledBy?: string
  children: ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

const SIZE_MAP = {
  sm: 480,
  md: 600,
  lg: 760,
  xl: 1100,
}

export default function Modal({
  open,
  onClose,
  labelledBy,
  children,
  className = "",
  size = "md",
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const reactId = useId()
  const titleId = labelledBy ?? `modal-title-${reactId}`

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const sheet = sheetRef.current
    if (sheet) {
      const focusable = sheet.querySelectorAll<HTMLElement>(FOCUSABLE)
      const target = focusable[0] ?? sheet
      target.focus()
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== "Tab" || !sheet) return
      const focusable = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        el => !el.hasAttribute("disabled") && el.offsetParent !== null,
      )
      if (focusable.length === 0) {
        e.preventDefault()
        sheet.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/[0.58] p-5 backdrop-blur-[10px] backdrop-saturate-125 animate-[modalOverlayIn_0.18s_ease_both]"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-[var(--line-2)] bg-[var(--panel)] shadow-[0_36px_90px_-28px_rgba(0,0,0,0.72)] outline-none animate-[modalSheetIn_0.22s_cubic-bezier(0.16,1,0.3,1)_both] ${className}`}
        style={{
          maxWidth: SIZE_MAP[size],
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function ModalCloseButton({ onClick, label = "Close" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="absolute top-4 right-4 grid size-[34px] cursor-pointer place-items-center rounded-full border border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-3)] hover:border-[var(--line-2)] hover:bg-[var(--hover-bg)] hover:text-[var(--ink)]" aria-label={label}>
      <X size={12} />
    </button>
  )
}
