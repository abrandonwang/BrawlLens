"use client"

export interface StoredAuthSession {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

const AUTH_KEY = "brawllens_auth"

function isStoredSession(value: unknown): value is StoredAuthSession {
  if (typeof value !== "object" || value === null) return false
  const session = value as Record<string, unknown>
  return typeof session.accessToken === "string" && session.accessToken.length > 0
}

export function readAuthSession(): StoredAuthSession | null {
  try {
    const raw = window.localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isStoredSession(parsed)) return null
    if (parsed.expiresAt && parsed.expiresAt * 1000 < Date.now()) {
      clearAuthSession()
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function authToken(): string | null {
  return readAuthSession()?.accessToken ?? null
}

export function authHeaders(): HeadersInit {
  const token = authToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_KEY)
}

export async function clearServerSession() {
  await fetch("/api/auth/logout", {
    method: "POST",
    cache: "no-store",
  })
}

export async function syncServerSession(session: StoredAuthSession) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(session),
  })
  if (!response.ok) throw new Error("Session sync failed")
}

export function storeAuthSessionFromHash(hash: string): StoredAuthSession | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""))
  const accessToken = params.get("access_token")
  if (!accessToken) return null

  const expiresIn = Number(params.get("expires_in") ?? 0)
  const session: StoredAuthSession = {
    accessToken,
    refreshToken: params.get("refresh_token") ?? undefined,
    expiresAt: expiresIn > 0 ? Math.floor(Date.now() / 1000) + expiresIn : undefined,
  }

  window.localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  return session
}
