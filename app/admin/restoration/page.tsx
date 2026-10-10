"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/admin/section-heading";
import { StatusBadge } from "@/components/admin/status-badge";
import { RestorationControls } from "@/components/admin/restoration-controls";
import { createClient } from "@/lib/supabase/browser";

type Project = { id: string; slug: string; title: string; location: string };
type Inspection = {
  id: string;
  project_id: string;
  inspection_date: string;
  status: string;
  notes: string | null;
  reinspection_date: string | null;
  projects: Project | Project[] | null;
};

export default function AdminRestoration() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      const client = createClient();
      if (!client) {
        setError("Supabase is not configured; inspections cannot be loaded.");
        setLoading(false);
        return;
      }
      const [inspectionResult, projectResult] = await Promise.all([
        client.from("restoration_inspections").select("id,project_id,inspection_date,status,notes,reinspection_date,projects!inner(id,slug,title,location)").order("inspection_date", { ascending: false }).limit(200),
        client.from("projects").select("id,slug,title,location").order("updated_at", { ascending: false }).limit(200),
      ]);
      if (inspectionResult.error || projectResult.error) setError("Restoration records could not be loaded.");
      else {
        setInspections(inspectionResult.data ?? []);
        setProjects(projectResult.data ?? []);
      }
      setLoading(false);
    }
    void loadData();
  }, []);

  return <section>
    <SectionHeading eyebrow="Street Passport · persisted checks" title="Restoration inspections" description="Construction completion and restoration approval are separate milestones. Record outcomes and reinspection evidence." action={<RestorationControls projects={projects}/>}/>
    {error && <p className="card" role="alert">{error}</p>}
    {loading && <p className="card" role="status">Loading restoration records…</p>}
    {!loading && !error && !inspections.length && <p className="card">No restoration inspections have been recorded.</p>}
    <div style={{ display: "grid", gap: 14 }}>{inspections.map((inspection) => {
      const project = Array.isArray(inspection.projects) ? inspection.projects[0] : inspection.projects;
      return <article className="card" key={inspection.id}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div><h2 style={{ margin: 0 }}>{project?.title ?? "Project"}</h2><p style={{ color: "var(--muted)" }}>{project?.location} · Inspection {inspection.inspection_date}</p></div><StatusBadge status={inspection.status}/></div>
        <p>{inspection.notes} {inspection.reinspection_date ? `· Reinspection ${inspection.reinspection_date}` : ""}</p>
        {project?.slug && <Link href={`/projects/detail?slug=${encodeURIComponent(project.slug)}`} style={{ color: "var(--green)" }}>View project record →</Link>}
        <RestorationControls inspection={{ id: inspection.id, projectId: inspection.project_id, date: inspection.inspection_date, status: inspection.status as "inspection_due" | "passed" | "defect_found" | "remediation" | "reinspection_due", notes: inspection.notes ?? "", reinspectionDate: inspection.reinspection_date ?? "" }}/>
      </article>;
    })}</div>
  </section>;
}
