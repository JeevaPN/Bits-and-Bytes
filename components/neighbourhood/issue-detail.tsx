"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GroupTask, Issue } from "@/lib/domain/types";
import { TaskConfirmation } from "@/components/neighbourhood/task-confirmation";
import { listPublicIssueTasksAwaitingConfirmation } from "@/lib/supabase/community-partners";

export function IssueDetail({ id, backHref = "/neighbourhood" }: { id: string; backHref?: string }) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [tasks, setTasks] = useState<GroupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch(`/api/neighbourhood/issues/${id}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { ok: boolean; data?: Issue; error?: { message: string } };
        if (!response.ok || !result.ok || !result.data) throw new Error(result.error?.message ?? "Issue unavailable.");
        if (!active) return;
        setIssue(result.data);
        const taskResult = await listPublicIssueTasksAwaitingConfirmation(id);
        if (active && taskResult.ok) setTasks(taskResult.data);
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Issue unavailable."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function verify() {
    if (!issue || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/neighbourhood/issues/${issue.id}/verify`, { method: "POST" });
      const result = await response.json() as { ok: boolean; data?: { verificationCount: number }; error?: { message: string } };
      if (response.ok && result.ok && result.data) {
        setIssue({ ...issue, verificationCount: result.data.verificationCount });
        setMessage("Your independent observation was recorded. This does not confirm or resolve the issue officially.");
      } else setMessage(result.error?.message ?? "Verification could not be recorded.");
    } catch { setMessage("Verification could not be recorded."); }
    finally { setBusy(false); }
  }

  async function flag() {
    if (!issue || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/neighbourhood/issues/${issue.id}/challenge`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason }) });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (response.ok && result.ok) { setReason(""); setMessage("Your challenge was submitted for review; it did not remove or change the report."); }
      else setMessage(result.error?.message ?? "Challenge could not be recorded.");
    } catch { setMessage("Challenge could not be recorded."); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="container" style={{ paddingTop: 42 }}><p className="card">Loading issue…</p></main>;
  if (error || !issue) return <main className="container" style={{ paddingTop: 42 }}><p className="card" role="alert">{error || "Issue not found."} <Link href={backHref} style={{ textDecoration: "underline" }}>Back to reports</Link></p></main>;

  return <main className="container" style={{ maxWidth: 820, paddingTop: 42 }}>
    <Link href={backHref} style={{ color: "var(--green)" }}>← Back to reports</Link>
    <div className="eyebrow" style={{ marginTop: 24 }}>{issue.urgent ? "Urgent hazard · " : ""}{issue.category.replaceAll("_", " ")}</div>
    <h1>{issue.title}</h1><p style={{ fontSize: 18, lineHeight: 1.6 }}>{issue.description}</p>
    <div className="card">
      <p><strong>Location:</strong> {issue.location}</p>
      <p><strong>Observed:</strong> {new Date(issue.observedAt).toLocaleString("en-IN")}</p>
      <p><strong>Source:</strong> {issue.source === "citizen" ? "Resident observation" : `${issue.source} observation`}</p>
      <p><strong>Official review:</strong> {issue.reviewStatus}. Community observations are separate and do not decide this status.</p>
      <p><strong>Independent observations:</strong> {issue.verificationCount}</p>
    </div>
    {tasks.map((task) => <TaskConfirmation key={task.id} task={task} onResponded={(updated) => setTasks((current) => current.map((item) => item.id === updated.id ? updated : item))}/>)}
    <div className="card" style={{ marginTop: 16 }}>
      <h2>Actions for residents</h2>
      <p style={{ color: "var(--muted)" }}>Only verify if you personally observed this issue. Sign in is required to prevent duplicate observations.</p>
      <button className="button" onClick={verify} disabled={busy}>I observed this issue</button>
      <div style={{ borderTop: "1px solid var(--line)", marginTop: 22, paddingTop: 12 }}>
        <label className="label">Challenge this report<textarea className="field" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain what may be inaccurate or misleading (at least 10 characters)." rows={3}/></label>
        <button className="button secondary" onClick={flag} disabled={busy || reason.trim().length < 10}>Submit challenge</button>
      </div>
      {message && <p role="status" style={{ color: "var(--green)" }}>{message}</p>}
    </div>
  </main>;
}
