import Link from "next/link";
import { issues, projects } from "@/lib/domain/demo-data";

export function MapPreview() {
  return <div className="card map-preview-card">
    <div className="map-preview-canvas">
      <div className="map-preview-marker map-marker-project">● Project · demo</div>
      <div className="map-preview-marker map-marker-issue">● Issue report · demo</div>
      <small className="map-preview-note">Map location preview · OpenStreetMap adapter pending</small>
    </div>
  </div>;
}

export function PublicMapPage() {
  return (
    <div className="container public-map-page">
      <section className="public-map-layout">
        <div className="public-map-copy">
          <div className="eyebrow">Shared map · OpenStreetMap</div>
          <h1 className="workspace-display-title"><span>See your</span><em>neighbourhood.</em></h1>
          <p style={{ color: "var(--muted)" }}>Explore demo public works and community reports by location. Live road closure and route information is not available.</p>
          <div className="workspace-topic-buttons">
            <Link className="button secondary" href="#map-projects">Project locations →</Link>
            <Link className="button secondary" href="#map-issues">Issue locations →</Link>
          </div>
        </div>
        <MapPreview />
      </section>
      <section id="map-projects" className="public-map-lists public-page-grid">
        <div className="card">
          <h2>Official projects</h2>
          {projects.map((project) => <p key={project.id}><span aria-hidden="true">🟢 </span><Link href={`/projects/${project.slug}`}>{project.title}</Link> · {project.status}</p>)}
        </div>
        <div id="map-issues" className="card">
          <h2>Community reports</h2>
          <p><Link href="/issues" style={{ color: "var(--green)" }}>Browse all public issue reports →</Link></p>
          {issues.map((issue) => <p key={issue.id}><span aria-hidden="true">🔴 </span><Link href={`/issues/${issue.id}`}>{issue.title}</Link> · {issue.reviewStatus} · {issue.verificationCount} observations</p>)}
        </div>
      </section>
    </div>
  );
}
