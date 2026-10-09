import { createClient, getServerUser } from "@/lib/supabase/server";
import type { Role } from "@/lib/domain/types";

export async function getCurrentProfile() {
  const client = await createClient(); const user = await getServerUser();
  if (!client || !user) return null;
  const { data } = await client.from("profiles").select("id,display_name,primary_role").eq("id", user.id).maybeSingle();
  return data as { id: string; display_name: string; primary_role: Role } | null;
}

export async function requireRole(roles: Role[]) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("AUTH_REQUIRED");
  if (!roles.includes(profile.primary_role)) throw new Error("FORBIDDEN");
  return profile;
}
