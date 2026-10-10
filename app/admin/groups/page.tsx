import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { reviewGroupApplication } from "./actions";
import { SectionHeading } from "@/components/admin/section-heading";
import { StatusBadge } from "@/components/admin/status-badge";

export default async function AdminGroups() {
  const client = await createClient();
  const { data, error } = client
    ? await client.from("social_groups")
      .select("id,name,description,location,service_area,eligible_work,approval_status,created_at")
      .order("created_at", { ascending: false }).limit(100)
    : { data: null, error: null };

  const applications = await Promise.all((data ?? []).map(async (application) => {
    if (!client) return { ...application, evidence: [], evidenceError: false };
    const { data: files, error: evidenceError } = await client.rpc("my_community_application_evidence", { p_group_id: application.id });
    if (evidenceError) return { ...application, evidence: [], evidenceError: true };
    const evidence = await Promise.all((files ?? []).map(async (file: { id: string; object_path: string; created_at: string }) => {
      const { data: signed, error: signError } = await client.storage.from("partner-evidence").createSignedUrl(file.object_path, 300);
      return signError || !signed ? null : { id: file.id, url: signed.signedUrl, createdAt: file.created_at };
    }));
    return { ...application, evidence: evidence.filter((item): item is NonNullable<typeof item> => item !== null), evidenceError: evidence.some((item) => item === null) };
  }));

  async function decide(formData: FormData) {
    "use server";
    const result = await reviewGroupApplication({ groupId: String(formData.get("groupId")), action: String(formData.get("action")) as "approve" | "reject" | "more_info" | "suspend", reason: String(formData.get("reason")) });
    if (!result.ok) throw new Error(result.error);
    revalidatePath("/admin/groups");
    revalidatePath("/community-partners");
  }

  return <section>
    <SectionHeading eyebrow="Group oversight · persisted applications" title="Group approvals" description="Review each application and its private supporting evidence before recording a decision." />
    {!client && <p className="card" role="alert">Supabase is not configured; applications cannot be loaded.</p>}
    {error && <p className="card" role="alert">Applications could not be loaded.</p>}
    {client && !error && !applications.length && <p className="card">No community group applications yet.</p>}
    <div style={{ display: "grid", gap: 14 }}>
      {applications.map((application) => <article className="card" key={application.id}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><h2 style={{ margin: 0 }}>{application.name}</h2><StatusBadge status={application.approval_status}/></div>
        <p>{application.description}</p><p>Area: {application.location} · Service area: {application.service_area}</p>
        <p>Eligible work: {(application.eligible_work ?? []).map((item: string) => item.replaceAll("_", " ")).join(", ") || "Not specified"}</p>
        <h3>Private application evidence</h3>
        {application.evidenceError && <p role="status">Some evidence could not be loaded. Refresh the page to retry.</p>}
        {application.evidence.length
          ? <ul>{application.evidence.map((file) => <li key={file.id}><a href={file.url} target="_blank" rel="noreferrer">Open supporting image</a> · link expires in five minutes</li>)}</ul>
          : !application.evidenceError && <p>No supporting images were attached.</p>}
        <form action={decide} style={{ display: "grid", gap: 8 }}>
          <input type="hidden" name="groupId" value={application.id}/>
          <label className="label">Decision reason<textarea className="field" name="reason" required minLength={3} rows={2}/></label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{(["approve", "more_info", "reject", "suspend"] as const).map((action) => <button className="button secondary" name="action" value={action} key={action}>{action.replaceAll("_", " ")}</button>)}</div>
        </form>
      </article>)}
    </div>
  </section>;
}
