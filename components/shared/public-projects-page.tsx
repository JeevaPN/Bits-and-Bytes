"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Project = {
  id: string;
  slug: string;
  title: string;
  description: string;
  department: string;
  location: string;
  status: string;
};

export function PublicProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      const client = createClient();
      if (!client) {
        setError("The public project register is unavailable because Supabase is not configured.");
        return;
      }
      const result = await client.from("projects").select("id,slug,title,description,department,location,status").eq("is_published", true).order("updated_at", { ascending: false }).limit(100);
      if (result.error) setError("Projects could not be loaded. Please try again later.");
      else setProjects(result.data ?? []);
    }
    void loadProjects();
  }, []);

  return <div className="container public-projects-page">
    <div className="eyebrow">Public works · live register</div>
    <h1 className="workspace-display-title"><span>Projects</span><em>around you.</em></h1>
    <p className="public-projects-intro">Browse published work, timelines, and project details — no account needed.</p>
    {error && <p className="card" role="alert">{error}</p>}
    {!error && !projects.length && <p className="card">No published projects are available yet.</p>}
    <div className="public-page-grid public-projects-grid">{projects.map((project) => <Link className="card" href={`/projects/detail?slug=${encodeURIComponent(project.slug)}`} key={project.id}>
      <span className="eyebrow">{project.status} · {project.department}</span><h2 style={{ fontSize: 22 }}>{project.title}</h2>
      <p style={{ color: "var(--muted)" }}>{project.description}</p><p>📍 {project.location}</p><span style={{ color: "var(--green)" }}>View project →</span>
    </Link>)}</div>
  </div>;
}
