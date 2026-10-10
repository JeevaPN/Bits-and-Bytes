"use client";
import Link from "next/link";
import { IssueBrowser } from "@/components/neighbourhood/issue-browser";
import { ProjectFollow } from "@/components/neighbourhood/project-follow";
import { useEffect, useState } from "react";
import type { Issue } from "@/lib/domain/types";
import { listPublicIssues } from "@/lib/services/neighbourhood-server";
import { createClient } from "@/lib/supabase/browser";

export function NeighbourhoodDashboard() {
  const [projects, setProjects] = useState<Array<{ id: string; title: string; department: string; description: string; location: string; status: string }>>([]); const [issues, setIssues] = useState<Issue[]>([]); const [error, setError] = useState("");
  useEffect(() => { let active = true; async function load() {
    const client = createClient();
    if (!client) { setError("Neighbourhood data is unavailable because Supabase is not configured."); return; }
    const [projectResult, issueResult] = await Promise.all([
      client.from("projects").select("id,slug,title,description,department,location,status,planned_start,expected_end,is_published").eq("is_published", true).order("updated_at", { ascending: false }).limit(50),
      listPublicIssues({ pageSize: 50 }),
    ]);
    if (!active) return;
    if (projectResult.error) setError("Published projects are unavailable.");
    else setProjects((projectResult.data ?? []).map((project) => ({ id: project.id, title: project.title, department: project.department, description: project.description, location: project.location, status: project.status })));
    if (issueResult.ok) setIssues(issueResult.data.items);
    else setError("Public reports are unavailable.");
  } void load(); return () => { active = false; }; }, []);
  return <div className="container" style={{ paddingTop: 42 }}><div className="eyebrow">Neighbourhood</div><h1>Your neighbourhood space</h1><p style={{ color: "var(--muted)" }}>Follow local work, share what you see, and support community-led action.</p>
    {error && <p role="alert" className="card" style={{ color: "#a33" }}>{error}</p>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginTop: 25 }}>
      <Link href="/neighbourhood/report" className="card"><div className="eyebrow">Get involved</div><h2>Report an issue</h2><p style={{ color: "var(--muted)" }}>Submit a location-backed observation.</p></Link>
      <Link href="/map" className="card"><div className="eyebrow">Explore</div><h2>Explore the map</h2><p style={{ color: "var(--muted)" }}>Find public works and community reports.</p></Link>
      <Link href="/sponsorship" className="card"><div className="eyebrow">Simulated support</div><h2>Support a group</h2><p style={{ color: "var(--muted)" }}>Pledges are simulations; no money moves.</p></Link>
    </div>
    <section style={{ marginTop: 38 }}><div className="eyebrow">Public works</div><h2>Projects you can follow</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 16 }}>
      {projects.map((project) => <article className="card" key={project.id}><span className="eyebrow">{project.status} · {project.department}</span><h3>{project.title}</h3><p style={{ color: "var(--muted)" }}>{project.description}</p><p>📍 {project.location}</p><ProjectFollow projectId={project.id} /></article>)}
    </div></section><p className="card" style={{ marginTop: 22 }}>{projects.length} published projects · {issues.length} public issue reports.</p><div style={{ marginTop: 38 }}><IssueBrowser /></div>
  </div>;
}
