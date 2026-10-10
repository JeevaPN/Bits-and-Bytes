import { createClient } from "@/lib/supabase/browser";
import type { Role } from "@/lib/domain/types";

export async function getCurrentProfile() {
  const client = createClient();
  if (!client) return null;
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return null;
  const { data } = await client.from("profiles").select("id,display_name,primary_role").eq("id", user.id).maybeSingle();
  return data as { id: string; display_name: string; primary_role: Role } | null;
}

export async function requireRole(roles: Role[]) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("AUTH_REQUIRED");
  if (!roles.includes(profile.primary_role)) throw new Error("FORBIDDEN");
  return profile;
}

/** The saved account role takes priority over any previous demo session. */
export async function getCurrentWorkspaceRole(): Promise<Role | null> {
  const client = createClient();
  if (!client) return null;

  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  const { data: profile } = await client
    .from("profiles")
    .select("primary_role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.primary_role === "admin" || profile?.primary_role === "group" || profile?.primary_role === "common") {
    return profile.primary_role;
  }

  const { data: memberships } = await client
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id)
    .limit(1);

  return memberships?.length ? "group" : "common";
}

export async function requireAdmin() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Admin sign-in is required.");
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("primary_role,display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error("Could not verify the account role.");
  if (profile?.primary_role !== "admin") throw new Error("Only signed-in Admin accounts can perform this action.");
  return { supabase, user, profile };
}

export async function requireCurrentUser() {
  const client = createClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("AUTH_REQUIRED");
  return user;
}
