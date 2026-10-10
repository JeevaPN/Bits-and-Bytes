import Link from "next/link";
import { DemoAccountChoices } from "@/components/auth/auth-entry-tabs";

export default function DemoAccountsPage() {
  return <main className="container auth-page" style={{ maxWidth: 620, paddingTop: 48 }}>
    <div className="eyebrow">CivicSync walkthrough</div>
    <h1>Choose a demo workspace</h1>
    <p style={{ color: "var(--muted)" }}>Open a sample Admin, Neighbour, or Community Partner account without entering credentials.</p>
    <div className="card auth-entry-card"><DemoAccountChoices /></div>
    <p><Link href="/auth/sign-in" style={{ color: "var(--green)" }}>Back to sign in</Link></p>
  </main>;
}
