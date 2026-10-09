"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { IssueCategory } from "@/lib/domain/types";
import { submitCommunityPartnerApplicationWithEvidence } from "@/lib/supabase/community-partners";

const capabilities: IssueCategory[] = ["pothole", "damaged_road", "fallen_tree", "streetlight", "open_drain", "leak", "garbage", "blocked_footpath", "other"];

export default function CommunityPartnerApplicationPage() {
  const [selected, setSelected] = useState<IssueCategory[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true); setMessage("");
    const result = await submitCommunityPartnerApplicationWithEvidence({
      application: {
        name: String(form.get("name") ?? ""), description: String(form.get("description") ?? ""),
        area: String(form.get("area") ?? ""), contact: String(form.get("contact") ?? ""),
        capabilities: selected, limitations: String(form.get("limitations") ?? ""),
      }, evidence: files,
    });
    setBusy(false);
    setMessage(result.ok ? `Application ${result.data.applicationId} submitted for review.` : result.error.message);
    if (result.ok) formElement.reset();
  }

  return <main className="container" style={{ paddingTop: 40, maxWidth: 820 }}>
    <div className="eyebrow">Community Partners</div><h1>Apply to register your group</h1>
    <p style={{ color: "var(--muted)" }}>Applications are reviewed before a group can accept work. Add a clear service area, eligible work, limitations, and supporting images.</p>
    <form className="card" onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      <label className="label">Group name<input className="field" name="name" required minLength={2} maxLength={100}/></label>
      <label className="label">Description<textarea className="field" name="description" required minLength={10} maxLength={1000}/></label>
      <label className="label">Service area<input className="field" name="area" required minLength={2} maxLength={160} placeholder="For example: Ward 4, North Market"/><small>Separate supported area names with commas or semicolons. Work acceptance checks these names against the issue location.</small></label>
      <label className="label">Group contact email<input className="field" name="contact" type="email" required maxLength={254}/></label>
      <fieldset><legend>Work your group can do</legend>{capabilities.map((capability) => <label key={capability} style={{ display: "inline-flex", gap: 6, margin: "6px 14px 6px 0" }}><input type="checkbox" checked={selected.includes(capability)} onChange={(event) => setSelected((old) => event.target.checked ? [...old, capability] : old.filter((item) => item !== capability))}/>{capability.replaceAll("_", " ")}</label>)}</fieldset>
      <label className="label">Limitations<textarea className="field" name="limitations" maxLength={1000} placeholder="Describe training, equipment, safety, or authority limits."/><small>Limitations are recorded for reviewers. Excluded work categories can be managed after approval.</small></label>
      <label className="label">Supporting evidence images<input className="field" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))}/><small>Up to five private JPEG, PNG, or WebP files, 10 MB each. Only the applicant and authorized reviewers can access them.</small></label>
      <button className="button" disabled={busy || selected.length === 0}>{busy ? "Submitting…" : "Submit application"}</button>
      {message && <p role="status">{message}</p>}
    </form>
    <p><Link href="/community-partners">Back to directory</Link></p>
  </main>;
}
