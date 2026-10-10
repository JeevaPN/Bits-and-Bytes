"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { logger } from "@/lib/observability/logger";
import { authErrorMessage } from "@/lib/auth/messages";
import { cookies } from "next/headers";
import { DEMO_WORKSPACE_COOKIE } from "@/lib/auth/demo-workspace";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { workspaceHome, workspaceForPath } from "@/lib/auth/workspace-access";

const credentials = z.object({ email: z.string().trim().email(), password: z.string().min(8).max(128) });
const displayName = z.string().trim().min(2).max(80);
// Public signup can request resident or community-group membership only.
 // admin role requires a trusted staff workflow
const workspace = z.enum(["common", "group"]);
export type AuthState = { ok: boolean; message: string; redirectTo?: string };
const invalid = (message = "Please check the form and try again."): AuthState => ({ ok: false, message });

export async function signUp(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.extend({ displayName, workspace }).safeParse(Object.fromEntries(formData)); if (!parsed.success) return invalid("Choose your account type and check your name, email, and password.");
  const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment.");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !serviceUrl) return invalid("Account role saving is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.");
  const service = createServiceClient(serviceUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await client.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { data: { display_name: parsed.data.displayName, requested_workspace: parsed.data.workspace } } });
  if (error) { logger.warn("sign-up rejected", { route: "/auth/sign-up", operation: "sign_up", code: `${error.code || error.status?.toString() || "AUTH_ERROR"}:${error.message.slice(0, 220)}` }); return invalid(authErrorMessage(error.code)); }
  // Supabase can return an obfuscated user for an existing email. Never change
  // an existing account's role in response to that registration attempt.
  if (!data.user || !data.user.identities?.length) return invalid("Could not create a new account with these details. If you already registered, sign in instead.");
  const { data: account, error: accountError } = await service.auth.admin.getUserById(data.user.id);
  if (accountError || !account.user) {
    logger.error("signup account lookup failed", { operation: "save_signup_workspace", code: accountError?.code || "USER_NOT_FOUND" });
    if (data.session) await client.auth.signOut();
    return invalid("Your account was created, but its workspace could not be saved. Please contact support before signing in.");
  }
  // This server-owned marker fixes the first choice for repeat signup attempts.
  const savedWorkspace = workspace.safeParse(account.user.app_metadata.signup_workspace);
  const selectedWorkspace = savedWorkspace.success ? savedWorkspace.data : parsed.data.workspace;
  const { error: profileError } = await service.from("profiles").upsert({ id: data.user.id, display_name: parsed.data.displayName, primary_role: selectedWorkspace }, { onConflict: "id" });
  if (profileError) {
    logger.error("signup workspace save failed", { operation: "save_signup_workspace", code: profileError.code });
    if (data.session) await client.auth.signOut();
    return invalid("Your account was created, but its workspace could not be saved. Please contact support before signing in.");
  }
  if (!savedWorkspace.success) {
    const { error: markerError } = await service.auth.admin.updateUserById(data.user.id, { app_metadata: { signup_workspace: selectedWorkspace } });
    if (markerError) {
      logger.error("signup workspace lock failed", { operation: "lock_signup_workspace", code: markerError.code || "AUTH_ERROR" });
      if (data.session) await client.auth.signOut();
      return invalid("Your workspace was saved, but registration could not finish. Please contact support before signing in.");
    }
  }
  (await cookies()).delete(DEMO_WORKSPACE_COOKIE);
  return data.session
    ? { ok: true, message: "Account created and signed in.", redirectTo: workspaceHome(selectedWorkspace) }
    : { ok: true, message: "Account created. Sign in with your email and password.", redirectTo: "/auth/sign-in" };
}

export async function signIn(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse(Object.fromEntries(formData)); if (!parsed.success) return invalid();
  const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment.");
  const { error } = await client.auth.signInWithPassword(parsed.data); if (error) { logger.warn("sign-in rejected", { route: "/auth/sign-in", operation: "sign_in", code: error.code || error.status?.toString() || "AUTH_ERROR" }); return invalid(error.code === "email_not_confirmed" ? authErrorMessage(error.code) : "Sign-in failed. Check your email and password."); }
  const { data: { user } } = await client.auth.getUser();
  const { data: profile } = user ? await client.from("profiles").select("primary_role").eq("id", user.id).maybeSingle() : { data: null };
  const role = profile?.primary_role === "admin" || profile?.primary_role === "group" ? profile.primary_role : "common";
  (await cookies()).delete(DEMO_WORKSPACE_COOKIE);
  const requested = safeRedirectPath(String(formData.get("next") || ""), workspaceHome(role));
  const requestedRole = workspaceForPath(requested);
  const redirectTo = requestedRole && requestedRole !== role ? workspaceHome(role) : requested;
  return { ok: true, message: "Signed in.", redirectTo };
}

export async function signOut(): Promise<AuthState> {
  const client = await createClient();
  if (client) {
    const { error } = await client.auth.signOut();
    if (error) return invalid("Could not sign out. Please try again.");
  }
  (await cookies()).delete(DEMO_WORKSPACE_COOKIE);
  return { ok: true, message: "Signed out.", redirectTo: "/" };
}

export async function requestPasswordReset(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const email = z.string().email().safeParse(String(formData.get("email") || "")); if (!email.success) return invalid();
  const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment.");
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  await client.auth.resetPasswordForEmail(email.data, { redirectTo: `${origin}/auth/callback?next=/auth/reset-password` });
  return { ok: true, message: "If an account matches that address, a password-reset email will arrive shortly." };
}

export async function updatePassword(_previous: AuthState, formData: FormData): Promise<AuthState> { const password = z.string().min(8).max(128).safeParse(String(formData.get("password") || "")); const confirmation = String(formData.get("confirmation") || ""); if (!password.success || password.data !== confirmation) return invalid("Passwords must match and contain at least 8 characters."); const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment."); const { data: { user } } = await client.auth.getUser(); if (!user) return invalid("This reset link is invalid or expired."); const { error } = await client.auth.updateUser({ password: password.data }); return error ? invalid("We could not update your password. Request a new reset link.") : { ok: true, message: "Password updated.", redirectTo: "/auth/sign-in" }; }
