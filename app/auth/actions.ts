"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { logger } from "@/lib/observability/logger";

const credentials = z.object({ email: z.string().trim().email(), password: z.string().min(8).max(128) });
const displayName = z.string().trim().min(2).max(80);
export type AuthState = { ok: boolean; message: string; redirectTo?: string };
const invalid = (message = "Please check the form and try again."): AuthState => ({ ok: false, message });

export async function signUp(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.extend({ displayName }).safeParse(Object.fromEntries(formData)); if (!parsed.success) return invalid();
  const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment.");
  const { error } = await client.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { data: { display_name: parsed.data.displayName } } });
  if (error) { logger.warn("sign-up rejected", { route: "/auth/sign-up", operation: "sign_up", code: error.code || error.status?.toString() || "AUTH_ERROR" }); const messages: Record<string, string> = { user_already_exists: "An account with this email already exists. Try signing in.", email_address_invalid: "Use a valid email address.", weak_password: "Choose a stronger password.", signup_disabled: "New account creation is disabled in Supabase Auth.", email_provider_disabled: "Email sign-up is disabled in Supabase Auth." }; return invalid(messages[error.code || ""] || "Registration was rejected by the authentication service. Check the dev-server log for the safe error code."); }
  return { ok: true, message: "Account created. Check your email to confirm your account before signing in." };
}

export async function signIn(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse(Object.fromEntries(formData)); if (!parsed.success) return invalid();
  const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment.");
  const { error } = await client.auth.signInWithPassword(parsed.data); if (error) { logger.warn("sign-in rejected", { route: "/auth/sign-in", operation: "sign_in", code: error.code || error.status?.toString() || "AUTH_ERROR" }); return invalid(error.code === "email_not_confirmed" ? "Confirm your email before signing in, or use Resend confirmation." : "Sign-in failed. Check your email and password."); }
  return { ok: true, message: "Signed in.", redirectTo: safeRedirectPath(String(formData.get("next") || "")) };
}

export async function signOut(): Promise<AuthState> { const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment."); const { error } = await client.auth.signOut(); return error ? invalid("Could not sign out. Please try again.") : { ok: true, message: "Signed out.", redirectTo: "/" }; }

export async function requestPasswordReset(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const email = z.string().email().safeParse(String(formData.get("email") || "")); if (!email.success) return invalid();
  const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment.");
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  await client.auth.resetPasswordForEmail(email.data, { redirectTo: `${origin}/auth/callback?next=/auth/reset-password` });
  return { ok: true, message: "If an account matches that address, a password-reset email will arrive shortly." };
}

export async function resendConfirmation(_previous: AuthState, formData: FormData): Promise<AuthState> { const email = z.string().email().safeParse(String(formData.get("email") || "")); if (!email.success) return invalid(); const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment."); const { error } = await client.auth.resend({ type: "signup", email: email.data }); return error ? invalid("We could not resend the confirmation email right now.") : { ok: true, message: "If the account is eligible, a new confirmation email has been requested." }; }

export async function updatePassword(_previous: AuthState, formData: FormData): Promise<AuthState> { const password = z.string().min(8).max(128).safeParse(String(formData.get("password") || "")); const confirmation = String(formData.get("confirmation") || ""); if (!password.success || password.data !== confirmation) return invalid("Passwords must match and contain at least 8 characters."); const client = await createClient(); if (!client) return invalid("Authentication is not configured in this environment."); const { data: { user } } = await client.auth.getUser(); if (!user) return invalid("This reset link is invalid or expired."); const { error } = await client.auth.updateUser({ password: password.data }); return error ? invalid("We could not update your password. Request a new reset link.") : { ok: true, message: "Password updated.", redirectTo: "/auth/sign-in" }; }
