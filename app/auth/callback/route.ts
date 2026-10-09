import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/auth/redirect";
export async function GET(request: Request) { const url = new URL(request.url); const code = url.searchParams.get("code"); const client = await createClient(); if (!client || !code) return NextResponse.redirect(new URL("/auth/sign-in?error=callback", url.origin)); const { error } = await client.auth.exchangeCodeForSession(code); return NextResponse.redirect(new URL(error ? "/auth/sign-in?error=callback" : safeRedirectPath(url.searchParams.get("next")), url.origin)); }
