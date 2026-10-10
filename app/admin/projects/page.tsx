import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/admin/section-heading";
import { StatusBadge } from "@/components/admin/status-badge";

export default async function AdminProjects() {
  const client = await createClient();
  const { data, error } = client
    ? await client.from("projects")
      .select("id,slug,title,department,ward,location,planned_start,original_expected_end,expected_end,status,is_published")
      .order("updated_at", { ascending: false })
      .limit(200)
    : { data: null, error: null };
  const publicBaseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const columns = ["Project", "Department · ward", "Schedule", "Status", "QR code"];
  return <section>
    <SectionHeading
      eyebrow="Project management · persisted register"
      title="Public works projects"
      description="Create and oversee authorized project records, publication state, schedules, locations, and closure notes."
      action={<Link href="/admin/projects/new" className="button">＋ New project</Link>}
    />
    {!client && <p className="card" role="alert">Supabase is not configured; projects cannot be loaded.</p>}
    {error && <p className="card" role="alert">Projects could not be loaded.</p>}
    {client && !error && !data?.length && <p className="card">No project records yet. Create the first authorized project.</p>}
    <div className="card" style={{ overflowX: "auto", padding: 0 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 850 }}>
        <thead><tr>{columns.map((heading) => <th key={heading} style={{ textAlign: "left", padding: 14, borderBottom: "1px solid var(--line)", color: "var(--muted)", fontSize: 12 }}>{heading}</th>)}</tr></thead>
        <tbody>{(data ?? []).map((project) => {
          const projectUrl = `${publicBaseUrl}/projects/${project.slug}`;
          return <tr key={project.id}>
            <td style={{ padding: 14, borderBottom: "1px solid var(--line)" }}><strong>{project.title}</strong><div style={{ color: "var(--muted)", fontSize: 13 }}>{project.location}</div></td>
            <td style={{ padding: 14, borderBottom: "1px solid var(--line)" }}>{project.department}<div style={{ color: "var(--muted)", fontSize: 13 }}>{project.ward}</div></td>
            <td style={{ padding: 14, borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}>{project.planned_start} → {project.expected_end}{project.original_expected_end !== project.expected_end && <div style={{ color: "#966118", fontSize: 12 }}>Originally {project.original_expected_end}</div>}</td>
            <td style={{ padding: 14, borderBottom: "1px solid var(--line)" }}><StatusBadge status={project.status} /></td>
            <td style={{ padding: 12, borderBottom: "1px solid var(--line)" }}>
              {project.is_published ? <div style={{ display: "grid", justifyItems: "start", gap: 6 }}>
                <Link href={`/projects/${project.slug}`} aria-label={`Open public page for ${project.title}`} style={{ display: "block", padding: 5, border: "1px solid var(--border)", borderRadius: 8, background: "#fff" }}>
                  <QRCodeSVG value={projectUrl} size={76} level="M" includeMargin aria-label={`QR code for ${project.title}`} />
                </Link>
                <Link href={`/projects/${project.slug}`} style={{ color: "var(--accent)", fontSize: 12, fontWeight: 650 }}>Open public page ↗</Link>
              </div> : <span style={{ color: "var(--muted)", fontSize: 13 }}>Publish to generate QR</span>}
            </td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </section>;
}
