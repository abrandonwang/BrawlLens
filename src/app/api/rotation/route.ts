import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data, error } = await supabase
    .from("rotation")
    .select("data")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return NextResponse.json([]);
  }

  const res = NextResponse.json(data.data);
  res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  return res;
}
