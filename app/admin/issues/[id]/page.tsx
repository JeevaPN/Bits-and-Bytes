import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { saveIssueReview } from "../actions";
import { EvidenceImage } from "@/components/admin/evidence-image";

export default async function AdminIssueDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = (await params).id;
  const client = await createClient();
  if (!client) return <p className="card" role="alert">Supabase is not configured.</p>;
  const { data: issue, error } = await client.from("issues").select("id,title,description,category,location,observed_at,review_status,urgent,evidence_path").eq("id", id).maybeSingle();
  if (error || !issue) notFound();
  async function decide(formData: FormData) {
    "use server";
    const result = await saveIssueReview({ issueId: id, action: String(formData.get("action")) as "accept" | "reject" | "refer" | "more_info", reason: String(formData.get("reason")) });
    if (!result.ok) throw new Error(result.error);
    revalidatePath("/admin/issues"); revalidatePath(`/admin/issues/${id}`); revalidatePath("/neighbourhood");
  }
  const hasEvidence = typeof issue.evidence_path === "string" && issue.evidence_path.length > 0;
  return <section><Link href="/admin/issues" style={{ color: "var(--green)" }}>← Back to issue review</Link><div className="eyebrow" style={{ marginTop: 24 }}>{issue.category.replaceAll("_", " ")}</div><h2>{issue.title}</h2><p>{issue.description}</p><div className="card"><p><strong>Location:</strong> {issue.location}</p><p><strong>Observed:</strong> {new Date(issue.observed_at).toLocaleString("en-IN")}</p><p><strong>Official status:</strong> {issue.review_status}</p></div><div className="card" style={{ marginTop: 16 }}><h3>Private evidence</h3>{hasEvidence ? <><EvidenceImage src={`/api/admin/issues/${issue.id}/evidence`} alt={`Evidence for ${issue.title}`} large /><a href={`/api/admin/issues/${issue.id}/evidence`} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 10, textDecoration: "underline" }}>Open full size</a></> : <p style={{ color: "var(--muted)" }}>No evidence attached.</p>}</div><div className="card" style={{ marginTop: 16 }}><h3>Official decision</h3><form action={decide} style={{ display: "grid", gap: 10 }}><label className="label">Decision reason<textarea className="field" name="reason" required minLength={3} rows={4} placeholder="Explain the official decision." /></label><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{(["accept", "reject", "more_info", "refer"] as const).map((action) => <button className="button secondary" name="action" value={action} key={action}>{action === "accept" ? "Accept report" : action === "reject" ? "Reject report" : action.replaceAll("_", " ")}</button>)}</div></form></div></section>;
}
