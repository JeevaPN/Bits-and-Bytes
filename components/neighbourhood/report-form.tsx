"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { issueSchema } from "@/lib/validation/issue";

export function ReportForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [debug, setDebug] = useState<Array<{ stage: string; detail: string; status?: number }>>([]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setMessage(null); setCreatedId(null); setDebug([]);
    const diagnostics: Array<{ stage: string; detail: string; status?: number }> = [];
    const record = (stage: string, detail: string, status?: number) => { diagnostics.push({ stage, detail, status }); setDebug([...diagnostics]); };
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("photo");
    record("Validation", file instanceof File && file.size > 0 ? `Selected ${file.type || "unknown type"} file (${file.size} bytes).` : "No evidence attached.");
    if (file instanceof File && file.size > 0 && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) { record("Validation", "The selected file was rejected before upload."); setMessage({ tone: "error", text: file.size > 10 * 1024 * 1024 ? "The image must be 10 MB or smaller." : "Choose a JPEG, PNG, or WebP image." }); return; }
    const parsed = issueSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) { record("Validation", "One or more report fields are invalid."); setMessage({ tone: "error", text: parsed.error.issues[0]?.message ?? "Check the form fields." }); return; }
    setBusy(true);
    const requestId = crypto.randomUUID();
    let evidencePublicId: string | undefined;
    try {
      if (file instanceof File && file.size > 0) {
        record("Signature", "Requesting an authenticated upload signature.");
        const signatureResponse = await fetch("/api/neighbourhood/evidence/sign", { method: "POST", headers: { "content-type": "application/json", "x-request-id": requestId }, body: JSON.stringify({ mimeType: file.type, size: file.size }) });
        const signature = await signatureResponse.json().catch(() => null) as { uploadUrl?: string; apiKey?: string; timestamp?: number; folder?: string; publicId?: string; type?: string; signature?: string; error?: string; requestId?: string } | null;
        record("Signature", signatureResponse.ok ? `Signature endpoint returned HTTP ${signatureResponse.status}.` : `${signature?.error || "Signature endpoint rejected the request."}${signature?.requestId ? ` (request ${signature.requestId})` : ""}`, signatureResponse.status);
        if (!signatureResponse.ok || !signature?.uploadUrl || !signature.apiKey || !signature.signature) throw new Error(signature?.error || "The evidence upload could not be authorized.");
        const uploadBody = new FormData(); uploadBody.append("file", file); uploadBody.append("api_key", signature.apiKey); uploadBody.append("timestamp", String(signature.timestamp)); uploadBody.append("folder", signature.folder || ""); uploadBody.append("public_id", signature.publicId || ""); uploadBody.append("type", signature.type || "authenticated"); uploadBody.append("signature", signature.signature);
        record("Cloudinary", "Uploading the image bytes through CivicSync’s protected upload route.");
        const uploadResponse = await fetch("/api/neighbourhood/evidence/upload", { method: "POST", headers: { "x-request-id": requestId }, body: uploadBody });
        const uploadResult = await uploadResponse.json().catch(() => null) as { public_id?: string; error?: { message?: string } | string } | null;
        const uploadError = typeof uploadResult?.error === "string" ? uploadResult.error : uploadResult?.error?.message;
        record("Cloudinary", uploadResponse.ok ? `Cloudinary returned HTTP ${uploadResponse.status}.` : (uploadError || `Cloudinary returned HTTP ${uploadResponse.status}.`), uploadResponse.status);
        if (!uploadResponse.ok || !uploadResult?.public_id) throw new Error(uploadError || "Cloudinary did not accept the image.");
        evidencePublicId = uploadResult.public_id;
      }
      record("Issue save", "Saving the report and verified evidence reference.");
      const response = await fetch("/api/neighbourhood/issues", { method: "POST", headers: { "content-type": "application/json", "x-request-id": requestId }, body: JSON.stringify({ ...parsed.data, evidencePublicId }) });
      const result = await response.json().catch(() => null) as { ok: boolean; data?: { id: string }; error?: { message: string }; requestId?: string } | null;
      record("Issue save", response.ok ? `Issue endpoint returned HTTP ${response.status}.` : `${result?.error?.message || "Issue endpoint rejected the request."}${result?.requestId ? ` (request ${result.requestId})` : ""}`, response.status);
      if (!response.ok || !result?.ok) { setMessage({ tone: "error", text: result?.error?.message ?? "The report could not be saved." }); return; }
      setCreatedId(result.data!.id); setMessage({ tone: "success", text: "Your report was saved and is awaiting official review." }); form.reset();
    } catch (error) { const detail = error instanceof Error ? error.message : "The report could not be submitted."; record("Network", `${detail}. Check the diagnostics below for the failed stage.`); setMessage({ tone: "error", text: detail === "Failed to fetch" ? "The request could not reach the upload service. Check the diagnostics below." : detail }); }
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
    {!!debug.length && <details open={message?.tone === "error"} style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}><summary>Upload diagnostics</summary><ol style={{ marginTop: 8, paddingLeft: 22 }}>{debug.map((entry, index) => <li key={`${entry.stage}-${index}`}><strong>{entry.stage}</strong>: {entry.detail}{entry.status ? ` (HTTP ${entry.status})` : ""}</li>)}</ol><small>These diagnostics exclude signed parameters, API keys, URLs, and evidence identifiers.</small></details>}
  </form>;
}
