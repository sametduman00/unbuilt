import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getReport } from "@/app/lib/reports";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id || typeof id !== "string" || id.length > 64) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const report = await getReport(userId, id);
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ report });
  } catch (err) {
    console.error("reports detail error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "report_fetch_failed" }, { status: 503 });
  }
}
