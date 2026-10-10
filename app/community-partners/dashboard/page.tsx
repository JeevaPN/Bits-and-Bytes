"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Issue, CommunityGroup } from "@/lib/domain/types";
import { groups as demoGroups } from "@/lib/domain/demo-data";
import { communityPartnersApi, isCommunityPartnersDemo } from "@/lib/api/community-partners";
import {
  getCommunityGroupWorkCoverage, listMyCommunityGroups, listPublicCommunityGroups,
  referCommunityIssueTo, requestCommunityCollaboration,
} from "@/lib/supabase/community-partners";
import type { PartnerCoverage, PartnerGroup } from "@/lib/supabase/community-partners";

export default function CommunityPartnersDashboard() {
  const [groups, setGroups] = useState<Array<PartnerGroup | CommunityGroup>>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [groupId, setGroupId] = useState("");
  const [coverage, setCoverage] = useState<PartnerCoverage | null>(null);
  const [otherGroups, setOtherGroups] = useState<CommunityGroup[]>([]);
  const [targetGroupId, setTargetGroupId] = useState("");
  const [collaborationGroupId, setCollaborationGroupId] = useState("");
  const [targetType, setTargetType] = useState<"official" | "specialist" | "community_partner">("official");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("Loading approved groups and opportunities…");
  const selectedGroup = groups.find((group) => group.id === groupId);
  const orderedIssues = useMemo(() => [...issues].sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.verificationCount - a.verificationCount || a.createdAt.localeCompare(b.createdAt)), [issues]);
  const filtered = orderedIssues.filter((issue) => !query || `${issue.title} ${issue.description} ${issue.location}`.toLowerCase().includes(query.toLowerCase()));

  async function loadGroup(id: string) {
    setGroupId(id);
    if (isCommunityPartnersDemo) { setCoverage(null); return; }
    const result = await getCommunityGroupWorkCoverage(id);
    setCoverage(result.ok ? result.data : null);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      const [opportunities, groupResult, directory] = await Promise.all([
        communityPartnersApi.listOpportunities({ page: 1, pageSize: 100 }),
        isCommunityPartnersDemo ? Promise.resolve(null) : listMyCommunityGroups(),
        isCommunityPartnersDemo ? Promise.resolve(null) : listPublicCommunityGroups(),
      ]);
      if (!active) return;
      if (opportunities.ok) setIssues(opportunities.data.items); else setMessage(opportunities.error.message);
      const ownGroups = isCommunityPartnersDemo ? demoGroups.filter((group) => group.approved) : groupResult?.ok ? groupResult.data.filter((group) => group.approved) : [];
      setGroups(ownGroups);
      if (ownGroups.length) { setGroupId(ownGroups[0].id); if (!isCommunityPartnersDemo) await loadGroup(ownGroups[0].id); }
      if (isCommunityPartnersDemo) setOtherGroups(demoGroups.filter((group) => group.approved));
      else if (directory?.ok) setOtherGroups(directory.data.items);
      setMessage(ownGroups.length ? "" : "Sign in with an approved partner group to accept work, refer issues, or request collaboration.");
    })();
    return () => { active = false; };
  }, []);

  async function accept(issue: Issue) {
    if (!groupId) return;
    const result = await communityPartnersApi.acceptTask({ issueId: issue.id, groupId });
    setMessage(result.ok ? `Work accepted: ${issue.title}.` : result.error.message);
  }
  async function refer(issue: Issue) {
    if (!groupId) return;
    if (!reasons[issue.id]?.trim()) { setMessage("Add a referral reason before routing the issue."); return; }
    if (targetType === "community_partner" && !targetGroupId) { setMessage("Choose an approved partner group for this referral."); return; }
    const result = await referCommunityIssueTo({ issueId: issue.id, groupId, reason: reasons[issue.id], targetType, ...(targetType === "community_partner" ? { targetGroupId } : {}) });
    setMessage(result.ok ? `Referral recorded for ${issue.title}; the task was released from your group.` : result.error.message);
  }
  async function collaborate(issue: Issue) {
    if (!groupId || !collaborationGroupId) { setMessage("Choose another approved partner group first."); return; }
    const note = reasons[issue.id]?.trim();
    if (!note) { setMessage("Add a note explaining the collaboration request."); return; }
    const result = await requestCommunityCollaboration({ issueId: issue.id, requestingGroupId: groupId, invitedGroupId: collaborationGroupId, note });
    setMessage(result.ok ? "Collaboration request sent to the selected partner group." : result.error.message);
  }

  return <main className="container" style={{ paddingTop: 42 }}>
    <div className="eyebrow">Community Partners · opportunity dashboard</div><h1>Find work your group can take on</h1>
    <p style={{ color: "var(--muted)" }}>Urgency, observations, and age are shown separately. Only approved group members can accept work, and the server checks group coverage before saving.</p>
    {message && <p role="status" className="card">{message}</p>}
    {!!groups.length && <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "end" }}>
      <label className="label">Acting group<select className="field" value={groupId} onChange={(event) => void loadGroup(event.target.value)}>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
      <label className="label">Search opportunities<input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Issue, description, or area"/></label>
      <label className="label">Referral destination<select className="field" value={targetType} onChange={(event) => setTargetType(event.target.value as typeof targetType)}><option value="official">Official action</option><option value="specialist">Specialist</option><option value="community_partner">Another partner</option></select></label>
      {targetType === "community_partner" && <label className="label">Partner group<select className="field" value={targetGroupId} onChange={(event) => setTargetGroupId(event.target.value)}><option value="">Choose group</option>{otherGroups.filter((group) => group.id !== groupId).map((group) => <option key={group.id} value={group.id}>{group.name} · {group.area}</option>)}</select></label>}
      <label className="label">Collaboration partner<select className="field" value={collaborationGroupId} onChange={(event) => setCollaborationGroupId(event.target.value)}><option value="">Choose another group</option>{otherGroups.filter((group) => group.id !== groupId).map((group) => <option key={group.id} value={group.id}>{group.name} · {group.area}</option>)}</select></label>
      <Link className="button secondary" href="/community-partners/dashboard/settings">Manage coverage and group settings</Link>
    </div>}
    <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
      {filtered.map((issue, index) => {
        const capabilityMatch = selectedGroup?.capabilities.includes(issue.category) ?? false;
        const excluded = coverage?.excludedWork.includes(issue.category) ?? false;
        const areaMatch = !selectedGroup || selectedGroup.area.toLowerCase().split(/[,;]|\s+and\s+/).some((area) => area.trim() && issue.location.toLowerCase().includes(area.trim()));
        const suitable = capabilityMatch && !excluded && areaMatch;
        return <article className="card" key={issue.id}>
          <div className="eyebrow">{issue.urgent ? "Urgent safety triage · " : ""}Opportunity {index + 1} · {issue.verificationCount} observations</div>
          <h2>{issue.title}</h2><p>{issue.description}</p>
          <p style={{ color: "var(--muted)" }}>📍 {issue.location} · {issue.category.replaceAll("_", " ")} · Official review: {issue.reviewStatus}</p>
          <p>{selectedGroup ? (suitable ? "Matches this group’s listed work coverage." : "This group may not be suitable; route it instead.") : "Select an approved group to act."}</p>
          <button className="button" disabled={!groupId || !suitable} onClick={() => void accept(issue)}>Accept suitable work</button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <input className="field" aria-label="Referral or collaboration reason" placeholder="Reason or collaboration note" value={reasons[issue.id] ?? ""} onChange={(event) => setReasons((old) => ({ ...old, [issue.id]: event.target.value }))}/>
            <button className="button secondary" disabled={!groupId} onClick={() => void refer(issue)}>Refer</button>
            <button className="button secondary" disabled={!groupId || !collaborationGroupId || collaborationGroupId === groupId} onClick={() => void collaborate(issue)}>Request collaboration</button>
          </div>
        </article>;
      })}
      {!filtered.length && <p className="card">No opportunities match this search.</p>}
    </div>
  </main>;
}
