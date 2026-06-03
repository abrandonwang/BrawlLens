import { NextResponse } from "next/server"
import { unstable_cache } from "next/cache"

const WIKI_API_URL = "https://brawlstars.fandom.com/api.php"
const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800"
const WIKI_HEADERS = {
  "User-Agent": "BrawlLens/1.0 asset resolver",
}
const FILE_RE = /^[a-z0-9 ._'&()!+\-]+\.png$/i

type WikiImagePage = {
  imageinfo?: Array<{ url?: string }>
  missing?: boolean
}

type WikiImageQuery = {
  query?: {
    pages?: Record<string, WikiImagePage>
  }
}

function cleanFileName(value: string | null) {
  const fileName = (value ?? "").trim().replace(/\s+/g, " ")
  if (!fileName || fileName.length > 140 || !FILE_RE.test(fileName)) return null
  return fileName
}

async function resolveWikiImageUrl(fileName: string) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "imageinfo",
    iiprop: "url",
    titles: `File:${fileName}`,
  })

  const response = await fetch(`${WIKI_API_URL}?${params.toString()}`, {
    headers: WIKI_HEADERS,
    next: { revalidate: 86400 },
  })
  if (!response.ok) return null

  const payload = await response.json().catch(() => null) as WikiImageQuery | null
  const page = Object.values(payload?.query?.pages ?? {})[0]
  const url = page?.imageinfo?.[0]?.url
  if (!url) return null

  try {
    const parsed = new URL(url)
    if (parsed.hostname !== "static.wikia.nocookie.net") return null
    return parsed.toString()
  } catch {
    return null
  }
}

const getCachedWikiImageUrl = unstable_cache(
  resolveWikiImageUrl,
  ["brawl-stars-wiki-image-url-v1"],
  { revalidate: 86400 },
)

export async function GET(request: Request) {
  const fileName = cleanFileName(new URL(request.url).searchParams.get("file"))
  if (!fileName) {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 })
  }

  const imageUrl = await getCachedWikiImageUrl(fileName)
  if (!imageUrl) {
    return NextResponse.json({ error: "image_not_found" }, { status: 404 })
  }

  const imageResponse = await fetch(imageUrl, {
    headers: WIKI_HEADERS,
    next: { revalidate: 86400 },
  })
  const contentType = imageResponse.headers.get("content-type") ?? ""
  if (!imageResponse.ok || !contentType.startsWith("image/")) {
    return NextResponse.json({ error: "image_fetch_failed" }, { status: 502 })
  }

  return new NextResponse(imageResponse.body, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "Content-Type": contentType,
    },
  })
}
