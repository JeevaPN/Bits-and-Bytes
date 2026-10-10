import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentWorkspaceRole } from "@/lib/auth/authorization";
import { workspaceHome } from "@/lib/auth/workspace-access";

export default async function NeighbourhoodLayout({ children }: { children: ReactNode }) {
  const role = await getCurrentWorkspaceRole();
  if (!role) redirect("/auth/sign-in");
  if (role !== "common") redirect(workspaceHome(role));

  return <><nav aria-label="Neighbourhood navigation" className="container" style={{ display: "flex", gap: 8, paddingTop: 15 }}><Link className="navlink" href="/neighbourhood">Neighbourhood home</Link><Link className="navlink" href="/neighbourhood/report">Report an issue</Link><Link className="navlink" href="/sponsorship">Sponsorship</Link></nav>{children}</>;
}
