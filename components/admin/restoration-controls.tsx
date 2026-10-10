"use client";
import { useState, type FormEvent } from "react";
import { recordRestoration } from "@/app/admin/restoration/actions";

type Project = { id: string; title: string; location: string };
type InspectionStatus = "inspection_due" | "passed" | "defect_found" | "remediation" | "reinspection_due";
type Inspection = { id: string; projectId: string; date: string; status: InspectionStatus; notes: string; reinspectionDate: string };
export function RestorationControls({ projects = [], inspection }: { projects?: Project[]; inspection?: Inspection }) {
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); const form = new FormData(event.currentTarget); const result = await recordRestoration({ inspectionId: inspection?.id, projectId: String(form.get("projectId")), inspectionDate: String(form.get("date")), status: String(form.get("status")) as InspectionStatus, notes: String(form.get("notes")), reinspectionDate: String(form.get("reinspectionDate") || "") }); setBusy(false); setMessage(result.ok ? "Inspection record saved." : result.error); if (result.ok) window.location.reload(); }
  return <form className="card" onSubmit={save} style={{ display: "grid", gap: 8, marginTop: 12 }}><strong>{inspection ? "Update inspection" : "Record inspection"}</strong>
    {inspection ? <input type="hidden" name="projectId" value={inspection.projectId}/> : <label className="label">Project<select className="field" name="projectId" required defaultValue=""><option value="" disabled>Choose project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title} · {project.location}</option>)}</select></label>}
    <label className="label">Inspection date<input className="field" type="date" name="date" required defaultValue={inspection?.date}/></label>
    <label className="label">Outcome<select className="field" name="status" defaultValue={inspection?.status ?? "inspection_due"}>{["inspection_due", "passed", "defect_found", "remediation", "reinspection_due"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
    <label className="label">Notes<textarea className="field" name="notes" required minLength={3} defaultValue={inspection?.notes}/></label>
    <label className="label">Reinspection date<input className="field" type="date" name="reinspectionDate" defaultValue={inspection?.reinspectionDate}/></label>
    <button className="button" disabled={busy || (!inspection && projects.length === 0)}>{busy ? "Saving…" : inspection ? "Update inspection" : "Save inspection"}</button>{message && <small role="status">{message}</small>}
  </form>;
}
