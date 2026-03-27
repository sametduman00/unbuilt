import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserReports, deleteReport } from "@/app/lib/reports";
import { validateReportsDeleteBody, checkPayloadSize, errorResponse } from "@/app/lib/validate";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const reports = await getUserReports(userId);
  return NextResponse.json({ reports });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkPayloadSize(req)) return new Response(JSON.stringify({ error: "Request payload too large." }), { status: 413, headers: { "Content-Type": "application/json" } });

  let rawBody: unknown;
  try { rawBody = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const validation = validateReportsDeleteBody(rawBody);
  if (!validation.ok) return errorResponse(validation);
  const { id } = validation.data;

  const ok = await deleteReport(userId, id);
  return NextResponse.json({ ok });
}
