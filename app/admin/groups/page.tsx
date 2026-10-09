import { groupApplications } from "@/lib/domain/admin-demo-data";
import { SectionHeading } from "@/components/admin/section-heading";
import { StatusBadge } from "@/components/admin/status-badge";
import { DemoAction } from "@/components/admin/demo-action";
export default function AdminGroups() { return <section>
  <SectionHeading eyebrow="Group oversight · demo applications" title="Group approvals" description="Only approved groups can manage public work pages or accept tasks. Record a reason for each decision." />
  <div style={{ display: "grid", gap: 14 }}>{groupApplications.map((application) => <article className="card" key={application.id}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><h2 style={{ margin: 0 }}>{application.name}</h2><StatusBadge status={application.status}/></div><p>Area: {application.area} · Submitted {application.submittedAt}</p><p>Eligible work: {application.capabilities.map((item) => item.replaceAll("_", " ")).join(", ")}</p>{application.reason && <p><strong>Review note:</strong> {application.reason}</p>}<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{["Approve", "Request information", "Reject", "Suspend"].map((action) => <DemoAction key={action} label={action} detail="Persist the decision, authorized reviewer, reason, and timestamp. Approval unlocks group-specific permissions." />)}</div></article>)}</div>
</section>; }
