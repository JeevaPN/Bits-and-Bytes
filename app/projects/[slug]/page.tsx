import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/server";
import { ProjectFollow } from "@/components/neighbourhood/project-follow";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await createClient();
  if (!client) return <main className="container" style={{ paddingTop: 44 }}><p className="card" role="alert">This project is unavailable because Supabase is not configured.</p></main>;
  const { data: project, error } = await client.from("projects").select("id,slug,title,description,work_type,department,contractor,location,planned_start,original_expected_end,expected_end,status,budget,updated_at").eq("slug", slug).eq("is_published", true).maybeSingle();
  if (!project && !error) notFound();
  if (error || !project) return <main className="container" style={{ paddingTop: 44 }}><p className="card" role="alert">Project details are unavailable.</p></main>;
  const { data: events } = await client.from("project_events").select("event_type,details,created_at").eq("project_id", project.id).eq("public_visible", true).order("created_at", { ascending: false }).limit(20);
  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/projects/${project.slug}`;
  return (
    <main className="container" style={{ paddingTop: 44 }}>
      <div className="eyebrow">Public project · {project.status}</div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 260px", gap: 24, marginTop: 10 }}>
        <article>
          <h1 style={{ fontSize: 42, letterSpacing: "-.04em" }}>{project.title}</h1>
          <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.7 }}>{project.description}</p>
          <div className="card" style={{ marginTop: 24 }}>
            <h2>Project details</h2>
            <Detail label="Location" value={project.location}/>
            <Detail label="Department" value={project.department}/>
            <Detail label="Contractor" value={project.contractor || "Not published"}/>
            <Detail label="Work type" value={project.work_type || "Not specified"}/>
            <Detail label="Planned start" value={formatDate(project.planned_start)}/>
            <Detail label="Promised completion" value={formatDate(project.original_expected_end)}/>
            <Detail label="Current expected completion" value={formatDate(project.expected_end)}/>
            {project.budget != null ? <Detail label="Budget" value={`₹${Number(project.budget).toLocaleString("en-IN")}`}/> : null}
            <Detail label="Last updated" value={formatDate(project.updated_at)}/>
          </div>
          <div className="card" style={{ marginTop: 18 }}>
            <h2>Public timeline</h2>
            {!events?.length ? <p>No public updates have been recorded.</p> : <ul>{events.map((event, index) => <li key={`${event.created_at}-${index}`}><strong>{String(event.event_type).replaceAll("_", " ")}</strong> · {formatDate(event.created_at)}{event.details ? <span> — {publicDetail(event.details)}</span> : null}</li>)}</ul>}
          </div>
        </article>
        <aside className="card" style={{ alignSelf: "start", textAlign: "center" }}>
          <div className="eyebrow">Worksite QR</div><div style={{ padding: 14 }}><QRCodeSVG value={publicUrl} size={190} level="M" includeMargin/></div>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Scan to open this stable public project page.</p><ProjectFollow projectId={project.id}/>
        </aside>
      </div>
    </main>
  );
}
function formatDate(value: string) { return new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" }); }
function publicDetail(value: unknown) { if (!value || typeof value !== "object") return ""; const details = value as Record<string, unknown>; return typeof details.message === "string" ? details.message : typeof details.title === "string" ? details.title : ""; }
function Detail({ label, value }: { label: string; value: string }) { return <p><strong>{label}:</strong> {value}</p>; }
