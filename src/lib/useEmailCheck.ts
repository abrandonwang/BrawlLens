"use client"

import { useEffect, useMemo, useState } from "react"

export type EmailCheckStatus = "idle" | "format" | "checking" | "valid" | "invalid"
type EmailValidationReason = "invalid_email" | "disposable_domain" | "email_unreachable"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type EmailCheckPayload = {
  ok?: boolean
  reason?: EmailValidationReason
}

export function isEmailFormatValid(email: string) {
  return EMAIL_RE.test(email.trim())
}

export function emailCheckMessage(status: EmailCheckStatus, reason?: EmailValidationReason | "network" | null) {
  if (status === "idle") return "Email will be checked before setup."
  if (status === "format") return "Enter a valid email format."
  if (status === "checking") return "Checking email..."
  if (status === "valid") return "Email can receive setup links."
  if (reason === "disposable_domain") return "Use a permanent email address."
  if (reason === "email_unreachable") return "Use an email with an active mail server."
  if (reason === "network") return "Email check is unavailable right now."
  return "Enter a valid email address."
}

export function useEmailCheck(email: string, enabled = true) {
  const [status, setStatus] = useState<EmailCheckStatus>("idle")
  const [reason, setReason] = useState<EmailValidationReason | "network" | null>(null)
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email])

  useEffect(() => {
    setReason(null)

    if (!enabled || normalizedEmail.length === 0) {
      setStatus("idle")
      return
    }

    if (!isEmailFormatValid(normalizedEmail)) {
      setStatus("format")
      return
    }

    let active = true
    const controller = new AbortController()
    setStatus("checking")

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/auth/email-check?email=${encodeURIComponent(normalizedEmail)}`, {
          cache: "no-store",
          signal: controller.signal,
        })
        const payload = await response.json().catch(() => null) as EmailCheckPayload | null
        if (!active) return

        if (response.ok && payload?.ok) {
          setStatus("valid")
          setReason(null)
          return
        }

        setStatus("invalid")
        setReason(payload?.reason ?? "network")
      } catch {
        if (!active) return
        setStatus("invalid")
        setReason("network")
      }
    }, 450)

    return () => {
      active = false
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [enabled, normalizedEmail])

  return {
    isFormatValid: isEmailFormatValid(normalizedEmail),
    isValid: status === "valid",
    message: emailCheckMessage(status, reason),
    normalizedEmail,
    reason,
    status,
  }
}
