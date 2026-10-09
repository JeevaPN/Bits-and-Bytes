"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CommunityGroup } from "@/lib/domain/types";
import { groups as demoGroups } from "@/lib/domain/demo-data";
import { isCommunityPartnersDemo } from "@/lib/api/community-partners";
import { listPublicCommunityGroups } from "@/lib/supabase/community-partners";

export default function CommunityPartnersPage() {
  const [groups, setGroups] = useState<CommunityGroup[]>(isCommunityPartnersDemo ? demoGroups.filter((group) => group.approved) : []);
  const [status, setStatus] = useState(isCommunityPartnersDemo ? "Showing demo profiles." : "Loading approved partners…");

  useEffect(() => {
    if (isCommunityPartnersDemo) return;
    let active = true;
    void listPublicCommunityGroups().then((result) => {
      if (!active) return;
      if (result.ok) { setGroups(result.data.items); setStatus(""); }
      else setStatus(result.error.message);
    });
    return () => { active = false; };
  }, []);

  return <main className="container" style={{ paddingTop: 44 }}>
    <div className="eyebrow">Community Partners</div>
    <h1>People making a difference nearby</h1>
    <p style={{ color: "var(--muted)" }}>Meet approved community partners, see their service areas, and follow work updates they chose to share publicly.</p>
    <p><Link className="button" href="/community-partners/apply">Apply to become a partner</Link></p>
    {status && <p role="status" className="card">{status}</p>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 16, marginTop: 25 }}>
      {groups.map((group) => <Link className="card" href={`/community-partners/${group.slug}`} key={group.id}>
        <div className="eyebrow">Approved partner</div><h2>{group.name}</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>{group.description}</p>
        <p>📍 {group.area}</p><p>Suitable work: {group.capabilities.map((item) => item.replaceAll("_", " ")).join(", ")}</p>
        <span style={{ color: "var(--green)", fontWeight: 700 }}>View public page →</span>
      </Link>)}
    </div>
    {!groups.length && !status && <p>No approved partners are listed yet.</p>}
  </main>;
}
