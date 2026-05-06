import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getRequestUser } from "@/lib/auth"
import { DEFAULT_LENSBOARD_WIDGETS, normalizeLensboardWidgets } from "@/lib/lensboard"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const user = await getRequestUser(request)
  if (!user) {
    return NextResponse.json({ widgets: DEFAULT_LENSBOARD_WIDGETS }, { status: 401 })
  }

  return NextResponse.json({ widgets: normalizeLensboardWidgets(user.dashboardWidgets) })
}

export async function POST(request: Request) {
  const user = await getRequestUser(request)
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as { widgets?: unknown } | null
  const widgets = normalizeLensboardWidgets(body?.widgets)

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "account_storage_not_configured", widgets }, { status: 503 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      lensboard_widgets: widgets,
    },
  })

  if (error) {
    return NextResponse.json({ error: "lensboard_save_failed", widgets }, { status: 502 })
  }

  return NextResponse.json({ ok: true, widgets })
}
