import Link from "next/link";
import { adminIssues, adminProjects } from "@/lib/domain/admin-demo-data";
import { SectionHeading } from "@/components/admin/section-heading";
import { StatusBadge } from "@/components/admin/status-badge";
import { DemoAction } from "@/components/admin/demo-action";
export default function AdminIssues() { return <section>
  <SectionHeading eyebrow="Official review · demo queue" title="Issue review" description="Community observation counts are separate from official decisions. Verify evidence and reasons before acting." />
  <div style={{ display: "grid", gap: 14 }}>{adminIssues.map((issue) => { const project = adminProjects.find((item) => item.slug === issue.possibleProjectSlug); return <article className="card" key={issue.id}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}><div><div className="eyebrow">{issue.source} report · {issue.category.replaceAll("_", " ")}</div><h2 style={{ marginBottom: 6 }}>{issue.title}</h2></div><div style={{ display: "flex", gap: 7, alignItems: "start" }}>{issue.urgent && <StatusBadge status="delayed" label="Urgent triage"/>}<StatusBadge status={issue.reviewStatus} label={`Official: ${issue.reviewStatus.replaceAll("_", " ")}`}/></div></div>
    <p>{issue.description}</p><p style={{ color: "var(--muted)" }}>📍 {issue.location} · Observed {new Date(issue.observedAt).toLocaleString("en-IN")} · <strong>{issue.verificationCount} community observations</strong></p>
    <div style={{ background: "var(--paper)", padding: 14, borderRadius: 12 }}><strong>Possible match</strong><p style={{ margin: "6px 0" }}>{project ? <Link href={`/projects/${project.slug}`}>{project.title}</Link> : "No suggested project match"} · Match is a separate decision from issue validity.</p>{issue.reviewNote && <small>{issue.reviewNote}</small>}</div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 15 }}>{["Accept", "Request information", "Refer", "Reject", "Mark duplicate"].map((action) => <DemoAction key={action} label={action} detail="The real action must record an authorized reviewer, reason, timestamp, and applicable public response." />)}</div>
  </article>; })}</div>
</section>; }
