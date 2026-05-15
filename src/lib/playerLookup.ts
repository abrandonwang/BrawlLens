import { cleanEnv } from "@/lib/env"

type NextFetchOptions = RequestInit & {
  next?: {
    revalidate?: number | false
    tags?: string[]
  }
}

export function playerProxyUrl(): string | null {
  return cleanEnv(process.env.PLAYER_API_URL)
}

export function battleLogProxyUrl(): string | null {
  return cleanEnv(process.env.PLAYER_BATTLELOG_API_URL) ?? cleanEnv(process.env.BATTLELOG_API_URL)
}

export function clubProxyUrl(): string | null {
  return cleanEnv(process.env.CLUB_API_URL) ?? cleanEnv(process.env.PLAYER_API_URL)
}

function brawlApiKey(): string | null {
  return (
    cleanEnv(process.env.BRAWL_API_KEY) ??
    cleanEnv(process.env.BRAWL_API_KEY_HOME) ??
    cleanEnv(process.env.BRAWL_API_KEY_SCHOOL)
  )
}

function applyPlayerProxyTemplate(url: string, tag: string, endpoint: "profile" | "battlelog" | "club") {
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

function uniqueUrls(urls: (string | null)[]): string[] {
  return Array.from(new Set(urls.filter((url): url is string => Boolean(url))))
}

function buildBattleLogProxyUrls(url: string, tag: string, options?: { allowBaseUrl?: boolean; assumeBattleLog?: boolean }): string[] {
  const hasTemplate = url.includes("{tag}") || url.includes("{hashTag}") || url.includes("{endpoint}")
  const encodedTag = encodeURIComponent(tag)
  const encodedHashTag = encodeURIComponent(`#${tag}`)

  if (hasTemplate) {
    const templatedUrl = applyPlayerProxyTemplate(url, tag, "battlelog")
    if (options?.assumeBattleLog || url.includes("{endpoint}") || /battlelog(?:[/?#]|$)/i.test(templatedUrl)) {
      return [templatedUrl]
    }

    if (!/[?#]/.test(templatedUrl)) {
      return [`${templatedUrl.replace(/\/$/, "")}/battlelog`]
    }

    return []
  }

  if (!options?.allowBaseUrl) return []

  const baseUrl = url.replace(/\/$/, "")
  return uniqueUrls([
    `${baseUrl}/player/${encodedTag}/battlelog`,
    `${baseUrl}/players/${encodedHashTag}/battlelog`,
  ])
}

function buildClubProxyUrls(url: string, tag: string, options?: { allowBaseUrl?: boolean }): string[] {
  const hasTemplate = url.includes("{tag}") || url.includes("{hashTag}") || url.includes("{endpoint}")
  const encodedTag = encodeURIComponent(tag.replace(/^#/, ""))
  const encodedHashTag = encodeURIComponent(`#${tag.replace(/^#/, "")}`)

  if (hasTemplate) {
    const templatedUrl = applyPlayerProxyTemplate(url, tag.replace(/^#/, ""), "club")
    if (url.includes("{endpoint}") || /clubs?(?:[/?#]|$)/i.test(templatedUrl)) {
      return [templatedUrl]
    }

    if (!/[?#]/.test(templatedUrl)) {
      return [
        `${templatedUrl.replace(/\/$/, "")}/club/${encodedTag}`,
        `${templatedUrl.replace(/\/$/, "")}/clubs/${encodedHashTag}`,
      ]
    }

    return []
  }

  if (!options?.allowBaseUrl) return []

  const baseUrl = url.replace(/\/$/, "")
  return uniqueUrls([
    `${baseUrl}/club/${encodedTag}`,
    `${baseUrl}/clubs/${encodedHashTag}`,
  ])
}

async function fetchFirstOk(urls: string[], init?: NextFetchOptions): Promise<Response | null> {
  let fallbackResponse: Response | null = null

  for (const url of urls) {
    try {
      const response = await fetch(url, init)
      if (response.ok) return response
      fallbackResponse ??= response
    } catch {
      // Keep trying the next compatible proxy shape before falling back to the official API.
    }
  }

  return fallbackResponse
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
  let fallbackResponse: Response | null = null

  if (explicitProxyUrl) {
    const response = await fetchFirstOk(
      buildBattleLogProxyUrls(explicitProxyUrl, tag, { allowBaseUrl: true, assumeBattleLog: true }),
      init,
    )
    if (response?.ok) return response
    fallbackResponse ??= response
  }

  const proxyUrl = playerProxyUrl()

  if (proxyUrl) {
    const response = await fetchFirstOk(
      buildBattleLogProxyUrls(proxyUrl, tag, { allowBaseUrl: !/[?#]/.test(proxyUrl) }),
      init,
    )
    if (response?.ok) return response
    fallbackResponse ??= response
  }

  const apiKey = brawlApiKey()
  if (!apiKey) {
    if (fallbackResponse) return fallbackResponse
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
  const proxyUrl = clubProxyUrl()
  let fallbackResponse: Response | null = null
  const cleanedTag = tag.replace(/^#/, "")

  if (proxyUrl) {
    const response = await fetchFirstOk(
      buildClubProxyUrls(proxyUrl, cleanedTag, { allowBaseUrl: !/[?#]/.test(proxyUrl) }),
      init,
    )
    if (response?.ok) return response
    fallbackResponse ??= response
  }

  const apiKey = brawlApiKey()
  if (!apiKey) {
    if (fallbackResponse) return fallbackResponse
    throw new Error("Missing BRAWL_API_KEY for club lookup")
  }

  return fetch(`https://api.brawlstars.com/v1/clubs/%23${encodeURIComponent(cleanedTag)}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${apiKey}`,
    },
  })
}
