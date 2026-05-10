type NextFetchOptions = RequestInit & {
  next?: {
    revalidate?: number | false
    tags?: string[]
  }
}

function cleanEnv(value: string | undefined): string | null {
  const cleaned = value?.trim().replace(/^['"]|['"]$/g, "")
  return cleaned || null
}

function playerProxyUrl(): string | null {
  return cleanEnv(process.env.PLAYER_API_URL)
}

function battleLogProxyUrl(): string | null {
  return cleanEnv(process.env.PLAYER_BATTLELOG_API_URL) ?? cleanEnv(process.env.BATTLELOG_API_URL)
}

function brawlApiKey(): string | null {
  return (
    cleanEnv(process.env.BRAWL_API_KEY) ??
    cleanEnv(process.env.BRAWL_API_KEY_HOME) ??
    cleanEnv(process.env.BRAWL_API_KEY_SCHOOL)
  )
}

function applyPlayerProxyTemplate(url: string, tag: string, endpoint: "profile" | "battlelog") {
  const encodedTag = encodeURIComponent(tag)
  const encodedHashTag = encodeURIComponent(`#${tag}`)

  return url
    .replaceAll("{tag}", encodedTag)
    .replaceAll("{hashTag}", encodedHashTag)
    .replaceAll("{endpoint}", endpoint)
}

function buildPlayerProxyUrl(url: string, tag: string): string {
  if (url.includes("{tag}") || url.includes("{hashTag}") || url.includes("{endpoint}")) {
    return applyPlayerProxyTemplate(url, tag, "profile")
  }

  return `${url.replace(/\/$/, "")}/player/${encodeURIComponent(tag)}`
}

function buildBattleLogProxyUrl(url: string, tag: string, options?: { allowBaseUrl?: boolean }): string | null {
  const hasTemplate = url.includes("{tag}") || url.includes("{hashTag}") || url.includes("{endpoint}")

  if (hasTemplate) {
    const templatedUrl = applyPlayerProxyTemplate(url, tag, "battlelog")
    if (url.includes("{endpoint}") || /battlelog(?:[/?#]|$)/i.test(templatedUrl)) {
      return templatedUrl
    }

    if (!/[?#]/.test(templatedUrl)) {
      return `${templatedUrl.replace(/\/$/, "")}/battlelog`
    }

    return null
  }

  if (!options?.allowBaseUrl) return null

  return `${url.replace(/\/$/, "")}/player/${encodeURIComponent(tag)}/battlelog`
}

export async function fetchPlayerResponse(tag: string, init?: NextFetchOptions): Promise<Response> {
  const proxyUrl = playerProxyUrl()

  if (proxyUrl) {
    return fetch(buildPlayerProxyUrl(proxyUrl, tag), init)
  }

  const apiKey = brawlApiKey()
  if (!apiKey) {
    throw new Error("Missing PLAYER_API_URL or BRAWL_API_KEY for player lookup")
  }

  return fetch(`https://api.brawlstars.com/v1/players/%23${encodeURIComponent(tag)}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${apiKey}`,
    },
  })
}

export async function fetchPlayerBattleLogResponse(tag: string, init?: NextFetchOptions): Promise<Response> {
  const explicitProxyUrl = battleLogProxyUrl()

  if (explicitProxyUrl) {
    const url = buildBattleLogProxyUrl(explicitProxyUrl, tag, { allowBaseUrl: true })
    if (url) return fetch(url, init)
  }

  const proxyUrl = playerProxyUrl()

  if (proxyUrl) {
    const url = buildBattleLogProxyUrl(proxyUrl, tag, { allowBaseUrl: !/[?#]/.test(proxyUrl) })
    if (url) return fetch(url, init)
  }

  const apiKey = brawlApiKey()
  if (!apiKey) {
    throw new Error("Missing PLAYER_BATTLELOG_API_URL or BRAWL_API_KEY for player battle log lookup")
  }

  return fetch(`https://api.brawlstars.com/v1/players/%23${encodeURIComponent(tag)}/battlelog`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${apiKey}`,
    },
  })
}

export async function fetchClubResponse(tag: string, init?: NextFetchOptions): Promise<Response> {
  const apiKey = brawlApiKey()
  if (!apiKey) {
    throw new Error("Missing BRAWL_API_KEY for club lookup")
  }

  return fetch(`https://api.brawlstars.com/v1/clubs/%23${encodeURIComponent(tag.replace(/^#/, ""))}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${apiKey}`,
    },
  })
}
