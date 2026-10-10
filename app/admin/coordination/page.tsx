import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/admin/section-heading";
import { StatusBadge } from "@/components/admin/status-badge";
import { CoordinationControls } from "@/components/admin/coordination-controls";

export default async function AdminCoordination() {
  const client = await createClient();
  const { data, error } = client ? await client.from("coordination_cases").select("id,title,project_ids,segment_ids,conflict_reason,decision,decision_reason,proposed_schedule,created_at").order("created_at", { ascending: false }).limit(200) : { data: null, error: null };
  return <section><SectionHeading eyebrow="Dig-Once · persisted cases" title="Coordination cases" description="Potential schedule and street conflicts need staff review; a warning is not proof that projects can be combined." action={<CoordinationControls/>}/>
    {!client && <p className="card" role="alert">Supabase is not configured; cases cannot be loaded.</p>}{error && <p className="card" role="alert">Coordination cases could not be loaded.</p>}
    {client && !error && !data?.length && <p className="card">No coordination cases have been recorded.</p>}
    <div style={{ display: "grid", gap: 14 }}>{(data ?? []).map((item) => <article className="card" key={item.id}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><h2 style={{ marginTop: 0 }}>{item.title}</h2><StatusBadge status={item.decision ?? "pending"}/></div>
      <p>{item.conflict_reason}</p><p>Linked projects: {(item.project_ids ?? []).length} · street segments: {(item.segment_ids ?? []).length}</p>
      {item.proposed_schedule && <p>Proposed schedule: {JSON.stringify(item.proposed_schedule)}</p>}{item.decision_reason && <p>Latest reason: {item.decision_reason}</p>}
      {item.project_ids?.length ? <ProjectNames ids={item.project_ids}/> : null}<CoordinationControls caseId={item.id}/>
    </article>)}</div>
  </section>;
}

async function ProjectNames({ ids }: { ids: string[] }) { const client = await createClient(); if (!client) return null; const { data } = await client.from("projects").select("id,title,slug").in("id", ids); return <p>Related projects: {(data ?? []).map((project) => <span key={project.id}><Link href={`/projects/${project.slug}`}>{project.title}</Link> · </span>)}</p>; }
