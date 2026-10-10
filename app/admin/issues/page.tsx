"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { saveIssueReview } from "./actions";
import { SectionHeading } from "@/components/admin/section-heading";
import { StatusBadge } from "@/components/admin/status-badge";
import { createClient } from "@/lib/supabase/browser";

type ReviewIssue = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  observed_at: string;
  review_status: string;
  urgent: boolean;
  verification_count: number;
  duplicate_of: string | null;
};

const decisions = ["accept", "more_info", "refer", "reject", "duplicate"] as const;

export default function AdminIssues() {
  const [issues, setIssues] = useState<ReviewIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadIssues = useCallback(async () => {
    const client = createClient();
    if (!client) {
      setError("Supabase is not configured; the review queue is unavailable.");
      setLoading(false);
      return;
    }
    const { data, error: queryError } = await client
      .from("admin_issue_review_queue")
      .select("id,title,description,category,location,observed_at,review_status,urgent,verification_count,duplicate_of")
      .in("review_status", ["unverified", "more_info", "accepted"])
      .order("urgent", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    if (queryError) setError("The review queue could not be loaded.");
    else setIssues(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadIssues();
  }, [loadIssues]);

  async function decide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter ?? undefined);
    const issueId = String(formData.get("issueId"));
    const result = await saveIssueReview({
      issueId,
      action: String(formData.get("action")) as typeof decisions[number],
      reason: String(formData.get("reason")),
      canonicalIssueId: String(formData.get("canonicalIssueId") || ""),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setBusyId(issueId);
    await loadIssues();
    setBusyId(null);
  }

  return <section>
    <SectionHeading eyebrow="Official review · persisted queue" title="Issue review" description="Community observation counts are separate from official decisions. Every action records an authorized reviewer and reason." />
    {error && <p className="card" role="alert">{error}</p>}
    {loading && <p className="card" role="status">Loading review queue…</p>}
    {!loading && !error && !issues.length && <p className="card">No issues are awaiting review.</p>}
    <div style={{ display: "grid", gap: 14 }}>
      {issues.map((issue) => <article className="card" key={issue.id}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div><div className="eyebrow">{issue.category.replaceAll("_", " ")}</div><h2 style={{ marginBottom: 6 }}>{issue.title}</h2></div>
          <div style={{ display: "flex", gap: 7 }}>{issue.urgent && <StatusBadge status="delayed" label="Urgent triage"/>}<StatusBadge status={issue.review_status} label={`Official: ${issue.review_status.replaceAll("_", " ")}`}/></div>
        </div>
        <p>{issue.description}</p>
        <p style={{ color: "var(--muted)" }}>📍 {issue.location} · Observed {new Date(issue.observed_at).toLocaleString("en-IN")} · <strong>{issue.verification_count} community observations</strong></p>
        <form onSubmit={decide} style={{ display: "grid", gap: 8 }}>
          <input type="hidden" name="issueId" value={issue.id}/>
          <label className="label">Decision reason<textarea className="field" name="reason" required minLength={3} rows={2} placeholder="Explain the official decision."/></label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {decisions.map((action) => <button className="button secondary" name="action" value={action} key={action} disabled={busyId === issue.id}>{action.replaceAll("_", " ")}</button>)}
            <Link className="button secondary" href={`/neighbourhood/issues/details?id=${encodeURIComponent(issue.id)}`}>Open public record</Link>
          </div>
        </form>
      </article>)}
    </div>
  </section>;
}
