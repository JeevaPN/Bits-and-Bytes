"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { IssueCategory } from "@/lib/domain/types";
import { getCommunityPartnerApplicationFeedback, listMyCommunityGroups, resubmitCommunityPartnerApplicationWithEvidence } from "@/lib/supabase/community-partners";
import type { PartnerGroup } from "@/lib/supabase/community-partners";

const capabilities: IssueCategory[] = ["pothole", "damaged_road", "fallen_tree", "streetlight", "open_drain", "leak", "garbage", "blocked_footpath", "other"];

export default function CommunityPartnerApplicationStatusPage() {
  const [groups, setGroups] = useState<PartnerGroup[]>([]);
  const [feedback, setFeedback] = useState<Record<string, { status: string; note: string }>>({});
  const [selected, setSelected] = useState("");
  const [selectedCapabilities, setSelectedCapabilities] = useState<IssueCategory[]>([]);
  const [evidence, setEvidence] = useState<File[]>([]);
  const [message, setMessage] = useState("Loading your applications…");

  useEffect(() => {
    let active = true;
    void (async () => {
      const result = await listMyCommunityGroups();
      if (!active) return;
      if (!result.ok) { setMessage(result.error.message); return; }
      setGroups(result.data);
      const pairs = await Promise.all(result.data.map(async (group) => [group.id, await getCommunityPartnerApplicationFeedback(group.id)] as const));
      if (!active) return;
      const rows: Record<string, { status: string; note: string }> = {};
      for (const [id, response] of pairs) if (response.ok) rows[id] = { status: response.data.status, note: response.data.note };
      setFeedback(rows); setMessage("");
    })();
    return () => { active = false; };
  }, []);

  async function resubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await resubmitCommunityPartnerApplicationWithEvidence({
      groupId: selected,
      application: { name: String(form.get("name") ?? ""), description: String(form.get("description") ?? ""), area: String(form.get("area") ?? ""), contact: String(form.get("contact") ?? ""), capabilities: selectedCapabilities, limitations: String(form.get("limitations") ?? "") },
      evidence,
    });
    setMessage(result.ok ? "Updated application resubmitted." : result.error.message);
    if (result.ok) setFeedback((old) => ({ ...old, [selected]: { status: "pending", note: "" } }));
  }

  return <main className="container" style={{ paddingTop: 40, maxWidth: 820 }}>
    <div className="eyebrow">Community Partners</div><h1>Application status</h1>
    {message && <p role="status" className="card">{message}</p>}
    {!groups.length && <p className="card">No applications are linked to this account. <Link href="/community-partners/apply">Submit an application</Link>.</p>}
    {groups.map((group) => <article className="card" key={group.id} style={{ marginTop: 14 }}>
      <h2>{group.name}</h2><p>Status: <strong>{feedback[group.id]?.status ?? group.approvalStatus}</strong></p>
      {feedback[group.id]?.note && <p>Reviewer note: {feedback[group.id].note}</p>}
      {feedback[group.id]?.status === "more_info" && <>
        <button className="button secondary" onClick={() => { setSelected(group.id); setSelectedCapabilities(group.capabilities); }}>Respond to request for information</button>
        {selected === group.id && <form onSubmit={resubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <label className="label">Group name<input className="field" name="name" defaultValue={group.name} required minLength={2}/></label>
          <label className="label">Description<textarea className="field" name="description" defaultValue={group.description} required minLength={10}/></label>
          <label className="label">Service area<input className="field" name="area" defaultValue={group.area} required minLength={2}/></label>
          <label className="label">Contact email<input className="field" type="email" name="contact" defaultValue={group.contact} required/></label>
          <fieldset><legend>Eligible work</legend>{capabilities.map((item) => <label key={item} style={{ display: "inline-flex", gap: 6, margin: "6px 12px 6px 0" }}><input type="checkbox" checked={selectedCapabilities.includes(item)} onChange={(event) => setSelectedCapabilities((old) => event.target.checked ? [...old, item] : old.filter((value) => value !== item))}/>{item.replaceAll("_", " ")}</label>)}</fieldset>
          <label className="label">Limitations<textarea className="field" name="limitations" maxLength={1000}/></label>
          <label className="label">Additional evidence<input className="field" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setEvidence(Array.from(event.target.files ?? []))}/></label>
          <button className="button" disabled={!selectedCapabilities.length}>Resubmit for review</button>
        </form>}
      </>}
    </article>)}
  </main>;
}
