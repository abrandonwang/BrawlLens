import "server-only"

import { resolve4, resolve6, resolveMx } from "node:dns/promises"

export type EmailValidationReason = "invalid_email" | "disposable_domain" | "email_unreachable"
export type EmailValidationResult =
  | { ok: true }
  | { ok: false; reason: EmailValidationReason }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "sharklasers.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
])

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isEmailSyntax(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value.trim())
}

function emailDomain(email: string) {
  return email.split("@").pop()?.toLowerCase() ?? ""
}

function isValidDomainShape(domain: string) {
  if (domain.length < 4 || domain.length > 253) return false
  return domain
    .split(".")
    .every(label => label.length > 0 && label.length <= 63 && /^[a-z0-9-]+$/.test(label) && !label.startsWith("-") && !label.endsWith("-"))
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("email_dns_timeout")), ms)
    }),
  ])
}

async function hasMailDns(domain: string) {
  try {
    const records = await withTimeout(resolveMx(domain), 2500)
    if (records.some(record => record.exchange)) return true
  } catch {
    // Some valid domains receive mail on A/AAAA when MX is absent.
  }

  try {
    const [aRecords, aaaaRecords] = await withTimeout(
      Promise.all([
        resolve4(domain).catch(() => []),
        resolve6(domain).catch(() => []),
      ]),
      2500,
    )
    return aRecords.length > 0 || aaaaRecords.length > 0
  } catch {
    return false
  }
}

export async function checkEmailLegitimacy(email: string): Promise<EmailValidationResult> {
  const normalizedEmail = normalizeEmail(email)
  if (!isEmailSyntax(normalizedEmail)) return { ok: false, reason: "invalid_email" }

  const domain = emailDomain(normalizedEmail)
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return { ok: false, reason: "disposable_domain" }
  if (!isValidDomainShape(domain)) return { ok: false, reason: "invalid_email" }
  if (!await hasMailDns(domain)) return { ok: false, reason: "email_unreachable" }

  return { ok: true }
}
