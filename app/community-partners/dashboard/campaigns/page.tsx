"use client";

import { useEffect, useState, type FormEvent } from "react";
import { communityPartnersApi, isCommunityPartnersDemo } from "@/lib/api/community-partners";
import { groups as demoGroups } from "@/lib/domain/demo-data";
import { listMyCommunityGroups, listPartnerCampaigns, listPartnerCampaignUpdates } from "@/lib/supabase/community-partners";
import type { PartnerGroup, PartnerCampaign, PartnerCampaignUpdate } from "@/lib/supabase/community-partners";

export default function CommunityPartnerCampaignsPage() {
  const [groups, setGroups] = useState<PartnerGroup[]>([]);
  const [groupId, setGroupId] = useState("");
  const [campaigns, setCampaigns] = useState<PartnerCampaign[]>([]);
  const [updates, setUpdates] = useState<Record<string, PartnerCampaignUpdate[]>>({});
  const [message, setMessage] = useState("Loading campaigns…");

  async function loadCampaigns(id: string) {
    if (!id || isCommunityPartnersDemo) return;
    const result = await listPartnerCampaigns(id);
    if (!result.ok) { setMessage(result.error.message); return; }
    setCampaigns(result.data);
    const histories = await Promise.all(result.data.map(async (campaign) => [campaign.id, await listPartnerCampaignUpdates(campaign.id)] as const));
    const loaded: Record<string, PartnerCampaignUpdate[]> = {};
    for (const [campaignId, result] of histories) if (result.ok) loaded[campaignId] = result.data;
    setUpdates(loaded);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      if (isCommunityPartnersDemo) {
        const local = demoGroups.filter((group) => group.approved);
        setGroups(local.map((group) => ({ ...group, approvalStatus: "approved" })));
        setGroupId(local[0]?.id ?? ""); setMessage("Demo mode: campaign actions are simulated and not persisted."); return;
      }
      const result = await listMyCommunityGroups();
      if (!active) return;
      if (!result.ok) { setMessage(result.error.message); return; }
      const approved = result.data.filter((group) => group.approved);
      setGroups(approved); setGroupId(approved[0]?.id ?? "");
      if (approved[0]) { setMessage(""); await loadCampaigns(approved[0].id); }
      else setMessage("No approved partner group is linked to your account.");
    })();
    return () => { active = false; };
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const result = await communityPartnersApi.createCampaign({ groupId, title: String(form.get("title") ?? ""), purpose: String(form.get("purpose") ?? ""), targetAmount: Number(form.get("target")), activity: String(form.get("activity") ?? "") });
    setMessage(result.ok ? "Simulated campaign request saved." : result.error.message);
    if (result.ok) {
      if (isCommunityPartnersDemo) setCampaigns((old) => [{ id: result.data.campaignId, groupId, title: String(form.get("title") ?? ""), purpose: String(form.get("purpose") ?? ""), targetAmount: Number(form.get("target")), activity: String(form.get("activity") ?? "") || undefined, status: "active", simulated: true }, ...old]);
      formElement.reset(); await loadCampaigns(groupId);
    }
  }
  async function report(campaignId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const evidence = (form.get("evidence") as File | null) ?? undefined;
    const result = await communityPartnersApi.reportCampaignUse({ campaignId, amount: Number(form.get("amount")), note: String(form.get("note") ?? ""), evidence });
    setMessage(result.ok ? "Simulated campaign use report saved." : result.error.message);
    if (result.ok) {
      if (isCommunityPartnersDemo) setUpdates((old) => ({ ...old, [campaignId]: [{ id: result.data.updateId, campaignId, amount: Number(form.get("amount")), note: String(form.get("note") ?? ""), createdAt: new Date().toISOString() }, ...(old[campaignId] ?? [])] }));
      formElement.reset(); await loadCampaigns(groupId);
    }
  }

  return <main className="container" style={{ paddingTop: 40, maxWidth: 960 }}>
    <div className="eyebrow">Community Partners</div><h1>Campaign requests and use reports</h1>
    <p className="card">All campaign targets and use reports are simulated records. This feature does not accept money or move funds.</p>
    {message && <p role="status">{message}</p>}
    {groups.length > 0 && <>
      <label className="label">Acting group<select className="field" value={groupId} onChange={(event) => { setGroupId(event.target.value); void loadCampaigns(event.target.value); }}>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
      <form className="card" onSubmit={create} style={{ display: "grid", gap: 12, marginTop: 14 }}>
        <h2>Request simulated sponsorship</h2>
        <label className="label">Campaign title<input className="field" name="title" required maxLength={120}/></label>
        <label className="label">Purpose<textarea className="field" name="purpose" required maxLength={1000}/></label>
        <label className="label">Target amount<input className="field" name="target" type="number" required min="0.01" step="0.01"/></label>
        <label className="label">Intended activity<input className="field" name="activity" maxLength={200}/></label>
        <button className="button">Save simulated request</button>
      </form>
      {campaigns.map((campaign) => <article className="card" key={campaign.id} style={{ marginTop: 14 }}>
        <div className="eyebrow">Simulated · {campaign.status}</div><h2>{campaign.title}</h2><p>{campaign.purpose}</p><p>Target: {campaign.targetAmount.toLocaleString()}</p>
        <form onSubmit={(event) => void report(campaign.id, event)} style={{ display: "grid", gap: 10 }}>
          <h3>Report campaign use</h3>
          <label className="label">Amount<input className="field" name="amount" type="number" min="0" step="0.01" required/></label>
          <label className="label">What was used and why<textarea className="field" name="note" required maxLength={1000}/></label>
          <label className="label">Private supporting image<input className="field" name="evidence" type="file" accept="image/jpeg,image/png,image/webp"/></label>
          <button className="button secondary">Save use report</button>
        </form>
        <h3>Use history</h3>{(updates[campaign.id] ?? []).map((update) => <div key={update.id}><p>{update.amount.toLocaleString()} · {update.note}</p>{update.evidenceUrl && <a href={update.evidenceUrl} target="_blank" rel="noreferrer">Open private evidence</a>}</div>)}
        {!updates[campaign.id]?.length && <p>No use reports yet.</p>}
      </article>)}
      {!campaigns.length && !isCommunityPartnersDemo && <p className="card">No active campaigns for this group.</p>}
    </>}
  </main>;
}
