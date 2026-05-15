import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { authRedirectUrl, setAuthSessionCookies } from "@/lib/auth"
import { checkEmailLegitimacy, isEmailSyntax, normalizeEmail } from "@/lib/emailValidation"

export const runtime = "nodejs"

type AuthSetupErrorCode = "setup_link_generation_failed" | "magic_link_email_failed"
type AuthMode = "signup" | "login"

class AuthSetupError extends Error {
  code: AuthSetupErrorCode

  constructor(code: AuthSetupErrorCode) {
    super(code)
    this.code = code
  }
}

function isStrongPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && /\d/.test(value)
}

function authMode(value: unknown): AuthMode {
  return value === "login" ? "login" : "signup"
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function setupLinkEmail(email: string, actionLink: string) {
  const safeEmail = escapeHtml(email)
  const safeLink = escapeHtml(actionLink)
  const subject = "Set up your BrawlLens account"
  const text = [
    "Set up your BrawlLens account",
    "",
    `Use this setup link to confirm ${email} and finish onboarding:`,
    actionLink,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n")
  const html = `
    <div style="margin:0;background:#080b10;padding:32px 18px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f4f6fb;">
      <div style="margin:0 auto;max-width:440px;border:1px solid rgba(255,255,255,0.1);border-radius:16px;background:#101419;padding:28px;box-shadow:0 28px 72px rgba(0,0,0,0.42);">
        <div style="height:34px;width:34px;border-radius:10px;background:conic-gradient(from 120deg,#f97316,#ec4899,#8b5cf6,#3b82f6,#14b8d6,#f97316);"></div>
        <h1 style="margin:24px 0 8px;font-size:28px;line-height:1.05;font-weight:700;letter-spacing:-0.03em;color:#f4f6fb;">Set up BrawlLens</h1>
        <p style="margin:0 0 22px;color:#a7adba;font-size:14px;line-height:1.55;">Confirm ${safeEmail}, connect your Brawl Stars account, and take the quick site walkthrough.</p>
        <a href="${safeLink}" style="display:block;border-radius:10px;background:#202632;color:#f7f8ff;text-align:center;text-decoration:none;padding:13px 16px;font-size:14px;font-weight:650;">Finish setup</a>
        <p style="margin:22px 0 0;color:rgba(244,246,251,0.48);font-size:12px;line-height:1.55;">If you did not request this, you can safely ignore this email.</p>
      </div>
    </div>
  `

  return { subject, text, html }
}

function forceActionLinkRedirect(actionLink: string, redirectTo: string) {
  try {
    const url = new URL(actionLink)
    url.searchParams.set("redirect_to", redirectTo)
    return url.toString()
  } catch {
    return actionLink
  }
}

async function sendCustomSetupLink(request: Request, email: string, password: string, supabaseUrl: string) {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  const resendKey = process.env.RESEND_API_KEY ?? process.env.RESEND_API
  const from = process.env.AUTH_EMAIL_FROM

  if (!serviceKey || !resendKey || !from) return false

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const redirectTo = authRedirectUrl(request, "/auth/setup")
  let link = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      redirectTo,
    },
  })

  if (link.error) {
    link = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo,
      },
    })
  }

  if (link.error || !link.data.properties?.action_link) {
    console.error("BrawlLens setup link generation failed", link.error?.message ?? "Missing action link")
    throw new AuthSetupError("setup_link_generation_failed")
  }

  const actionLink = forceActionLinkRedirect(link.data.properties.action_link, redirectTo)
  const emailContent = setupLinkEmail(email, actionLink)
  const resend = new Resend(resendKey)
  const { error: emailError } = await resend.emails.send({
    from,
    to: email,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
    replyTo: process.env.AUTH_EMAIL_REPLY_TO || undefined,
  })

  if (emailError) {
    console.error("BrawlLens setup email failed", emailError.message)
    throw new AuthSetupError("magic_link_email_failed")
  }
  return true
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null)
  const email = body && typeof body === "object" ? (body as Record<string, unknown>).email : null
  const password = body && typeof body === "object" ? (body as Record<string, unknown>).password : null
  const mode = authMode(body && typeof body === "object" ? (body as Record<string, unknown>).mode : null)

  if (!isEmailSyntax(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 })
  }
  if (!isStrongPassword(password)) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 })
  }

  const normalizedEmail = normalizeEmail(email)

  const url = process.env.SUPABASE_URL
  if (!url) {
    return NextResponse.json({ error: "auth_not_configured" }, { status: 503 })
  }

  if (mode === "login") {
    const key = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_KEY
    if (!key) {
      return NextResponse.json({ error: "auth_not_configured" }, { status: 503 })
    }

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error || !data.session) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 })
    }

    const response = NextResponse.json({
      ok: true,
      mode,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    })
    setAuthSessionCookies(response, {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    })

    return response
  }

  const emailCheck = await checkEmailLegitimacy(normalizedEmail)
  if (!emailCheck.ok) {
    return NextResponse.json({ error: emailCheck.reason }, { status: 400 })
  }

  try {
    const sentByBrawllens = await sendCustomSetupLink(request, normalizedEmail, password, url)
    if (!sentByBrawllens) {
      return NextResponse.json({ error: "custom_email_not_configured" }, { status: 503 })
    }
    return NextResponse.json({ ok: true, sender: "brawllens" })
  } catch (error) {
    if (error instanceof AuthSetupError) {
      return NextResponse.json({ error: error.code }, { status: 502 })
    }
    console.error("BrawlLens account setup failed", error)
    return NextResponse.json({ error: "login_failed" }, { status: 502 })
  }
}
