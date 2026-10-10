import Link from "next/link";
import { SignInForm } from "@/components/auth/auth-forms";
import { enterDemoWorkspace } from "@/app/auth/actions";

const demoWorkspaces = [
  ["Admin", "admin"],
  ["Neighbourhood", "common"],
  ["Community Partner", "group"],
] as const;

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <main className="container auth-page" style={{ maxWidth: 560, paddingTop: 48 }}>
      <div className="eyebrow auth-brand-eyebrow">
        <span className="auth-brand-civic">Civic</span><span className="auth-brand-sync">Sync</span>
      </div>
      <h1>Sign in</h1>
      <p style={{ color: "var(--muted)" }}>Sign in to your account, or explore a workspace using the demo options.</p>

      <section className="card" aria-labelledby="demo-workspace-title" style={{ marginBottom: 20 }}>
        <h2 id="demo-workspace-title" style={{ marginTop: 0 }}>Explore a demo workspace</h2>
        <p style={{ color: "var(--muted)" }}>No account needed. Demo access is for exploring the workspace.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          {demoWorkspaces.map(([label, workspace]) => (
            <form action={enterDemoWorkspace} key={workspace}>
              <input type="hidden" name="workspace" value={workspace} />
              <button className="button secondary" type="submit" style={{ width: "100%" }}>
                {label} demo
              </button>
            </form>
          ))}
        </div>
      </section>

      <h2>Sign in to your account</h2>
      <div className="card"><SignInForm next={next || "/neighbourhood"} /></div>
      <p>
        <Link href="/auth/forgot-password" style={{ color: "var(--green)" }}>Forgot password?</Link>
        {" · "}
        <Link href="/auth/sign-up" style={{ color: "var(--green)" }}>Create an account</Link>
      </p>
    </main>
  );
}
