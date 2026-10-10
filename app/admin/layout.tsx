import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin-auth";

const nav = [
  ["Overview", "/admin"],
  ["Projects", "/admin/projects"],
  ["Issue review", "/admin/issues"],
  ["Coordination", "/admin/coordination"],
  ["Restoration", "/admin/restoration"],
  ["Group approvals", "/admin/groups"],
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try { await requireAdmin(); } catch { redirect("/auth/sign-in?next=%2Fadmin"); }
  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <div className="eyebrow">CivicSync · Admin workspace</div>
      <div style={{ display: "flex", gap: 24, alignItems: "baseline", flexWrap: "wrap", justifyContent: "space-between" }}>
        <h1 style={{ margin: "8px 0 18px" }}>Civic operations</h1>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>Authorized staff only</span>
      </div>
      <nav aria-label="Admin navigation" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 18, marginBottom: 24, borderBottom: "1px solid var(--line)" }}>
        {nav.map(([label, href]) => <Link className="navlink" key={href} href={href} style={{ whiteSpace: "nowrap", border: "1px solid var(--line)" }}>{label}</Link>)}
      </nav>
      {children}
    </div>
  );
}
