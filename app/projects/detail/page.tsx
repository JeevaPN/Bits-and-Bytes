"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ProjectFollow } from "@/components/neighbourhood/project-follow";
import { createClient } from "@/lib/supabase/browser";

type Project = {
  id: string;
  slug: string;
  title: string;
  description: string;
  work_type: string | null;
  department: string;
  contractor: string | null;
  location: string;
  planned_start: string;
  original_expected_end: string;
  expected_end: string;
  status: string;
  budget: number | null;
  updated_at: string;
};
type ProjectEvent = { event_type: string; details: unknown; created_at: string };

export default function ProjectPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProject() {
      const slug = new URLSearchParams(window.location.search).get("slug");
      const client = createClient();
      if (!client) {
        setError("This project is unavailable because Supabase is not configured.");
        setLoading(false);
        return;
      }
      if (!slug) {
        setError("Choose a project from the public project register.");
        setLoading(false);
        return;
      }
      const { data, error: projectError } = await client.from("projects")
        .select("id,slug,title,description,work_type,department,contractor,location,planned_start,original_expected_end,expected_end,status,budget,updated_at")
        .eq("slug", slug).eq("is_published", true).maybeSingle();
      if (projectError || !data) {
        setError("Project details are unavailable.");
        setLoading(false);
        return;
      }
      setProject(data);
      const { data: eventData } = await client.from("project_events").select("event_type,details,created_at").eq("project_id", data.id).eq("public_visible", true).order("created_at", { ascending: false }).limit(20);
      setEvents(eventData ?? []);
      setLoading(false);
    }
    void loadProject();
  }, []);

  if (loading) return <main className="container" style={{ paddingTop: 44 }}><p className="card" role="status">Loading project…</p></main>;
  if (!project) return <main className="container" style={{ paddingTop: 44 }}><p className="card" role="alert">{error}</p></main>;
  const publicUrl = `${window.location.origin}/projects/detail?slug=${encodeURIComponent(project.slug)}`;
  return <main className="container" style={{ paddingTop: 44 }}>
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
          {!events.length ? <p>No public updates have been recorded.</p> : <ul>{events.map((event, index) => <li key={`${event.created_at}-${index}`}><strong>{String(event.event_type).replaceAll("_", " ")}</strong> · {formatDate(event.created_at)}{event.details ? <span> — {publicDetail(event.details)}</span> : null}</li>)}</ul>}
        </div>
      </article>
      <aside className="card" style={{ alignSelf: "start", textAlign: "center" }}>
        <div className="eyebrow">Worksite QR</div><div style={{ padding: 14 }}><QRCodeSVG value={publicUrl} size={190} level="M" includeMargin/></div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Scan to open this stable public project page.</p><ProjectFollow projectId={project.id}/>
      </aside>
    </div>
  </main>;
}
function formatDate(value: string) { return new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" }); }
function publicDetail(value: unknown) { if (!value || typeof value !== "object") return ""; const details = value as Record<string, unknown>; return typeof details.message === "string" ? details.message : typeof details.title === "string" ? details.title : ""; }
function Detail({ label, value }: { label: string; value: string }) { return <p><strong>{label}:</strong> {value}</p>; }
