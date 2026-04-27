import { getSupabase } from "@/app/lib/supabase";

export interface UserReport {
  id: string;
  user_id: string;
  tool: "gap-analysis" | "stack-advisor";
  idea: string;
  created_at: string;
  json_content?: string;
}

/** Lightweight summary used by the list view — no json_content payload */
export type UserReportSummary = Omit<UserReport, "json_content">;

export async function saveReport(
  userId: string,
  tool: "gap-analysis" | "stack-advisor",
  idea: string,
  jsonContent: string
): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("user_reports")
    .insert({
      user_id: userId,
      tool,
      idea: idea.trim().substring(0, 200),
      json_content: jsonContent,
    })
    .select("id")
    .single();
  if (error) {
    console.error("saveReport error:", error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function getUserReports(userId: string): Promise<UserReportSummary[]> {
  const supabase = getSupabase();
  // Intentionally exclude json_content — that field can be 50–200KB per row and
  // the list view only renders id/tool/idea/created_at. Detail/PDF reads use
  // getReport(userId, reportId) instead.
  const { data, error } = await supabase
    .from("user_reports")
    .select("id, user_id, tool, idea, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    // Don't silently return [] — that masks Supabase outages as "no reports"
    throw new Error(`getUserReports: ${error.message}`);
  }
  return data ?? [];
}

export async function getReport(
  userId: string,
  reportId: string
): Promise<UserReport | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("user_reports")
    .select("*")
    .eq("user_id", userId)
    .eq("id", reportId)
    .maybeSingle();
  if (error) {
    // Real Supabase failure — surface it so the API returns 503, not 404.
    throw new Error(`getReport: ${error.message}`);
  }
  return data ?? null;
}

export async function deleteReport(
  userId: string,
  reportId: string
): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("user_reports")
    .delete()
    .eq("user_id", userId)
    .eq("id", reportId);
  if (error) {
    throw new Error(`deleteReport: ${error.message}`);
  }
  return true;
}
