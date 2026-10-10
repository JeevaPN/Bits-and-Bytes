"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { reviewGroupApplication } from "./actions";
import { SectionHeading } from "@/components/admin/section-heading";
import { StatusBadge } from "@/components/admin/status-badge";
import { createClient } from "@/lib/supabase/browser";

type GroupApplication = {
  id: string;
  name: string;
  description: string;
  location: string;
  service_area: string;
  eligible_work: string[] | null;
  approval_status: string;
  created_at: string;
};

const decisions = ["approve", "more_info", "reject", "suspend"] as const;

export default function AdminGroups() {
  const [applications, setApplications] = useState<GroupApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    const client = createClient();
    if (!client) {
      setError("Supabase is not configured; applications cannot be loaded.");
      setLoading(false);
      return;
    }
    const { data, error: queryError } = await client
      .from("social_groups")
      .select("id,name,description,location,service_area,eligible_work,approval_status,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (queryError) setError("Applications could not be loaded.");
    else setApplications(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  async function decide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter ?? undefined);
    const groupId = String(formData.get("groupId"));
    const result = await reviewGroupApplication({
      groupId,
      action: String(formData.get("action")) as typeof decisions[number],
      reason: String(formData.get("reason")),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setBusyId(groupId);
    await loadApplications();
    setBusyId(null);
  }

  return <section>
    <SectionHeading eyebrow="Group oversight · persisted applications" title="Group approvals" description="Only approved groups can manage public work pages or accept tasks. Record a reason for each decision." />
    {error && <p className="card" role="alert">{error}</p>}
    {loading && <p className="card" role="status">Loading applications…</p>}
    {!loading && !error && !applications.length && <p className="card">No community group applications yet.</p>}
    <div style={{ display: "grid", gap: 14 }}>
      {applications.map((application) => <article className="card" key={application.id}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><h2 style={{ margin: 0 }}>{application.name}</h2><StatusBadge status={application.approval_status}/></div>
        <p>{application.description}</p>
        <p>Area: {application.location} · Service area: {application.service_area}</p>
        <p>Eligible work: {(application.eligible_work ?? []).map((item) => item.replaceAll("_", " ")).join(", ") || "Not specified"}</p>
        <form onSubmit={decide} style={{ display: "grid", gap: 8 }}>
          <input type="hidden" name="groupId" value={application.id}/>
          <label className="label">Decision reason<textarea className="field" name="reason" required minLength={3} rows={2}/></label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{decisions.map((action) => <button className="button secondary" name="action" value={action} key={action} disabled={busyId === application.id}>{action.replaceAll("_", " ")}</button>)}</div>
        </form>
      </article>)}
    </div>
  </section>;
}
