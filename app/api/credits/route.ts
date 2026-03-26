import { rateLimit } from "@/app/api/_ratelimit";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCredits, initUserCredits } from "@/app/lib/credits";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(userId, 60, 60000);
  if (!rl.ok) return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } });
  await initUserCredits(userId);
  const credits = await getCredits(userId);
  return NextResponse.json({ credits });
}
