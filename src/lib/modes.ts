export interface ModeMeta {
  label: string
  color: string
}

export const MODE_CONFIG: Record<string, ModeMeta> = {
  brawlBall:    { label: "Brawl Ball",    color: "#3B5BDB" },
  gemGrab:      { label: "Gem Grab",      color: "#7E22CE" },
  knockout:     { label: "Knockout",      color: "#A16207" },
  bounty:       { label: "Bounty",        color: "#15803D" },
  heist:        { label: "Heist",         color: "#DC2626" },
  hotZone:      { label: "Hot Zone",      color: "#C2410C" },
  wipeout:      { label: "Wipeout",       color: "#0F766E" },
  duels:        { label: "Duels",         color: "#BE185D" },
  siege:        { label: "Siege",         color: "#636E72" },
  soloShowdown: { label: "Showdown",      color: "#15803D" },
  duoShowdown:  { label: "Duo SD",        color: "#0F766E" },
  trioShowdown: { label: "Trio SD",       color: "#0F766E" },
  payload:      { label: "Payload",       color: "#5B21B6" },
  basketBrawl:  { label: "Basket Brawl",  color: "#B45309" },
  volleyBrawl:  { label: "Volley Brawl",  color: "#A16207" },
  botDrop:      { label: "Bot Drop",      color: "#636E72" },
  hunters:      { label: "Hunters",       color: "#B91C1C" },
  trophyEscape: { label: "Trophy Escape", color: "#0E7490" },
  paintBrawl:   { label: "Paint Brawl",   color: "#6D28D9" },
  wipeout5V5:   { label: "5v5 Wipeout",   color: "#0F766E" },
}

export function getModeName(mode: string): string {
  return (
    MODE_CONFIG[mode]?.label ||
    mode.charAt(0).toUpperCase() + mode.slice(1).replace(/([A-Z])/g, " $1")
  )
}

export function getModeColor(mode: string | null | undefined): string | undefined {
  if (!mode) return undefined
  return MODE_CONFIG[mode]?.color
}
