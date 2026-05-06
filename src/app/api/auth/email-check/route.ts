import { NextResponse } from "next/server"
import { checkEmailLegitimacy } from "@/lib/emailValidation"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email") ?? ""
  const result = await checkEmailLegitimacy(email)

  if (result.ok) {
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: false, reason: result.reason })
}
