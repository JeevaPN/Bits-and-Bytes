import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProjectQr } from "@/components/projects/project-qr";

export async function PublicProjectsPage() {
  const client = await createClient();
  const { data, error } = client ? await client.from("projects").select("id,slug,title,description,department,location,status").eq("is_published", true).order("updated_at", { ascending: false }).limit(100) : { data: null, error: null };
  return <div className="container public-projects-page">
    <div className="eyebrow">Public works · live register</div>
    <h1 className="workspace-display-title"><span>Projects</span><em>around you.</em></h1>
    <p className="public-projects-intro">Browse published work, timelines, and project details — no account needed.</p>
    {!client && <p className="card" role="alert">The public project register is unavailable because Supabase is not configured.</p>}
    {error && <p className="card" role="alert">Projects could not be loaded. Please try again later.</p>}
    {client && !error && !data?.length && <p className="card">No published projects are available yet.</p>}
    <div className="public-page-grid public-projects-grid">{(data ?? []).map((project) => <Link className="card public-project-card" href={`/projects/${project.slug}`} key={project.id}>
      <ProjectQr slug={project.slug} title={project.title} />
      <span className="eyebrow">{project.status} · {project.department}</span><h2 style={{ fontSize: 22 }}>{project.title}</h2>
      <p style={{ color: "var(--muted)" }}>{project.description}</p><p>📍 {project.location}</p><span style={{ color: "var(--green)" }}>View project →</span>
    </Link>)}</div>
  </div>;
}
