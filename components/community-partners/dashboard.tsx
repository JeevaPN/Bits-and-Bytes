"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Issue, CommunityGroup } from "@/lib/domain/types";
import { communityPartnersApi } from "@/lib/api/community-partners";
import {
  getCommunityGroupWorkCoverage, listMyCommunityGroups, listPublicCommunityGroups,
  referCommunityIssueTo, requestCommunityCollaboration,
} from "@/lib/supabase/community-partners";
import type { PartnerCoverage, PartnerGroup } from "@/lib/supabase/community-partners";

export function CommunityPartnersDashboard({ embedded = false, onTaskAccepted }: { embedded?: boolean; onTaskAccepted?: (groupId: string) => void }) {
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
  const [acceptingIssueId, setAcceptingIssueId] = useState<string | null>(null);
  const [acceptedIssueIds, setAcceptedIssueIds] = useState<string[]>([]);
  const selectedGroup = groups.find((group) => group.id === groupId);
  const orderedIssues = useMemo(() => [...issues].sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.verificationCount - a.verificationCount || a.createdAt.localeCompare(b.createdAt)), [issues]);
  const filtered = orderedIssues.filter((issue) => !query || `${issue.title} ${issue.description} ${issue.location}`.toLowerCase().includes(query.toLowerCase()));

  async function loadGroup(id: string) {
    setGroupId(id);
    setAcceptedIssueIds([]);
    const result = await getCommunityGroupWorkCoverage(id);
    setCoverage(result.ok ? result.data : null);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      const [opportunities, groupResult, directory] = await Promise.all([
        communityPartnersApi.listOpportunities({ page: 1, pageSize: 100 }),
        listMyCommunityGroups(),
        listPublicCommunityGroups(),
      ]);
      if (!active) return;
      if (opportunities.ok) setIssues(opportunities.data.items); else setMessage(opportunities.error.message);
      const ownGroups = groupResult?.ok ? groupResult.data.filter((group) => group.approved) : [];
      setGroups(ownGroups);
      if (ownGroups.length) { setGroupId(ownGroups[0].id); await loadGroup(ownGroups[0].id); }
      if (directory?.ok) setOtherGroups(directory.data.items);
      const failure = !opportunities.ok ? opportunities.error.message : groupResult && !groupResult.ok ? groupResult.error.message : null;
      setMessage(failure ?? (ownGroups.length ? "" : "Register your social service group or join an existing group. Once approved, your group can take on listed issues and submit completed work."));
    })();
    return () => { active = false; };
  }, []);

  async function accept(issue: Issue) {
    if (!groupId || acceptingIssueId) return;
    setAcceptingIssueId(issue.id);
    try {
      const result = await communityPartnersApi.acceptTask({ issueId: issue.id, groupId });
      setMessage(result.ok ? `Your group has taken on ${issue.title}. Open your group’s work to update progress and submit completion evidence.` : result.error.message);
      if (result.ok) {
        setAcceptedIssueIds((previous) => [...previous, issue.id]);
        onTaskAccepted?.(groupId);
      }
    } catch {
      setMessage("This issue could not be taken on. Please try again.");
    } finally {
      setAcceptingIssueId(null);
    }
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

  return <div className={embedded ? "partner-issue-board" : "container"} style={{ paddingTop: embedded ? 0 : 42 }}>
    <div className="eyebrow">Community Partners · listed issues</div>{embedded ? <h2>Issues your group can take on</h2> : <h1>Issues your group can take on</h1>}
    <p style={{ color: "var(--muted)" }}>Choose a local issue that matches your social service group’s skills and service area. Take it on, carry out the work, and share evidence when it is complete.</p>
    {message && <p role="status" className="card">{message}</p>}
    {!groups.length && <div className="workspace-topic-buttons">
      <Link className="button secondary" href="/community-partners/apply">Register our group</Link>
      <Link className="button secondary" href="/community-partners/dashboard/settings">Join an existing group</Link>
      <Link className="button secondary" href="/community-partners/application-status">Check group approval</Link>
    </div>}
    {!!groups.length && <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "end" }}>
      <label className="label">Acting group<select className="field" value={groupId} onChange={(event) => void loadGroup(event.target.value)}>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
      <label className="label">Search listed issues<input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Issue, description, or area"/></label>
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
          <div className="eyebrow">{issue.urgent ? "Urgent · " : ""}Listed issue {index + 1} · {issue.verificationCount} observations</div>
          <h2>{issue.title}</h2><p>{issue.description}</p>
          <p style={{ color: "var(--muted)" }}>📍 {issue.location} · {issue.category.replaceAll("_", " ")} · Official review: {issue.reviewStatus}</p>
          <p>{selectedGroup ? (suitable ? "Matches this group’s listed work coverage." : "This group may not be suitable; route it instead.") : "Select an approved group to act."}</p>
          <button className="button" disabled={!groupId || !suitable || acceptingIssueId !== null || acceptedIssueIds.includes(issue.id)} onClick={() => void accept(issue)}>{acceptedIssueIds.includes(issue.id) ? "Taken on by our group" : acceptingIssueId === issue.id ? "Taking on issue…" : "Take on this issue"}</button>
          {acceptedIssueIds.includes(issue.id) && <p><Link href={embedded ? "#partner-tasks" : "/community-partners/dashboard/tasks"} style={{ color: "var(--accent)" }}>Update progress and submit completed work →</Link></p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <input className="field" aria-label="Referral or collaboration reason" placeholder="Reason or collaboration note" value={reasons[issue.id] ?? ""} onChange={(event) => setReasons((old) => ({ ...old, [issue.id]: event.target.value }))}/>
            <button className="button secondary" disabled={!groupId} onClick={() => void refer(issue)}>Refer</button>
            <button className="button secondary" disabled={!groupId || !collaborationGroupId || collaborationGroupId === groupId} onClick={() => void collaborate(issue)}>Request collaboration</button>
          </div>
        </article>;
      })}
      {!filtered.length && <p className="card">No listed issues match this search.</p>}
    </div>
  </div>;
}
