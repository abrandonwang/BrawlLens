import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getRequestUser } from "@/lib/auth"
import { DEFAULT_LENSBOARD_LAYOUT, normalizeLensboardLayout, normalizeLensboardWidgets } from "@/lib/lensboard"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const user = await getRequestUser(request)
  if (!user) {
    return NextResponse.json({ layout: DEFAULT_LENSBOARD_LAYOUT, widgets: normalizeLensboardWidgets(DEFAULT_LENSBOARD_LAYOUT) }, { status: 401 })
  }

  const layout = normalizeLensboardLayout(user.dashboardWidgets)
  return NextResponse.json({ layout, widgets: normalizeLensboardWidgets(layout) })
}

export async function POST(request: Request) {
  const user = await getRequestUser(request)
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as { layout?: unknown; widgets?: unknown } | null
  const layout = normalizeLensboardLayout(body?.layout ?? body?.widgets)
  const widgets = normalizeLensboardWidgets(layout)

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "account_storage_not_configured", layout, widgets }, { status: 503 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: existingUser } = await admin.auth.admin.getUserById(user.id)
  const existingMetadata = existingUser.user?.user_metadata
  const safeMetadata = existingMetadata && typeof existingMetadata === "object" && !Array.isArray(existingMetadata)
    ? existingMetadata
    : {}

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...safeMetadata,
      lensboard_layout: layout,
      lensboard_widgets: widgets,
    },
  })

  if (error) {
    return NextResponse.json({ error: "lensboard_save_failed", layout, widgets }, { status: 502 })
  }

  return NextResponse.json({ ok: true, layout, widgets })
}
