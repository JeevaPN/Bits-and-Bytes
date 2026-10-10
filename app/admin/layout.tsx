import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { WorkspaceSubnav } from "@/components/shared/workspace-subnav";

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
      <WorkspaceSubnav items={nav} label="Admin navigation" />
      {children}
    </div>
  );
}
