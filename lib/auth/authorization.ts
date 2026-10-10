import { createClient, getServerUser } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { Role } from "@/lib/domain/types";
import { DEMO_WORKSPACE_COOKIE, isDemoWorkspace } from "@/lib/auth/demo-workspace";

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

/** Resolve the signed-in user's workspace. Group membership also identifies
 * community partners because normal group owners keep the common profile role. */
export async function getCurrentWorkspaceRole(): Promise<Role | null> {
  const demoWorkspace = (await cookies()).get(DEMO_WORKSPACE_COOKIE)?.value;
  if (isDemoWorkspace(demoWorkspace)) return demoWorkspace;

  const client = await createClient();
  if (!client) return null;

  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  const { data: profile } = await client
    .from("profiles")
    .select("primary_role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.primary_role === "admin" || profile?.primary_role === "group") {
    return profile.primary_role;
  }

  const { data: memberships } = await client
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id)
    .limit(1);

  return memberships?.length ? "group" : "common";
}
