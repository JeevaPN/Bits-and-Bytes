"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { SignOutButton } from "@/components/auth/auth-forms";
export function AuthStatus() { const [user, setUser] = useState<{ email?: string; displayName?: string } | null>(null); useEffect(() => { const client = createClient(); if (!client) return; client.auth.getUser().then(({ data }) => setUser(data.user ? { email: data.user.email, displayName: String(data.user.user_metadata?.display_name || "") } : null)); const { data: listener } = client.auth.onAuthStateChange((_event, session) => setUser(session?.user ? { email: session.user.email, displayName: String(session.user.user_metadata?.display_name || "") } : null)); return () => listener.subscription.unsubscribe(); }, []); return user ? <span className="site-auth-status"><span className="site-auth-user">{user.displayName || user.email}</span><SignOutButton /></span> : <Link className="site-sign-in-link" href="/auth/sign-in">Sign in</Link>; }
