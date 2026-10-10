"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getCurrentWorkspaceRole } from "@/lib/auth/authorization";
import { workspaceHome } from "@/lib/auth/workspace-access";

export default function NeighbourhoodLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentWorkspaceRole().then((role) => {
      if (!active) return;
      if (!role) router.replace("/auth/sign-in");
      else if (role !== "common") router.replace(workspaceHome(role));
      else setAuthorized(true);
    });
    return () => { active = false; };
  }, [router]);

  if (!authorized) return <div className="container" role="status">Checking workspace access…</div>;
  return <><nav aria-label="Neighbourhood navigation" className="container" style={{ display: "flex", gap: 8, paddingTop: 15 }}><Link className="navlink" href="/neighbourhood">Neighbourhood home</Link><Link className="navlink" href="/neighbourhood/report">Report an issue</Link><Link className="navlink" href="/sponsorship">Sponsorship</Link></nav>{children}</>;
}
