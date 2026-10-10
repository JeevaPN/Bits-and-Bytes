"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CommunityGroup } from "@/lib/domain/types";
import { listPublicCommunityGroups } from "@/lib/supabase/community-partners";

export function GroupDirectory() {
  const [groups, setGroups] = useState<CommunityGroup[]>([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; listPublicCommunityGroups({ pageSize: 50 }).then((result) => { if (!active) return; if (result.ok) setGroups(result.data.items); else setError(result.error.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  return <main className="container" style={{ paddingTop: 42 }}><div className="eyebrow">Neighbourhood · approved public groups</div><h1>Community groups nearby</h1><p style={{ color: "var(--muted)" }}>Only approved public profiles are shown. Private registration and internal review details stay hidden.</p>
    {loading && <p role="status" className="card">Loading approved groups…</p>}{error && <p role="alert" className="card">{error}</p>}{!loading && !error && groups.length === 0 && <p className="card">No approved public groups are available.</p>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 16, marginTop: 24 }}>{groups.map((group) => <article className="card" key={group.id}><div className="eyebrow">Approved public profile</div><h2>{group.name}</h2><p>{group.description}</p><p>📍 {group.area}</p><p style={{ color: "var(--muted)" }}>Capabilities: {group.capabilities.join(", ")}</p><Link href={`/community-partners/details?slug=${encodeURIComponent(group.slug)}`} style={{ color: "var(--green)", fontWeight: 700 }}>View public profile →</Link></article>)}</div>
  </main>;
}
