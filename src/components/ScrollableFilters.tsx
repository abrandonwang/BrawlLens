"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Option<T> {
  value: T
  label: ReactNode
  key?: string
}

interface Props<T> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  /** Optional cycle helpers for compact mobile picker. If absent, picker hidden on mobile. */
  cycleLabel?: ReactNode
  className?: string
  ariaLabel?: string
}

export default function ScrollableFilters<T>({
  options,
  value,
  onChange,
  cycleLabel,
  className = "",
  ariaLabel,
}: Props<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = useCallback((resetStart = false) => {
    const el = ref.current
    if (!el) return
    if (resetStart) el.scrollLeft = 0
    setCanLeft(el.scrollLeft > 0)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    const refresh = (resetStart = false) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => update(resetStart))
    }
    const refreshFromStart = () => refresh(true)
    const onScroll = () => update()
    const observer = new ResizeObserver(refreshFromStart)
    refreshFromStart()
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    el.addEventListener("scroll", onScroll)
    window.addEventListener("resize", refreshFromStart)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      el.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", refreshFromStart)
    }
  }, [options, update])

  function scrollBy(dir: "left" | "right") {
    ref.current?.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" })
  }

  function cycle(dir: 1 | -1) {
    const idx = options.findIndex(o => Object.is(o.value, value))
    const next = (idx + dir + options.length) % options.length
    onChange(options[next].value)
  }

  return (
    <>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={`relative ml-auto flex min-w-0 flex-1 justify-end max-w-[calc(100%-220px)] max-md:hidden ${className}`}
      >
        {canLeft && (
          <button
            type="button"
            onClick={() => scrollBy("left")}
            className="absolute top-0 bottom-0 left-0 z-10 flex cursor-pointer items-center border-0 bg-[linear-gradient(to_right,var(--panel)_50%,transparent)] py-0 pr-3.5 pl-0.5 text-[var(--ink-3)]"
            aria-label="Scroll left"
          >
            <ChevronLeft size={14} />
          </button>
        )}
        <div
          ref={ref}
          className="flex w-auto max-w-full flex-nowrap justify-start overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="inline-flex shrink-0 gap-0.5 rounded-full border border-[var(--line)] bg-[var(--panel)] p-[3px]">
            {options.map(opt => {
              const active = Object.is(opt.value, value)
              return (
                <button
                  key={opt.key ?? String(opt.value)}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onChange(opt.value)}
                  className={`relative shrink-0 cursor-pointer whitespace-nowrap rounded-full border-0 px-[13px] py-[5px] text-[11.5px] font-medium transition-all ${active ? "bg-[var(--panel-2)] text-[var(--ink)]" : "bg-transparent text-[var(--ink-3)] hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] hover:text-[var(--ink)]"}`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
        {canRight && (
          <button
            type="button"
            onClick={() => scrollBy("right")}
            className="absolute top-0 right-0 bottom-0 z-10 flex cursor-pointer items-center border-0 bg-[linear-gradient(to_left,var(--panel)_50%,transparent)] py-0 pr-0.5 pl-3.5 text-[var(--ink-3)]"
            aria-label="Scroll right"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="hidden w-full items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--panel)] p-1 max-md:flex">
        <button
          type="button"
          onClick={() => cycle(-1)}
          disabled={options.length <= 1}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[var(--ink-3)] transition-colors hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] hover:text-[var(--ink)] disabled:cursor-default disabled:opacity-25"
          aria-label="Previous"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="flex-1 truncate px-2 text-center text-[12.5px] font-semibold text-[var(--ink)]">
          {cycleLabel ?? options.find(o => Object.is(o.value, value))?.label}
        </span>
        <span className="shrink-0 pr-1 font-mono text-[10px] text-[var(--ink-4)]">
          {options.findIndex(o => Object.is(o.value, value)) + 1}/{options.length}
        </span>
        <button
          type="button"
          onClick={() => cycle(1)}
          disabled={options.length <= 1}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[var(--ink-3)] transition-colors hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] hover:text-[var(--ink)] disabled:cursor-default disabled:opacity-25"
          aria-label="Next"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </>
  )
}
