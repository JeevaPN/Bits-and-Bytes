import Link from "next/link";
import { projects } from "@/lib/domain/demo-data";

export function PublicProjectsPage() {
  return (
    <div className="container" style={{ paddingTop: 48 }}>
      <div className="eyebrow">Public works · demo data</div>
      <h1>Projects around you</h1>
      <p style={{ color: "var(--muted)" }}>Browse published work, timelines, and project details — no account needed.</p>
      <div className="public-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 16, marginTop: 28 }}>
        {projects.map((project) => (
          <Link className="card" href={`/projects/${project.slug}`} key={project.id}>
            <span className="eyebrow">{project.status} · {project.department}</span>
            <h2 style={{ fontSize: 22 }}>{project.title}</h2>
            <p style={{ color: "var(--muted)" }}>{project.description}</p>
            <p>📍 {project.location}</p>
            <span style={{ color: "var(--green)" }}>View project →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

