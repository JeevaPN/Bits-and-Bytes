import Link from "next/link";
import { coordinationCases, adminProjects } from "@/lib/domain/admin-demo-data";
import { SectionHeading } from "@/components/admin/section-heading";
import { StatusBadge } from "@/components/admin/status-badge";
import { DemoAction } from "@/components/admin/demo-action";
export default function AdminCoordination() { return <section>
  <SectionHeading eyebrow="Dig-Once · demo cases" title="Coordination cases" description="Potential schedule and street conflicts need staff review; a warning is not proof that projects can be combined." />
  <div style={{ display: "grid", gap: 14 }}>{coordinationCases.map((item) => <article className="card" key={item.id}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><h2 style={{ marginTop: 0 }}>{item.title}</h2><StatusBadge status={item.status}/></div><p><strong>Street:</strong> {item.street}</p><p>{item.reason}</p><p><strong>Related project:</strong> {item.projectSlugs.map((slug) => { const project = adminProjects.find((row) => row.slug === slug); return project ? <span key={slug}><Link href={`/projects/${slug}`}>{project.title}</Link> · </span> : null; })}</p><p><strong>Shared schedule:</strong> {item.proposedDates}</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><DemoAction label="Open coordination case" detail="Create a case with linked projects, street segments, conflict explanation, assigned departments, and actor history."/><DemoAction label="Propose shared schedule" detail="Capture proposed dates while retaining original project commitments."/></div></article>)}</div>
</section>; }
