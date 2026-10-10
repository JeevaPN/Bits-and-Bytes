"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { issueSchema } from "@/lib/validation/issue";

export function ReportForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setMessage(null); setCreatedId(null);
    const form = event.currentTarget;
    const parsed = issueSchema.safeParse(Object.fromEntries(new FormData(form).entries()));
    if (!parsed.success) { setMessage({ tone: "error", text: parsed.error.issues[0]?.message ?? "Check the form fields." }); return; }
    setBusy(true);
    const response = await fetch("/api/neighbourhood/issues", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) });
    const result = await response.json() as { ok: boolean; data?: { id: string }; error?: { message: string } };
    setBusy(false);
    if (!response.ok || !result.ok) { setMessage({ tone: "error", text: result.error?.message ?? "The report could not be saved." }); return; }
    setCreatedId(result.data!.id); setMessage({ tone: "success", text: "Your report was saved and is awaiting official review." }); form.reset();
  }
  return <form onSubmit={submit} noValidate>
    <label className="label">Short title<input className="field" name="title" placeholder="e.g. Pothole by the bus stop" required minLength={5} maxLength={120} /></label>
    <label className="label">Category<select className="field" name="category" defaultValue="pothole">{[["pothole", "Pothole"], ["damaged_road", "Damaged road"], ["fallen_tree", "Fallen tree"], ["streetlight", "Broken streetlight"], ["open_drain", "Open drain"], ["leak", "Leak"], ["garbage", "Garbage"], ["blocked_footpath", "Blocked footpath"], ["other", "Other public-space issue"]].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
    <label className="label">What did you observe?<textarea className="field" name="description" rows={4} required minLength={20} maxLength={2000} placeholder="Share useful details and nearby landmarks." /></label>
    <label className="label">Location<input className="field" name="location" required minLength={4} maxLength={240} placeholder="Street, landmark, or area" /></label>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><label className="label">Latitude<input className="field" name="latitude" type="number" step="any" min="-90" max="90" required placeholder="13.04" /></label><label className="label">Longitude<input className="field" name="longitude" type="number" step="any" min="-180" max="180" required placeholder="80.23" /></label></div>
    <p style={{ color: "var(--muted)", fontSize: 13 }}>Coordinates are required. CivicSync will never replace a missing location with a guessed point.</p>
    <label className="label">When did you observe it?<input className="field" name="observedAt" type="datetime-local" required /></label>
    <label className="label">Photo evidence<input className="field" name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></label>
    <small style={{ color: "var(--muted)" }}>Evidence upload is available after storage is configured. Keep identifying details out of photos.</small>
    <div style={{ marginTop: 20 }}><button disabled={busy} className="button">{busy ? "Submitting…" : "Submit report"}</button></div>
    {message && <p role="status" style={{ color: message.tone === "success" ? "var(--green)" : "#a33", lineHeight: 1.5 }}>{message.text}{createdId && <> <Link href={`/neighbourhood/issues/${createdId}`} style={{ textDecoration: "underline" }}>View report {createdId}</Link></>}</p>}
  </form>;
}
