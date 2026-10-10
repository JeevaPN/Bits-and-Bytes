"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getCurrentWorkspaceRole } from "@/lib/auth/authorization";

export default function CommunityPartnerDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentWorkspaceRole().then((role) => {
      if (!active) return;
      if (!role) router.replace("/auth/sign-in");
      else if (role !== "group") router.replace("/community-partners");
      else setAuthorized(true);
    });
    return () => { active = false; };
  }, [router]);

  if (!authorized) return <div className="container" role="status">Checking workspace access…</div>;
  return <>{children}</>;
}
