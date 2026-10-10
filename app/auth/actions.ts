"use server";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { getCurrentWorkspaceRole } from "@/lib/auth/authorization";
import { canVisitPath, workspaceHome } from "@/lib/auth/workspace-access";
import { DEMO_WORKSPACE_COOKIE, isDemoWorkspace } from "@/lib/auth/demo-workspace";

const credentials = z.object({ email: z.string().trim().email(), password: z.string().min(8).max(128) });
const displayName = z.string().trim().min(2).max(80);
export type AuthState = { ok: boolean; message: string; redirectTo?: string; debugInfo?: string };
const invalid = (message = "Please check the form and try again.", debugInfo?: string): AuthState => ({ ok: false, message, ...(debugInfo ? { debugInfo } : {}) });

async function assignAccountRole(userId: string, role: "admin" | "common" | "group"): Promise<{ ok: true } | { ok: false; code: string; message?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return { ok: false as const, code: "service_role_not_configured" };

  const adminClient = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await adminClient
    .from("profiles")
    .update({ primary_role: role })
    .eq("id", userId)
    .select("id")
    .maybeSingle();
  return error
    ? { ok: false as const, code: error.code ?? "profile_update_failed", message: error.message }
    : data
      ? { ok: true as const }
      : { ok: false as const, code: "profile_not_found" };
}

export async function signUp(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.extend({
    displayName,
    workspace: z.enum(["common", "group", "admin"]),
  }).safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    displayName: String(formData.get("displayName") ?? "").trim(),
    workspace: String(formData.get("workspace") ?? ""),
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "displayName") return invalid("Enter a display name between 2 and 80 characters.");
    if (field === "email") return invalid("Enter a valid email address.");
    if (field === "password") return invalid("Use a password between 8 and 128 characters.");
    if (field === "workspace") return invalid("Choose a workspace to create your account.");
    return invalid("Fill in your name, email, password, and workspace to create an account.");
  }
  (await cookies()).delete(DEMO_WORKSPACE_COOKIE);
  const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment.");
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const workspaceHomePath = parsed.data.workspace === "admin"
    ? "/admin"
    : parsed.data.workspace === "group"
      ? "/community-partners/dashboard"
      : "/neighbourhood";
  const { data, error } = await client.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName, requested_workspace: parsed.data.workspace },
      emailRedirectTo: `${origin}/auth/callback?next=${workspaceHomePath}`,
    },
  });
  if (error) {
    const providerMessage = error.message.replace(/[\r\n\t]+/g, " ").slice(0, 240);
    const diagnostics = {
      provider: "supabase-auth",
      operation: "signUp",
      code: error.code ?? "unknown",
      status: error.status ?? "unknown",
      name: error.name,
      message: providerMessage,
      redirectHost: new URL(origin).host,
    };
    console.error("[auth] Sign-up failed", diagnostics);
    const debugInfo = process.env.NODE_ENV === "development"
      ? `Supabase ${diagnostics.code} · HTTP ${diagnostics.status} · ${providerMessage} · redirect host ${diagnostics.redirectHost}`
      : undefined;

    const messages: Record<string, string> = {
      email_address_invalid: "That email address is not accepted. Check it and try again.",
      weak_password: "Choose a stronger password that meets the password requirements.",
      user_already_exists: "An account may already use this email. Try signing in or resetting its password.",
      signup_disabled: "New account registration is disabled for this service.",
      email_provider_disabled: "Email and password registration is disabled for this service.",
      over_email_send_rate_limit: "Too many confirmation emails were requested. Wait a few minutes, then try again.",
      redirect_to_not_allowed: "The confirmation link URL is not allowed by the Supabase project. Add this site URL to Supabase Auth redirect URLs.",
    };

    if (error.code === "unexpected_failure" || (error.status ?? 0) >= 500) {
      return invalid("The account service could not finish registration. Check the Supabase Auth email and redirect URL settings, then try again.", debugInfo);
    }

    return invalid(messages[error.code ?? ""] ?? "Registration failed. Check the development server output for the sign-up error code, then try again.", debugInfo);
  }

  if (parsed.data.workspace === "admin") {
    // Don't promote a pre-existing account from the signup response; existing
    // users can explicitly select Admin at sign-in after proving their password.
    if (!data.user?.id || !data.user.identities?.length) {
      return invalid("This email may already have an account. Sign in and choose Admin to use that account as Admin.");
    }
    const assigned = await assignAccountRole(data.user.id, "admin");
    if (!assigned.ok) {
      console.error("[auth] Admin signup role assignment failed", {
        code: assigned.code,
        message: assigned.message?.replace(/[\r\n\t]+/g, " ").slice(0, 200),
      });
      return invalid("The account was created, but its Admin workspace could not be saved. Check the server output and Supabase profile table.");
    }
  }

  if (data.session) {
    return { ok: true, message: "Your account is ready.", redirectTo: workspaceHomePath };
  }

  return {
    ok: true,
    message: "Account created. Check your email for the confirmation link, then sign in.",
    redirectTo: "/auth/check-email",
  };
}

export async function signIn(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.extend({ workspace: z.enum(["common", "group", "admin"]) }).safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    workspace: String(formData.get("workspace") ?? ""),
  });
  if (!parsed.success) return invalid("Choose a workspace and enter a valid email and password.");
  (await cookies()).delete(DEMO_WORKSPACE_COOKIE);
  const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment.");
  const { error } = await client.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error?.code === "email_not_confirmed") {
    return invalid("Confirm your email before signing in. Check your inbox or request another confirmation email.");
  }
  if (error) return invalid("Sign-in failed. Check your email and password.");
  let role = await getCurrentWorkspaceRole();
  if (parsed.data.workspace === "admin" && role !== "admin") {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return invalid("Sign-in failed. Please sign in again.");
    const assigned = await assignAccountRole(user.id, "admin");
    if (!assigned.ok) {
      await client.auth.signOut();
      console.error("[auth] Admin sign-in role assignment failed", {
        code: assigned.code,
        message: assigned.message?.replace(/[\r\n\t]+/g, " ").slice(0, 200),
      });
      return invalid("Could not assign the Admin workspace to this account. Check the server output and Supabase profile table.");
    }
    role = "admin";
  }
  if (!role || role !== parsed.data.workspace) {
    await client.auth.signOut();
    if (!role) return invalid("This account does not have a workspace profile yet. Contact CivicSync support.");
    const actualWorkspace = role === "admin" ? "Admin" : role === "group" ? "Community Partner" : "Neighbourhood";
    return invalid(`This account is assigned to ${actualWorkspace}. Choose that workspace to sign in.`);
  }
  const defaultPath = workspaceHome(role);
  const requestedPath = safeRedirectPath(String(formData.get("next") || ""), defaultPath);
  const redirectTo = canVisitPath(role, requestedPath.split("?")[0]) ? requestedPath : defaultPath;
  return { ok: true, message: "Signed in.", redirectTo };
}

export async function signOut(): Promise<AuthState> {
  const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment.");
  const { error } = await client.auth.signOut();
  if (error) return invalid("Could not sign out. Please try again.");
  (await cookies()).delete(DEMO_WORKSPACE_COOKIE);
  return { ok: true, message: "Signed out.", redirectTo: "/" };
}

export async function enterDemoWorkspace(formData: FormData): Promise<never> {
  const workspace = String(formData.get("workspace") ?? "");
  if (!isDemoWorkspace(workspace)) redirect("/auth/sign-in");

  (await cookies()).set(DEMO_WORKSPACE_COOKIE, workspace, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
  redirect(workspaceHome(workspace));
}

export async function requestPasswordReset(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const email = z.string().email().safeParse(String(formData.get("email") || "")); if (!email.success) return invalid();
  const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment.");
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  await client.auth.resetPasswordForEmail(email.data, { redirectTo: `${origin}/auth/callback?next=/auth/reset-password` });
  return { ok: true, message: "If an account matches that address, a password-reset email will arrive shortly." };
}

export async function resendConfirmation(_previous: AuthState, formData: FormData): Promise<AuthState> { const email = z.string().email().safeParse(String(formData.get("email") || "")); if (!email.success) return invalid(); const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment."); const { error } = await client.auth.resend({ type: "signup", email: email.data }); return error ? invalid("We could not resend the confirmation email right now.") : { ok: true, message: "If the account is eligible, a new confirmation email has been requested." }; }

export async function updatePassword(_previous: AuthState, formData: FormData): Promise<AuthState> { const password = z.string().min(8).max(128).safeParse(String(formData.get("password") || "")); const confirmation = String(formData.get("confirmation") || ""); if (!password.success || password.data !== confirmation) return invalid("Passwords must match and contain at least 8 characters."); const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment."); const { data: { user } } = await client.auth.getUser(); if (!user) return invalid("This reset link is invalid or expired."); const { error } = await client.auth.updateUser({ password: password.data }); return error ? invalid("We could not update your password. Request a new reset link.") : { ok: true, message: "Password updated.", redirectTo: "/auth/sign-in" }; }
