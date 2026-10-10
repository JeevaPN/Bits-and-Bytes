"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/admin/section-heading";
import { StatusBadge } from "@/components/admin/status-badge";
import { CoordinationControls } from "@/components/admin/coordination-controls";
import { createClient } from "@/lib/supabase/browser";

type CoordinationCase = {
  id: string;
  title: string;
  project_ids: string[] | null;
  segment_ids: string[] | null;
  conflict_reason: string;
  decision: string | null;
  decision_reason: string | null;
  proposed_schedule: unknown;
};

export default function AdminCoordination() {
  const [cases, setCases] = useState<CoordinationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCases() {
      const client = createClient();
      if (!client) {
        setError("Supabase is not configured; cases cannot be loaded.");
        setLoading(false);
        return;
      }
      const result = await client.from("coordination_cases").select("id,title,project_ids,segment_ids,conflict_reason,decision,decision_reason,proposed_schedule,created_at").order("created_at", { ascending: false }).limit(200);
      if (result.error) setError("Coordination cases could not be loaded.");
      else setCases(result.data ?? []);
      setLoading(false);
    }
    void loadCases();
  }, []);

  return <section>
    <SectionHeading eyebrow="Dig-Once · persisted cases" title="Coordination cases" description="Potential schedule and street conflicts need staff review; a warning is not proof that projects can be combined." action={<CoordinationControls/>}/>
    {error && <p className="card" role="alert">{error}</p>}
    {loading && <p className="card" role="status">Loading coordination cases…</p>}
    {!loading && !error && !cases.length && <p className="card">No coordination cases have been recorded.</p>}
    <div style={{ display: "grid", gap: 14 }}>{cases.map((item) => <article className="card" key={item.id}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><h2 style={{ marginTop: 0 }}>{item.title}</h2><StatusBadge status={item.decision ?? "pending"}/></div>
      <p>{item.conflict_reason}</p><p>Linked projects: {(item.project_ids ?? []).length} · street segments: {(item.segment_ids ?? []).length}</p>
      {item.proposed_schedule != null && <p>Proposed schedule: {JSON.stringify(item.proposed_schedule)}</p>}{item.decision_reason && <p>Latest reason: {item.decision_reason}</p>}
      {item.project_ids?.length ? <ProjectNames ids={item.project_ids}/> : null}<CoordinationControls caseId={item.id}/>
    </article>)}</div>
  </section>;
}

function ProjectNames({ ids }: { ids: string[] }) {
  const [projects, setProjects] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  useEffect(() => {
    const client = createClient();
    if (!client) return;
    void client.from("projects").select("id,title,slug").in("id", ids).then(({ data }) => setProjects(data ?? []));
  }, [ids]);
  return <p>Related projects: {projects.map((project) => <span key={project.id}><Link href={`/projects/detail?slug=${encodeURIComponent(project.slug)}`}>{project.title}</Link> · </span>)}</p>;
}
