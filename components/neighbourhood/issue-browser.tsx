"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { neighbourhoodMockApi } from "@/lib/mock-api/neighbourhood";
import type { Issue } from "@/lib/domain/types";

export function IssueBrowser() {
  const [issues, setIssues] = useState<Issue[]>([]); const [query, setQuery] = useState(""); const [busy, setBusy] = useState(true); const [error, setError] = useState("");
  useEffect(() => { let active = true; setBusy(true); neighbourhoodMockApi.listIssues({ q: query, pageSize: 50 }).then((result) => { if (!active) return; if (result.ok) setIssues(result.data.items); else setError(result.error.message); setBusy(false); }); return () => { active = false; }; }, [query]);
  return <section aria-labelledby="issues-heading"><div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "end", flexWrap: "wrap" }}><div><div className="eyebrow">Public issue reports</div><h2 id="issues-heading">What neighbours are seeing</h2></div><input className="field" style={{ maxWidth: 300 }} aria-label="Search issues" placeholder="Search street or issue" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    {busy && <p className="card">Loading reports…</p>}{error && <p className="card" role="alert" style={{ color: "#a33" }}>{error}</p>}{!busy && !error && issues.length === 0 && <p className="card">No public reports match this search.</p>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 16, marginTop: 16 }}>{issues.map((issue) => <Link className="card" href={`/neighbourhood/issues/${issue.id}`} key={issue.id}><span className="eyebrow">{issue.urgent ? "Urgent · " : ""}{issue.category.replaceAll("_", " ")}</span><h3>{issue.title}</h3><p style={{ color: "var(--muted)" }}>{issue.description}</p><p>📍 {issue.location}</p><p style={{ color: "var(--muted)", fontSize: 13 }}>{issue.verificationCount} independent observation{issue.verificationCount === 1 ? "" : "s"} · Official review: {issue.reviewStatus}</p></Link>)}</div>
  </section>;
}
