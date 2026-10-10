"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getCurrentWorkspaceRole } from "@/lib/auth/authorization";
import { workspaceHome } from "@/lib/auth/workspace-access";
import type { Role } from "@/lib/domain/types";

export default function CommunityPartnersLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentWorkspaceRole().then((currentRole) => {
      if (!active) return;
      if (!currentRole) router.replace("/auth/sign-in");
      else if (currentRole === "admin") router.replace(workspaceHome(currentRole));
      else setRole(currentRole);
    });
    return () => { active = false; };
  }, [router]);

  if (!role) return <div className="container" role="status">Checking workspace access…</div>;
  return <><nav aria-label="Community Partners navigation" className="container" style={{ display: "flex", gap: 8, paddingTop: 15, flexWrap: "wrap" }}>
    {role === "group" && <Link className="navlink" href="/community-partners">Partner directory</Link>}
    <Link className="navlink" href="/community-partners/apply">Apply</Link>
    <Link className="navlink" href="/community-partners/application-status">Application status</Link>
    {role === "group" && <><Link className="navlink" href="/community-partners/dashboard">Find suitable work</Link><Link className="navlink" href="/community-partners/dashboard/tasks">Work board</Link><Link className="navlink" href="/community-partners/dashboard/settings">Group settings</Link><Link className="navlink" href="/community-partners/dashboard/campaigns">Campaigns</Link><Link className="navlink" href="/sponsorship">Sponsorship</Link></>}
  </nav>{children}</>;
}
