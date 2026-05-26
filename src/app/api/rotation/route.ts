import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseBrawlStarsTime, type RotationEvent } from "@/lib/rotation";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("rotation")
    .select("data, updated_at")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return NextResponse.json([]);
  }

  const events: RotationEvent[] = data.data ?? [];
  const now = Date.now();

  const active = events.filter((e) => {
    if (!e.startTime || !e.endTime) return true;
    const start = parseBrawlStarsTime(e.startTime);
    const end = parseBrawlStarsTime(e.endTime);
    if (start == null || end == null) return true;
    return now >= start && now <= end;
  });

  const res = NextResponse.json(active);
  res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  return res;
}
