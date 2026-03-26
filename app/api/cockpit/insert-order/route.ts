import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";
const CORS = { "Access-Control-Allow-Origin": "*" };
export async function OPTIONS() { return new NextResponse(null, { headers: CORS }); }
export async function POST(req: NextRequest) {
  const key = req.headers.get("x-cockpit-key");
  if (!key || key !== process.env.COCKPIT_API_KEY) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { user_id, package_slug, credits_added, amount_usd } = await req.json();
  const { error } = await getSupabase().from("orders").insert({ user_id, package_slug, credits_added, amount_usd });
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
