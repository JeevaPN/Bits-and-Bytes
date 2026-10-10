import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function PublicSponsorshipPage() {
  const client = await createClient();
  const { data, error } = client ? await client.from("public_sponsorship_campaigns").select("id,title,purpose,target_amount,group_name,group_slug,created_at").order("created_at", { ascending: false }).limit(100) : { data: null, error: null };
  return <div className="container" style={{ paddingTop: 42 }}>
    <section className="sponsorship-hero-layout"><div><div className="eyebrow">Simulated support · no payment</div>
      <h1 className="workspace-display-title"><span>Back the</span><em>neighbours.</em></h1>
      <p style={{ color: "var(--muted)", maxWidth: 650, lineHeight: 1.6 }}>Learn about approved local campaigns. Pledges are simulations only; no money is transferred or collected.</p>
    </div><div className="sponsorship-hero-image"><Image src="/images/community-volunteers-enhanced.png" alt="Local volunteers gathered with young saplings for a neighbourhood planting effort" fill sizes="(max-width: 700px) 100vw, 48vw" /></div></section>
    {!client && <p className="card" role="alert">Campaigns are unavailable because Supabase is not configured.</p>}
    {error && <p className="card" role="alert">Campaigns could not be loaded.</p>}
    {client && !error && !data?.length && <p className="card">No active campaigns are available yet.</p>}
    <div className="public-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginTop: 24 }}>
      {(data ?? []).map((campaign) => <article className="card" key={campaign.id}>
        <div className="eyebrow">Approved group · active campaign</div><h2>{campaign.title}</h2><p><strong>{campaign.group_name}</strong></p><p>{campaign.purpose}</p>
        <p><strong>Goal:</strong> ₹{Number(campaign.target_amount).toLocaleString("en-IN")} simulated</p>
        {campaign.group_slug && <Link style={{ color: "var(--green)" }} href={`/community-partners/${campaign.group_slug}`}>View group work history →</Link>}
        <p style={{ color: "var(--muted)" }}>Sign in as a neighbour to record a simulated pledge. No payment is collected.</p>
      </article>)}
    </div>
  </div>;
}
