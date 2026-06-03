export const AI_LIMITS = {
  anonymousDailyMessages: 10,
  freeDailyMessages: 20,
} as const

export const CHAT_LIMIT_ERROR = "chat_limit_exceeded"

export type ChatLimitReason = "auth_required" | "daily_limit"

export interface ChatLimitPayload {
  error: typeof CHAT_LIMIT_ERROR
  reason: ChatLimitReason
  message: string
  limit: number
  used: number
  remaining: number
  resetAt: string
}

export function isChatLimitPayload(value: unknown): value is ChatLimitPayload {
  if (typeof value !== "object" || value === null) return false
  const payload = value as Partial<ChatLimitPayload>
  return payload.error === CHAT_LIMIT_ERROR
    && (payload.reason === "auth_required" || payload.reason === "daily_limit")
    && typeof payload.message === "string"
}

export async function chatLimitFromResponse(response: Response): Promise<ChatLimitPayload | null> {
  if (response.status !== 429) return null
  const payload = await response.clone().json().catch(() => null)
  return isChatLimitPayload(payload) ? payload : null
}
