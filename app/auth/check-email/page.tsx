import Link from "next/link";
import { ResendConfirmationForm } from "@/components/auth/auth-forms";
export default function CheckEmailPage() { return <main className="container" style={{ maxWidth: 520, paddingTop: 48 }}><div className="eyebrow">Check your email</div><h1>Confirm your account</h1><p className="card">If registration succeeded, Supabase has requested a confirmation email. Email delivery depends on your configured Supabase SMTP/Resend setup.</p><ResendConfirmationForm /><p><Link href="/auth/sign-in" style={{ color: "var(--green)" }}>Return to sign in</Link></p></main>; }
