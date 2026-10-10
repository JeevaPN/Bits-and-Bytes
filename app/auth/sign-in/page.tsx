import Link from "next/link";
import { SignInForm } from "@/components/auth/auth-forms";
import { AuthEntryTabs } from "@/components/auth/auth-entry-tabs";
export default function SignInPage() { return <main className="container auth-page" style={{ maxWidth: 520, paddingTop: 48 }}><div className="eyebrow">CivicSync account</div><h1>Sign in</h1><p style={{ color: "var(--muted)" }}>Sign in to the workspace you chose when creating your account.</p><AuthEntryTabs mode="sign-in"><SignInForm /></AuthEntryTabs><p><Link href="/auth/forgot-password" style={{ color: "var(--green)" }}>Forgot password?</Link> · <Link href="/auth/sign-up" style={{ color: "var(--green)" }}>Create an account</Link></p></main>; }
