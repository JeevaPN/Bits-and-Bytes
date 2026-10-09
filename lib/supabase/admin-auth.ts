import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Admin sign-in is not configured yet. Add the login flow before using database write actions.");
  const { data: profile } = await supabase.from("profiles").select("primary_role,display_name").eq("id", user.id).maybeSingle();
  if (profile?.primary_role !== "admin") throw new Error("Only signed-in Admin accounts can perform this action.");
  return { supabase, user, profile };
}
