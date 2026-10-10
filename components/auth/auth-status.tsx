"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { SignOutButton } from "@/components/auth/auth-forms";

type AuthUser = { email?: string; displayName?: string } | null;

function useAuthUser() {
  const [user, setUser] = useState<AuthUser>(null);
  useEffect(() => {
    const client = createClient();
    if (!client) return;
    const toAuthUser = (value: { email?: string; user_metadata?: { display_name?: unknown } } | null): AuthUser => value ? {
      email: value.email,
      displayName: String(value.user_metadata?.display_name || ""),
    } : null;
    client.auth.getUser().then(({ data }) => setUser(toAuthUser(data.user)));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => setUser(toAuthUser(session?.user ?? null)));
    return () => listener.subscription.unsubscribe();
  }, []);
  return user;
}

export function AuthProfileName() {
  const user = useAuthUser();
  if (!user) return null;
  return <span className="site-auth-user site-auth-profile-name">{user.displayName || user.email}</span>;
}

export function AuthStatus() {
  const user = useAuthUser();
  return user
    ? <span className="site-auth-status"><SignOutButton /></span>
    : <Link className="site-sign-in-link" href="/auth/sign-in">Sign in</Link>;
}
