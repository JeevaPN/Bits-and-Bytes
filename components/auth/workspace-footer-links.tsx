"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentWorkspaceRole } from "@/lib/auth/authorization";
import type { Role } from "@/lib/domain/types";

export function WorkspaceFooterLinks({ section }: { section: "explore" | "involved" | "workspaces" }) {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    let active = true;
    const updateRole = () => {
      void getCurrentWorkspaceRole().then((currentRole) => {
        if (active) setRole(currentRole);
      });
    };
    updateRole();
    window.addEventListener("focus", updateRole);
    return () => {
      active = false;
      window.removeEventListener("focus", updateRole);
    };
  }, []);

  if (section === "explore") {
    if (role === "common") return <Link href="/neighbourhood">Neighbourhood</Link>;
    if (role === "group") return <Link href="/community-partners">Community partners</Link>;
    return null;
  }
  if (section === "involved") {
    if (role === "common") return <Link href="/neighbourhood/report">Report a local issue</Link>;
    if (role === "group") return <Link href="/community-partners/dashboard">Partner workspace</Link>;
    return null;
  }
  if (role === "common") return <Link href="/neighbourhood">Neighbourhood workspace</Link>;
  if (role === "group") return <Link href="/community-partners/dashboard">Partner dashboard</Link>;
  if (role === "admin") return <Link href="/admin">Admin workspace</Link>;
  return <Link href="/auth/sign-in">Sign in</Link>;
}
