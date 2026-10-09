import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
export default function ForgotPasswordPage() { return <main className="container" style={{ maxWidth: 520, paddingTop: 48 }}><div className="eyebrow">Account recovery</div><h1>Reset your password</h1><p style={{ color: "var(--muted)" }}>We will show the same response whether or not an account matches the address.</p><div className="card"><ForgotPasswordForm /></div><p><Link href="/auth/sign-in" style={{ color: "var(--green)" }}>Back to sign in</Link></p></main>; }
