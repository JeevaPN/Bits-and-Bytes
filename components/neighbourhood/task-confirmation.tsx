"use client";
import { useState } from "react";
import type { GroupTask } from "@/lib/domain/types";
import { confirmTaskForCurrentUser } from "@/lib/services/neighbourhood-server";

export function TaskConfirmation({ task }: { task: GroupTask }) {
  const [busy, setBusy] = useState(false); const [reason, setReason] = useState(""); const [message, setMessage] = useState("");
  async function decide(decision: "confirmed" | "disputed") { if (busy) return; setBusy(true); const result = await confirmTaskForCurrentUser({ taskId: task.id, decision, reason }); setMessage(result.ok ? "Your independent community response was recorded. It does not resolve the issue officially." : result.error.message); setBusy(false); }
  return <section className="card" aria-label="Community task confirmation"><div className="eyebrow">Independent community confirmation</div><p>Group completion claim: <strong>{task.status}</strong>. Confirmations are separate resident events and do not approve restoration or close an issue.</p><label className="label">Reason if disputing (optional for confirmation)<textarea className="field" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} /></label><button className="button" onClick={() => decide("confirmed")} disabled={busy}>Confirm completion</button> <button className="button secondary" onClick={() => decide("disputed")} disabled={busy || reason.trim().length < 10}>Dispute completion</button>{message && <p role="status" style={{ color: "var(--green)" }}>{message}</p>}</section>;
}
