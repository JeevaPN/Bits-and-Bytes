"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import type { AuthState } from "@/app/auth/actions";
import { DEMO_WORKSPACE_COOKIE } from "@/lib/auth/demo-workspace";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability/logger";

const demoEmails = {
  admin: "admin.demo@civicsync.test",
  common: "neighbour.demo@civicsync.test",
  group: "partner.demo@civicsync.test",
};

export async function signInDemo(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const role = z.enum(["admin", "common", "group"]).safeParse(formData.get("workspace"));
  if (!role.success) return { ok: false, message: "Choose a demo account." };
  const password = process.env.CIVICSYNC_DEMO_PASSWORD;
  const client = await createClient();
  if (!password || !client) return { ok: false, message: "Demo accounts are not configured. Please use the regular sign-in form." };

  const { data, error } = await client.auth.signInWithPassword({ email: demoEmails[role.data], password });
  if (error || !data.user) {
    logger.warn("demo sign-in rejected", { operation: "demo_sign_in", code: error?.code || "AUTH_ERROR" });
    return { ok: false, message: "This demo account could not sign in. Please try again." };
  }
  const { data: profile, error: profileError } = await client.from("profiles").select("primary_role").eq("id", data.user.id).single();
  if (profileError || profile?.primary_role !== role.data || data.user.app_metadata.demo_account !== "civicsync-demo-accounts-v1") {
    await client.auth.signOut({ scope: "local" });
    logger.warn("demo workspace mismatch", { operation: "demo_sign_in", code: profileError?.code || "DEMO_ROLE_MISMATCH" });
    return { ok: false, message: "The demo account’s workspace is unavailable. Please try again later." };
  }
  (await cookies()).delete(DEMO_WORKSPACE_COOKIE);
  return { ok: true, message: "Opening your demo workspace…", redirectTo: "/" };
}
