import { useEffect, type RefObject } from "react"

export function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: () => void,
  active = true,
) {
  useEffect(() => {
    if (!active) return
    const refList = Array.isArray(refs) ? refs : [refs]
    function onDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node
      for (const ref of refList) {
        if (ref.current && ref.current.contains(target)) return
      }
      handler()
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("touchstart", onDown, { passive: true })
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("touchstart", onDown)
    }
  }, [refs, handler, active])
}
