"use client";
import Link from "next/link";
import { IssueBrowser } from "@/components/neighbourhood/issue-browser";
import { ProjectFollow } from "@/components/neighbourhood/project-follow";
import { useEffect, useState } from "react";
import type { Issue, Project } from "@/lib/domain/types";

export function NeighbourhoodDashboard() {
  const [projects, setProjects] = useState<Project[]>([]); const [issues, setIssues] = useState<Issue[]>([]); const [error, setError] = useState("");
  useEffect(() => { let active = true; Promise.all([fetch("/api/neighbourhood/projects", { cache: "no-store" }), fetch("/api/neighbourhood/issues?pageSize=50", { cache: "no-store" })]).then(async ([projectResponse, issueResponse]) => {
    const [projectResult, issueResult] = await Promise.all([projectResponse.json(), issueResponse.json()]); if (!active) return;
    if (projectResponse.ok && projectResult.ok) setProjects(projectResult.data ?? []); else setError(projectResult.error?.message ?? "Published projects are unavailable.");
    if (issueResponse.ok && issueResult.ok) setIssues(issueResult.data?.items ?? []); else setError("Public reports are unavailable.");
  }).catch(() => { if (active) setError("Neighbourhood data is unavailable."); }); return () => { active = false; }; }, []);
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
