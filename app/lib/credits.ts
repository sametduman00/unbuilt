import { getSupabase } from "@/app/lib/supabase";

export async function getCredits(userId: string): Promise<number> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("user_credits")
    .select("credits")
    .eq("user_id", userId)
    .single();
  return data?.credits ?? 0;
}

export async function deductCredit(userId: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase.rpc("deduct_credit", { p_user_id: userId });
  return data === true;
}

export async function addCredits(userId: string, amount: number): Promise<void> {
  const supabase = getSupabase();
  await supabase.rpc("add_credits", { p_user_id: userId, p_amount: amount });
}

export async function initUserCredits(userId: string): Promise<void> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("user_credits")
    .select("user_id")
    .eq("user_id", userId)
    .single();
  if (!data) {
    await supabase.from("user_credits").insert({ user_id: userId, credits: 2 });
  }
}
