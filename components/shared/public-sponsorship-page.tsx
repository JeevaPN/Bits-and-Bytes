"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Campaign = {
  id: string;
  title: string;
  purpose: string;
  target_amount: number;
  group_name: string;
  group_slug: string | null;
};

export function PublicSponsorshipPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCampaigns() {
      const client = createClient();
      if (!client) {
        setError("Campaigns are unavailable because Supabase is not configured.");
        setLoading(false);
        return;
      }
      const result = await client.from("public_sponsorship_campaigns").select("id,title,purpose,target_amount,group_name,group_slug,created_at").order("created_at", { ascending: false }).limit(100);
      if (result.error) setError("Campaigns could not be loaded.");
      else setCampaigns(result.data ?? []);
      setLoading(false);
    }
    void loadCampaigns();
  }, []);

  return <div className="container" style={{ paddingTop: 42 }}>
    <section className="sponsorship-hero-layout"><div><div className="eyebrow">Simulated support · no payment</div>
      <h1 className="workspace-display-title"><span>Back the</span><em>neighbours.</em></h1>
      <p style={{ color: "var(--muted)", maxWidth: 650, lineHeight: 1.6 }}>Learn about approved local campaigns. Pledges are simulations only; no money is transferred or collected.</p>
    </div><div className="sponsorship-hero-image"><Image src="/images/community-volunteers-enhanced.png" alt="Local volunteers gathered with young saplings for a neighbourhood planting effort" fill sizes="(max-width: 700px) 100vw, 48vw" /></div></section>
    {error && <p className="card" role="alert">{error}</p>}
    {loading && <p className="card" role="status">Loading campaigns…</p>}
    {!loading && !error && !campaigns.length && <p className="card">No active campaigns are available yet.</p>}
    <div className="public-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginTop: 24 }}>
      {campaigns.map((campaign) => <article className="card" key={campaign.id}>
        <div className="eyebrow">Approved group · active campaign</div><h2>{campaign.title}</h2><p><strong>{campaign.group_name}</strong></p><p>{campaign.purpose}</p>
        <p><strong>Goal:</strong> ₹{Number(campaign.target_amount).toLocaleString("en-IN")} simulated</p>
        {campaign.group_slug && <Link style={{ color: "var(--green)" }} href={`/community-partners/details?slug=${encodeURIComponent(campaign.group_slug)}`}>View group work history →</Link>}
        <p style={{ color: "var(--muted)" }}>Sign in as a neighbour to record a simulated pledge. No payment is collected.</p>
      </article>)}
    </div>
  </div>;
}
