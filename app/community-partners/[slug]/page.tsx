"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { CommunityGroup } from "@/lib/domain/types";
import type { PublicPartnerWork } from "@/lib/supabase/community-partners";
import { communityPartnersApi } from "@/lib/api/community-partners";
import { listPublicCommunityWork } from "@/lib/supabase/community-partners";

export default function CommunityPartnerPage() {
  const { slug } = useParams<{ slug: string }>();
  const [partner, setPartner] = useState<CommunityGroup | null>(null);
  const [work, setWork] = useState<PublicPartnerWork[]>([]);
  const [status, setStatus] = useState("Loading partner profile…");

  useEffect(() => {
    let active = true;
    void Promise.all([communityPartnersApi.getPublicProfile(slug), listPublicCommunityWork(slug)]).then(([profile, history]) => {
      if (!active) return;
      if (profile.ok) { setPartner(profile.data); setStatus(""); }
      else setStatus(profile.error.message);
      if (history.ok) setWork(history.data);
    });
    return () => { active = false; };
  }, [slug]);

  if (!partner) return <main className="container" style={{ paddingTop: 44 }}><h1>Community partner</h1><p role="status" className="card">{status}</p></main>;
  return <main className="container" style={{ paddingTop: 44 }}>
    <div className="eyebrow">Approved Community Partner</div><h1>{partner.name}</h1>
    <p style={{ fontSize: 18, color: "var(--muted)", maxWidth: 680, lineHeight: 1.6 }}>{partner.description}</p>
    <div className="card" style={{ marginTop: 20 }}><h2>About this partner</h2>
      <p>📍 {partner.area}</p><p>Suitable work: {partner.capabilities.map((item) => item.replaceAll("_", " ")).join(", ")}</p>
      {partner.contact && <p>Contact: <a style={{ color: "var(--green)" }} href={`mailto:${partner.contact}`}>{partner.contact}</a></p>}
    </div>
    <h2 style={{ marginTop: 32 }}>Public work history</h2>
    <p style={{ color: "var(--muted)" }}>Only work notes and evidence the partner explicitly published are shown. Task status is separate from official issue review.</p>
    {work.map((item) => <article className="card" key={`${item.taskId}-${item.updateId ?? item.updatedAt}`} style={{ marginTop: 12 }}>
      <div className="eyebrow">{item.status.replaceAll("_", " ")} · {item.category.replaceAll("_", " ")}</div>
      <h3>{item.title}</h3><p>{item.location}</p>
      {item.publicNote && <p>{item.publicNote}</p>}
      {item.evidenceUrl && <p><a href={item.evidenceUrl} target="_blank" rel="noreferrer">View partner-published evidence</a></p>}
      <small>Updated {new Date(item.updatedAt).toLocaleString()}</small>
    </article>)}
    {!work.length && <p className="card">This partner has not published work history yet.</p>}
  </main>;
}
