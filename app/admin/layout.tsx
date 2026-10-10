import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentWorkspaceRole } from "@/lib/auth/authorization";
import { workspaceHome } from "@/lib/auth/workspace-access";

const nav = [
  ["Overview", "/admin"],
  ["Projects", "/admin/projects"],
  ["Issue review", "/admin/issues"],
  ["Coordination", "/admin/coordination"],
  ["Restoration", "/admin/restoration"],
  ["Group approvals", "/admin/groups"],
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const role = await getCurrentWorkspaceRole();
  if (!role) redirect("/auth/sign-in");
  if (role !== "admin") redirect(workspaceHome(role));

  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <div className="eyebrow">CivicSync · Admin workspace · demo</div>
      <div style={{ display: "flex", gap: 24, alignItems: "baseline", flexWrap: "wrap", justifyContent: "space-between" }}>
        <h1 style={{ margin: "8px 0 18px" }}>Civic operations</h1>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>Admin access requires server-side authorization in production</span>
      </div>
      <nav aria-label="Admin navigation" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 18, marginBottom: 24, borderBottom: "1px solid var(--line)" }}>
        {nav.map(([label, href]) => <Link className="navlink" key={href} href={href} style={{ whiteSpace: "nowrap", border: "1px solid var(--line)" }}>{label}</Link>)}
      </nav>
      {children}
    </div>
  );
}
