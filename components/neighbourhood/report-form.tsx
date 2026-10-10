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
    const formData = new FormData(form);
    const file = formData.get("photo");
    if (file instanceof File && file.size > 0 && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) { setMessage({ tone: "error", text: file.size > 10 * 1024 * 1024 ? "The image must be 10 MB or smaller." : "Choose a JPEG, PNG, or WebP image." }); return; }
    const parsed = issueSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) { setMessage({ tone: "error", text: parsed.error.issues[0]?.message ?? "Check the form fields." }); return; }
    setBusy(true);
    let evidencePublicId: string | undefined;
    try {
      if (file instanceof File && file.size > 0) {
        const signatureResponse = await fetch("/api/neighbourhood/evidence/sign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mimeType: file.type, size: file.size }) });
        const signature = await signatureResponse.json() as { uploadUrl?: string; apiKey?: string; timestamp?: number; folder?: string; publicId?: string; type?: string; signature?: string; error?: string };
        if (!signatureResponse.ok || !signature.uploadUrl || !signature.apiKey || !signature.signature) throw new Error(signature.error || "The evidence upload could not be authorized.");
        const uploadBody = new FormData(); uploadBody.append("file", file); uploadBody.append("api_key", signature.apiKey); uploadBody.append("timestamp", String(signature.timestamp)); uploadBody.append("folder", signature.folder || ""); uploadBody.append("public_id", signature.publicId || ""); uploadBody.append("type", signature.type || "authenticated"); uploadBody.append("signature", signature.signature);
        const uploadResponse = await fetch(signature.uploadUrl, { method: "POST", body: uploadBody });
        const uploadResult = await uploadResponse.json().catch(() => null) as { public_id?: string; error?: { message?: string } } | null;
        if (!uploadResponse.ok || !uploadResult?.public_id) throw new Error(uploadResult?.error?.message || "Cloudinary did not accept the image.");
        evidencePublicId = uploadResult.public_id;
      }
      const response = await fetch("/api/neighbourhood/issues", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...parsed.data, evidencePublicId }) });
      const result = await response.json() as { ok: boolean; data?: { id: string }; error?: { message: string } };
      if (!response.ok || !result.ok) { setMessage({ tone: "error", text: result.error?.message ?? "The report could not be saved." }); return; }
      setCreatedId(result.data!.id); setMessage({ tone: "success", text: "Your report was saved and is awaiting official review." }); form.reset();
    } catch (error) { setMessage({ tone: "error", text: error instanceof Error ? error.message : "The report could not be submitted." }); }
    finally { setBusy(false); }
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
    <small style={{ color: "var(--muted)" }}>JPEG, PNG, or WebP up to 10 MB. Keep identifying details out of photos.</small>
    <div style={{ marginTop: 20 }}><button disabled={busy} className="button">{busy ? "Submitting…" : "Submit report"}</button></div>
    {message && <p role="status" style={{ color: message.tone === "success" ? "var(--green)" : "#a33", lineHeight: 1.5 }}>{message.text}{createdId && <> <Link href={`/neighbourhood/issues/${createdId}`} style={{ textDecoration: "underline" }}>View report {createdId}</Link></>}</p>}
  </form>;
}
