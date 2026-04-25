import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

function parseBsTime(t: string): number {
  const s = t.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, "$1-$2-$3T$4:$5:$6");
  return new Date(s).getTime();
}

export async function GET() {
  const { data, error } = await supabase
    .from("rotation")
    .select("data, updated_at")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return NextResponse.json([]);
  }

  const events: any[] = data.data ?? [];
  const now = Date.now();

  const active = events.filter((e) => {
    if (!e.startTime || !e.endTime) return true;
    const start = parseBsTime(e.startTime);
    const end = parseBsTime(e.endTime);
    return now >= start && now <= end;
  });

  const res = NextResponse.json(active);
  res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  return res;
}
