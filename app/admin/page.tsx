import Link from "next/link";
import { adminIssues, adminProjects, groupApplications, restorationInspections } from "@/lib/domain/admin-demo-data";
import { SectionHeading } from "@/components/admin/section-heading";
import { StatusBadge } from "@/components/admin/status-badge";

export default function AdminOverview() {
  const metrics = [
    ["Published projects", String(adminProjects.filter((project) => project.published).length)],
    ["Issues awaiting review", String(adminIssues.filter((issue) => issue.reviewStatus === "unverified" || issue.reviewStatus === "more_info").length)],
    ["Urgent triage", String(adminIssues.filter((issue) => issue.urgent).length)],
    ["Inspections due", String(restorationInspections.filter((item) => item.status.endsWith("due")).length)],
  ];
  return <section>
    <SectionHeading eyebrow="Overview · demo snapshot" title="Today at a glance" description="A starting dashboard for authorized civic staff. All records shown here are sample data." />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
      {metrics.map(([label, value]) => <div className="card" key={label}><div className="eyebrow">{label}</div><strong style={{ display: "block", fontSize: 32, marginTop: 12 }}>{value}</strong><small style={{ color: "var(--muted)" }}>Demo records</small></div>)}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginTop: 22 }}>
      <div className="card"><h3>Needs attention</h3>{adminIssues.filter((issue) => issue.urgent || issue.reviewStatus === "unverified").map((issue) => <p key={issue.id}><StatusBadge status={issue.urgent ? "delayed" : issue.reviewStatus} label={issue.urgent ? "Urgent triage" : "Unverified"} /> <Link href="/admin/issues">{issue.title}</Link></p>)}<Link href="/admin/issues" style={{ color: "var(--green)", fontWeight: 700 }}>Open review queue →</Link></div>
      <div className="card"><h3>Upcoming admin work</h3><p>{groupApplications.filter((item) => item.status === "pending" || item.status === "more_info").length} group applications need a decision.</p><p>{restorationInspections.length} restoration inspection is scheduled.</p><Link href="/admin/groups" style={{ color: "var(--green)", fontWeight: 700 }}>Review group applications →</Link><br/><Link href="/admin/restoration" style={{ color: "var(--green)", fontWeight: 700 }}>View restoration checks →</Link></div>
    </div>
  </section>;
}
