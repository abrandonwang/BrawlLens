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

function brawlApiKey(): string | null {
  return (
    cleanEnv(process.env.BRAWL_API_KEY) ??
    cleanEnv(process.env.BRAWL_API_KEY_HOME) ??
    cleanEnv(process.env.BRAWL_API_KEY_SCHOOL)
  )
}

export async function fetchPlayerResponse(tag: string, init?: NextFetchOptions): Promise<Response> {
  const proxyUrl = playerProxyUrl()

  if (proxyUrl) {
    const encodedTag = encodeURIComponent(tag)
    const encodedHashTag = encodeURIComponent(`#${tag}`)
    const url = proxyUrl.includes("{tag}")
      ? proxyUrl.replaceAll("{tag}", encodedTag).replaceAll("{hashTag}", encodedHashTag)
      : `${proxyUrl.replace(/\/$/, "")}/player/${encodedTag}`
    return fetch(url, init)
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
