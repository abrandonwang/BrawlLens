export function cleanEnv(value: string | undefined): string | null {
  const cleaned = value?.trim().replace(/^['"]|['"]$/g, "")
  return cleaned || null
}

function required(name: string): string {
  const value = cleanEnv(process.env[name])
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function playerApiUrl(): string {
  return required("PLAYER_API_URL")
}
