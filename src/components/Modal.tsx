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
  size?: "sm" | "md" | "lg"
}

const SIZE_MAP = {
  sm: 480,
  md: 600,
  lg: 760,
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
      className="bl-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(0,0,0,0.58)",
        backdropFilter: "blur(10px) saturate(120%)",
        WebkitBackdropFilter: "blur(10px) saturate(120%)",
      }}
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`bl-modal-sheet ${className}`}
        style={{
          width: "100%",
          maxWidth: SIZE_MAP[size],
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "var(--panel)",
          border: "1px solid var(--line-2)",
          borderRadius: 16,
          boxShadow: "0 36px 90px -28px rgba(0,0,0,0.72)",
          outline: "none",
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
    <button onClick={onClick} className="bl-modal-close" aria-label={label}>
      <X size={12} />
    </button>
  )
}
