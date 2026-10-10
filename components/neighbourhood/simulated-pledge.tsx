"use client";
import { useState } from "react";

export function SimulatedPledge({ campaignId, targetAmount }: { campaignId: string; targetAmount: number }) {
  const [amount, setAmount] = useState("500"); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function pledge() { const value = Number(amount); if (!Number.isFinite(value) || value <= 0) { setMessage("Enter a positive amount."); return; } setBusy(true); try { const response = await fetch("/api/sponsorship/pledges", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ campaignId, amount: value }) }); const result = await response.json(); setMessage(response.ok && result.ok ? `Simulated pledge recorded for ₹${value.toLocaleString("en-IN")}; no money was transferred.` : result.error?.message ?? "Pledge could not be recorded."); } catch { setMessage("Pledge could not be recorded."); } finally { setBusy(false); } }
  return <div className="card"><div className="eyebrow">Simulated pledge · no payment</div><p>Campaign target: ₹{targetAmount.toLocaleString("en-IN")}. This demo does not represent money received or allocated.</p><label className="label">Amount (INR)<input className="field" type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><button className="button" onClick={pledge} disabled={busy}>{busy ? "Recording…" : "Record simulated pledge"}</button>{message && <p role="status" style={{ color: "var(--green)" }}>{message}</p>}</div>;
}
