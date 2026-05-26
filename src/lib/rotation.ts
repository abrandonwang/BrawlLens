export interface RotationEvent {
  event?: {
    id?: number
    map?: string
    mode?: string
    modeId?: number
  }
  slotId?: number
  startTime?: string
  endTime?: string
}

export function parseBrawlStarsTime(value?: string | null): number | null {
  if (!value) return null

  const normalized = value.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(.*)$/,
    "$1-$2-$3T$4:$5:$6$7"
  )
  const time = new Date(normalized).getTime()
  return Number.isFinite(time) ? time : null
}

export function formatRotationTimeRemaining(endTime?: string | null, now = Date.now()) {
  const end = parseBrawlStarsTime(endTime)
  if (!end) return null

  const remaining = end - now
  if (remaining <= 0) return "Ends soon"

  const totalMinutes = Math.max(1, Math.ceil(remaining / 60_000))
  const days = Math.floor(totalMinutes / 1_440)
  const hours = Math.floor((totalMinutes % 1_440) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `Ends in ${days}d ${hours}h`
  if (hours > 0) return `Ends in ${hours}h ${minutes}m`
  return `Ends in ${minutes}m`
}
