import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

export async function GET(req: NextRequest) {
    const key = req.headers.get("x-cockpit-key");
    if (!key || key !== process.env.COCKPIT_API_KEY) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const sb = getSupabase();

  const { data: credits, error: credErr } = await sb
      .from("user_credits")
      .select("user_id, credits, updated_at");

  if (credErr) {
        return NextResponse.json({ error: credErr.message }, { status: 500 });
  }

  const { data: reports } = await sb
      .from("user_reports")
      .select("user_id, tool, created_at");

  const { data: orders } = await sb
      .from("orders")
      .select("user_id, credits_added, amount_usd, created_at");

  const userMap: Record<string, any> = {};

  for (const c of credits ?? []) {
        userMap[c.user_id] = {
                user_id: c.user_id,
                credits: c.credits,
                credits_updated: c.updated_at,
                dig_count: 0,
                stack_count: 0,
                total_reports: 0,
                last_activity: null,
                total_spent: 0,
        };
  }

  for (const r of reports ?? []) {
        if (!userMap[r.user_id]) {
                userMap[r.user_id] = {
                          user_id: r.user_id,
                          credits: 0,
                          credits_updated: null,
                          dig_count: 0,
                          stack_count: 0,
                          total_reports: 0,
                          last_activity: null,
                          total_spent: 0,
                };
        }
        const u = userMap[r.user_id];
        u.total_reports++;
        if (r.tool === "dig") u.dig_count++;
        if (r.tool === "stack") u.stack_count++;
        if (!u.last_activity || r.created_at > u.last_activity) {
                u.last_activity = r.created_at;
        }
  }

  for (const o of orders ?? []) {
        if (userMap[o.user_id]) {
                userMap[o.user_id].total_spent += Number(o.amount_usd ?? 0);
        }
  }

  const clerkKey = process.env.CLERK_SECRET_KEY;
    const userIds = Object.keys(userMap);

  if (clerkKey && userIds.length > 0) {
        try {
                const params = userIds.map((id) => `user_id[]=${id}`).join("&");
                const res = await fetch(
                          `https://api.clerk.com/v1/users?${params}&limit=100`,
                  { headers: { Authorization: `Bearer ${clerkKey}` } }
                        );
                if (res.ok) {
                          const clerkUsers = await res.json();
                          for (const cu of clerkUsers) {
                                      if (userMap[cu.id]) {
                                                    userMap[cu.id].email =
                                                                    cu.email_addresses?.[0]?.email_address ?? null;
                                                    userMap[cu.id].name =
                                                                    [cu.first_name, cu.last_name].filter(Boolean).join(" ") || null;
                                                    userMap[cu.id].created_at = cu.created_at
                                                      ? new Date(cu.created_at).toISOString()
                                                                    : null;
                                                    userMap[cu.id].last_sign_in = cu.last_sign_in_at
                                                      ? new Date(cu.last_sign_in_at).toISOString()
                                                                    : null;
                                      }
                          }
                }
        } catch (_) {}
  }

  const users = Object.values(userMap).sort((a: any, b: any) =>
        (b.last_activity ?? b.credits_updated ?? "") >
        (a.last_activity ?? a.credits_updated ?? "")
                                                  ? 1
          : -1
                                              );

  return NextResponse.json({ users, total: users.length });
}
