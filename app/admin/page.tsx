import Link from "next/link";
import { getAdminOverview } from "@/lib/services/admin-server";
import { SectionHeading } from "@/components/admin/section-heading";
import { StatusBadge } from "@/components/admin/status-badge";

export default async function AdminOverview() {
  const result = await getAdminOverview();
  if (!result.ok) return <section><SectionHeading eyebrow="Admin overview" title="Dashboard unavailable" description={result.error.message} /><div className="card" role="alert">The dashboard could not load persisted records. Retry after checking the database connection.</div></section>;
  const metrics = [["Published projects", result.data.publishedProjects], ["Issues awaiting review", result.data.issuesAwaitingReview], ["Urgent triage", result.data.urgentIssues], ["Inspections due", result.data.inspectionsDue]] as const;
  return <section>
    <SectionHeading eyebrow="Overview · persisted records" title="Today at a glance" description="Authorized civic staff view the current review and restoration queues." />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
      {metrics.map(([label, value]) => <div className="card" key={label}><div className="eyebrow">{label}</div><strong style={{ display: "block", fontSize: 32, marginTop: 12 }}>{value}</strong><small style={{ color: "var(--muted)" }}>Live database count</small></div>)}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginTop: 22 }}>
      <div className="card"><h3>Needs attention</h3>{result.data.recentIssues.map((issue) => <p key={issue.id}><StatusBadge status={issue.urgent ? "delayed" : issue.status} label={issue.urgent ? "Urgent triage" : issue.status} /> <Link href="/admin/issues">{issue.title}</Link></p>)}<Link href="/admin/issues" style={{ color: "var(--green)", fontWeight: 700 }}>Open review queue →</Link></div>
      <div className="card"><h3>Admin workspaces</h3><p>Use the review queue, group approvals, coordination, and restoration pages to act on persisted records.</p><Link href="/admin/groups" style={{ color: "var(--green)", fontWeight: 700 }}>Review group applications →</Link><br/><Link href="/admin/restoration" style={{ color: "var(--green)", fontWeight: 700 }}>View restoration checks →</Link></div>
    </div>
  </section>;
}
