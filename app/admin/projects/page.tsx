"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/admin/section-heading";
import { StatusBadge } from "@/components/admin/status-badge";
import { createClient } from "@/lib/supabase/browser";

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  department: string;
  ward: string;
  location: string;
  planned_start: string;
  original_expected_end: string;
  expected_end: string;
  status: string;
  is_published: boolean;
};

export default function AdminProjects() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      const client = createClient();
      if (!client) {
        setError("Supabase is not configured; projects cannot be loaded.");
        setLoading(false);
        return;
      }
      const result = await client.from("projects").select("id,slug,title,department,ward,location,planned_start,original_expected_end,expected_end,status,is_published").order("updated_at", { ascending: false }).limit(200);
      if (result.error) setError("Projects could not be loaded.");
      else setProjects(result.data ?? []);
      setLoading(false);
    }
    void loadProjects();
  }, []);

  return <section>
    <SectionHeading eyebrow="Project management · persisted register" title="Public works projects" description="Create and oversee authorized project records, publication state, schedules, locations, and closure notes." action={<Link href="/admin/projects/new" className="button">＋ New project</Link>} />
    {error && <p className="card" role="alert">{error}</p>}
    {loading && <p className="card" role="status">Loading projects…</p>}
    {!loading && !error && !projects.length && <p className="card">No project records yet. Create the first authorized project.</p>}
    <div className="card" style={{ overflowX: "auto", padding: 0 }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
      <thead><tr>{["Project", "Department · ward", "Schedule", "Status", "Public page"].map((heading) => <th key={heading} style={{ textAlign: "left", padding: 14, borderBottom: "1px solid var(--line)", color: "var(--muted)", fontSize: 12 }}>{heading}</th>)}</tr></thead>
      <tbody>{projects.map((project) => <tr key={project.id}>
        <td style={{ padding: 14, borderBottom: "1px solid var(--line)" }}><strong>{project.title}</strong><div style={{ color: "var(--muted)", fontSize: 13 }}>{project.location}</div></td>
        <td style={{ padding: 14, borderBottom: "1px solid var(--line)" }}>{project.department}<div style={{ color: "var(--muted)", fontSize: 13 }}>{project.ward}</div></td>
        <td style={{ padding: 14, borderBottom: "1px solid var(--line)" }}>{project.planned_start} → {project.expected_end}{project.original_expected_end !== project.expected_end && <div style={{ color: "#966118", fontSize: 12 }}>Originally {project.original_expected_end}</div>}</td>
        <td style={{ padding: 14, borderBottom: "1px solid var(--line)" }}><StatusBadge status={project.status}/></td>
        <td style={{ padding: 14, borderBottom: "1px solid var(--line)" }}>{project.is_published ? <Link href={`/projects/detail?slug=${encodeURIComponent(project.slug)}`} style={{ color: "var(--green)" }}>Open ↗</Link> : "Draft"}</td>
      </tr>)}</tbody>
    </table></div>
  </section>;
}
