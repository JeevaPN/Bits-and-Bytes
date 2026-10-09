import Link from "next/link";
import { restorationInspections } from "@/lib/domain/admin-demo-data";
import { SectionHeading } from "@/components/admin/section-heading";
import { StatusBadge } from "@/components/admin/status-badge";
import { DemoAction } from "@/components/admin/demo-action";
export default function AdminRestoration() { return <section>
  <SectionHeading eyebrow="Street Passport · demo checks" title="Restoration inspections" description="Construction completion and restoration approval are separate milestones. Record outcomes and reinspection evidence." />
  <div style={{ display: "grid", gap: 14 }}>{restorationInspections.map((inspection) => <article className="card" key={inspection.id}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div><h2 style={{ margin: 0 }}>{inspection.projectTitle}</h2><p style={{ color: "var(--muted)" }}>{inspection.street} · Due {inspection.dueDate}</p></div><StatusBadge status={inspection.status}/></div><p>Inspection outcome: {inspection.outcome ?? "Not recorded"} · Inspector: {inspection.inspector ?? "Not assigned"}</p><Link href={`/projects/${inspection.projectSlug}`} style={{ color: "var(--green)" }}>View project record →</Link><div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}><DemoAction label="Record inspection" detail="Store inspector, date, pass/defect outcome, notes, and evidence without changing the project completion record."/><DemoAction label="Create remediation" detail="Create a follow-up and schedule reinspection when restoration defects are found."/></div></article>)}</div>
</section>; }
