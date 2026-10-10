"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { CreateProjectInput } from "@/lib/domain/admin";
import { createProject } from "@/app/admin/projects/actions";

export function ProjectForm() {
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const input: CreateProjectInput = { title: String(data.title ?? ""), description: String(data.description ?? ""), workType: String(data.workType ?? ""), department: String(data.department ?? ""), contractor: String(data.contractor ?? ""), location: String(data.location ?? ""), latitude: Number(data.latitude), longitude: Number(data.longitude), ward: String(data.ward ?? ""), startDate: String(data.startDate ?? ""), expectedEndDate: String(data.expectedEndDate ?? ""), status: data.status as CreateProjectInput["status"], budget: data.budget ? Number(data.budget) : undefined, published: data.published === "on", knownClosure: String(data.knownClosure ?? "") || undefined };
    const result = await createProject(input); setBusy(false); setMessage(result.ok ? `Project saved: ${input.title}.` : result.error); if (result.ok) router.push(`/projects/${result.slug}`);
  }
  return <form onSubmit={submit} className="card" style={{ maxWidth: 820 }}>
    <p style={{ marginTop: 0, color: "var(--muted)" }}>Project publication is recorded in the authorized staff workflow.</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "0 14px" }}><Field label="Project title" name="title" required/><Field label="Work type" name="workType" placeholder="Road resurfacing" required/><Field label="Department" name="department" required/><Field label="Contractor" name="contractor"/><Field label="Ward / area" name="ward" required/><Field label="Street / location" name="location" required/><Field label="Latitude" name="latitude" type="number" required/><Field label="Longitude" name="longitude" type="number" required/><Field label="Planned start" name="startDate" type="date" required/><Field label="Expected completion" name="expectedEndDate" type="date" required/><Field label="Budget (optional)" name="budget" type="number"/><label className="label">Project status<select className="field" name="status" defaultValue="planned"><option value="planned">Planned</option><option value="active">Active</option><option value="delayed">Delayed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label></div>
    <label className="label">Public description<textarea className="field" name="description" rows={4} required/></label><label className="label">Known closure / disruption (optional)<input className="field" name="knownClosure"/></label><label style={{ display: "flex", alignItems: "center", gap: 9, margin: "16px 0" }}><input name="published" type="checkbox"/> Publish after authorized review</label>
    <button className="button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save project"}</button>{message && <p role="status" style={{ color: "var(--green)" }}>{message}</p>}
  </form>;
}
function Field({ label, name, type = "text", required = false, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) { return <label className="label">{label}<input className="field" name={name} type={type} required={required} placeholder={placeholder}/></label>; }
