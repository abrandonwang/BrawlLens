"use client"

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

type HelpTooltipProps = {
  label: string
  children: ReactNode
  align?: "center" | "left"
}

export default function HelpTooltip({ label, children, align = "center" }: HelpTooltipProps) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const rawLeft = align === "left" ? rect.left : rect.left + rect.width / 2
    const left = Math.min(Math.max(rawLeft, 18), window.innerWidth - 18)
    const top = Math.max(rect.top - 10, 78)
    setPosition({ left, top })
  }, [align])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("resize", updatePosition)
    return () => {
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [open, updatePosition])

  const card = mounted && open ? createPortal(
    <span
      id={id}
      className={`bl-help-card bl-help-card-portal bl-help-card-${align}`}
      role="tooltip"
      style={{
        left: position.left,
        top: position.top,
      }}
    >
      {children}
    </span>,
    document.body,
  ) : null

  return (
    <span
      className={`bl-help-tooltip bl-help-tooltip-${align}`}
      onPointerEnter={() => {
        updatePosition()
        setOpen(true)
      }}
      onPointerLeave={() => setOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        className="bl-help-trigger"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onFocus={() => {
          updatePosition()
          setOpen(true)
        }}
        onBlur={() => setOpen(false)}
        onClick={() => {
          updatePosition()
          setOpen(true)
        }}
      >
        ?
      </button>
      {card}
    </span>
  )
}
