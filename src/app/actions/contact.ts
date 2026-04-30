"use server"

import { headers } from "next/headers"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API)

const recentSubmissions = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 10 * 60_000
const RATE_LIMIT_MAX_SUBMISSIONS = 3
const RATE_LIMIT_MAX_ENTRIES = 1000

function pruneRateLimit() {
    const now = Date.now()
    for (const [key, timestamps] of recentSubmissions) {
        const fresh = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS)
        if (fresh.length === 0) {
            recentSubmissions.delete(key)
        } else if (fresh.length !== timestamps.length) {
            recentSubmissions.set(key, fresh)
        }
    }
    if (recentSubmissions.size > RATE_LIMIT_MAX_ENTRIES) {
        const oldest = Array.from(recentSubmissions.entries())
            .sort((a, b) => a[1][0] - b[1][0])
            .slice(0, recentSubmissions.size - RATE_LIMIT_MAX_ENTRIES)
        for (const [key] of oldest) recentSubmissions.delete(key)
    }
}

function getRateLimit(key: string) {
    pruneRateLimit()
    const now = Date.now()
    const timestamps = recentSubmissions.get(key) ?? []
    if (timestamps.length >= RATE_LIMIT_MAX_SUBMISSIONS) {
        const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - timestamps[0])) / 1000)
        return { limited: true, retryAfter }
    }
    recentSubmissions.set(key, [...timestamps, now])
    return { limited: false, retryAfter: 0 }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function sendContactEmail(formData: FormData) {
    const email = (formData.get("email") as string | null)?.trim() ?? ""
    const message = (formData.get("message") as string | null)?.trim() ?? ""
    const honeypot = (formData.get("website") as string | null)?.trim() ?? ""

    if (honeypot) {
        return { success: true }
    }

    const hdrs = await headers()
    const fwd = hdrs.get("x-forwarded-for") ?? ""
    const ip = fwd.split(",")[0].trim() || hdrs.get("x-real-ip") || "unknown"
    const rateLimit = getRateLimit(ip)
    if (rateLimit.limited) {
        const wait = Math.max(1, Math.ceil(rateLimit.retryAfter / 60))
        return { error: `Please wait ${wait} minute${wait === 1 ? "" : "s"} before sending another message.` }
    }

    if (!email || !message) {
        return { error: "All fields are required." }
    }

    if (!EMAIL_RE.test(email) || email.length > 254) {
        return { error: "Please enter a valid email address." }
    }

    if (message.length > 4000) {
        return { error: "Message is too long (max 4000 characters)." }
    }

    try {
        await resend.emails.send({
            from: "BrawlLens Contact <onboarding@resend.dev>",
            to: "abrandonwang@gmail.com",
            subject: `BrawlLens: Message from ${email}`,
            text: `From: ${email}\nIP: ${ip}\n\n${message}`,
        })
        return { success: true }
    } catch {
        return { error: "Failed to send. Please try again." }
    }
}
