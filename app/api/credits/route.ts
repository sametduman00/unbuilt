import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCredits, initUserCredits } from "@/app/lib/credits";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initUserCredits(userId);
  const credits = await getCredits(userId);
  return NextResponse.json({ credits });
}
