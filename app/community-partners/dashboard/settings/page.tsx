"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommunityGroup, IssueCategory } from "@/lib/domain/types";
import { communityPartnersApi } from "@/lib/api/community-partners";
import {
  acceptCommunityGroupInvitation, createCommunityGroupInvitation, getCommunityGroupWorkCoverage,
  listCommunityCollaborations, listCommunityGroupInvitations, listCommunityPartnerGroupMembers,
  listMyCommunityGroupInvitations, listMyCommunityGroups, removeCommunityPartnerGroupMember,
  respondCommunityCollaboration, revokeCommunityGroupInvitation, updateCommunityGroupWorkCoverage,
} from "@/lib/supabase/community-partners";
import type { PartnerCollaborationRequest, PartnerGroup, PartnerGroupMember, PartnerInvitation, PartnerCoverage } from "@/lib/supabase/community-partners";

const categories: IssueCategory[] = ["pothole", "damaged_road", "fallen_tree", "streetlight", "open_drain", "leak", "garbage", "blocked_footpath", "other"];

export default function CommunityPartnerSettingsPage() {
  const [groups, setGroups] = useState<PartnerGroup[]>([]);
  const [groupId, setGroupId] = useState("");
  const [coverage, setCoverage] = useState<PartnerCoverage | null>(null);
  const [members, setMembers] = useState<PartnerGroupMember[]>([]);
  const [invites, setInvites] = useState<Array<{ id: string; email: string; permission: "editor" | "viewer"; status: string; expiresAt: string }>>([]);
  const [myInvites, setMyInvites] = useState<PartnerInvitation[]>([]);
  const [collaborations, setCollaborations] = useState<PartnerCollaborationRequest[]>([]);
  const [description, setDescription] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [contact, setContact] = useState("");
  const [eligibleWork, setEligibleWork] = useState<IssueCategory[]>([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"editor" | "viewer">("editor");
  const [message, setMessage] = useState("Loading group settings…");

  const loadGroupData = useCallback(async (id: string, groupOverride?: CommunityGroup) => {
    const selected = groupOverride;
    if (selected) { setDescription(selected.description); setServiceArea(selected.area); setContact(selected.contact); setEligibleWork(selected.capabilities); }
    const [coverageResult, memberResult, inviteResult, collaborationResult] = await Promise.all([
      getCommunityGroupWorkCoverage(id), listCommunityPartnerGroupMembers(id), listCommunityGroupInvitations(id), listCommunityCollaborations(id),
    ]);
    if (coverageResult.ok) setCoverage(coverageResult.data); else setCoverage(null);
    if (memberResult.ok) setMembers(memberResult.data);
    if (inviteResult.ok) setInvites(inviteResult.data);
    if (collaborationResult.ok) setCollaborations(collaborationResult.data);
    const failure = [coverageResult, memberResult, inviteResult, collaborationResult].find((result) => !result.ok);
    if (failure && !failure.ok) setMessage(failure.error.message);
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([listMyCommunityGroups(), listMyCommunityGroupInvitations()]).then(async ([groupResult, inviteResult]) => {
      if (!active) return;
      if (groupResult.ok) {
        const approved = groupResult.data.filter((group) => group.approved);
        setGroups(approved);
        if (approved.length) { setMessage(""); setGroupId(approved[0].id); await loadGroupData(approved[0].id, approved[0]); }
        else setMessage("");
      } else setMessage(groupResult.error.message);
      if (inviteResult.ok) setMyInvites(inviteResult.data);
    });
    return () => { active = false; };
  }, [loadGroupData]);

  async function refresh() { if (groupId) await loadGroupData(groupId); }

  return <main className="container" style={{ paddingTop: 40, maxWidth: 900 }}>
    <div className="eyebrow">Community Partners</div><h1>Group settings and coordination</h1>
    {message && <p role="status" className="card">{message}</p>}
    <section className="card" style={{ marginBottom: 16 }}><h2>Invitations to you</h2>
      {!myInvites.length && <p>No pending invitations.</p>}
      {myInvites.map((invite) => <p key={invite.id}>{invite.groupName} invited you as {invite.permission}. <button className="button" onClick={async () => { const result = await acceptCommunityGroupInvitation(invite.id); setMessage(result.ok ? "Invitation accepted." : result.error.message); const updated = await listMyCommunityGroupInvitations(); if (updated.ok) setMyInvites(updated.data); }}>Accept</button></p>)}
    </section>
    {!groups.length && !myInvites.length && <p className="card">Sign in as an approved partner owner or member to manage group settings. New partner applications must be approved first.</p>}
    {!!groups.length && <>
      <label className="label">Your approved group<select className="field" value={groupId} onChange={(event) => { const id = event.target.value; setGroupId(id); void loadGroupData(id, groups.find((group) => group.id === id)); }}>
        {groups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}
      </select></label>
      <section className="card" style={{ marginTop: 16 }}><h2>Public group profile</h2>
        <label className="label">Description<textarea className="field" value={description} onChange={(event) => setDescription(event.target.value)}/></label>
        <label className="label">Service area<input className="field" value={serviceArea} onChange={(event) => setServiceArea(event.target.value)}/><small>Use comma or semicolon separated area names; acceptance checks issue location text against these names.</small></label>
        <label className="label">Contact email<input className="field" type="email" value={contact} onChange={(event) => setContact(event.target.value)}/></label>
        <fieldset><legend>Eligible work categories</legend>{categories.map((item) => <label key={item} style={{ display: "inline-flex", gap: 6, margin: "6px 12px 6px 0" }}>
          <input type="checkbox" checked={eligibleWork.includes(item)} onChange={(event) => setEligibleWork((old) => event.target.checked ? [...old, item] : old.filter((value) => value !== item))}/>{item.replaceAll("_", " ")}
        </label>)}</fieldset>
        <button className="button" onClick={async () => { const result = await communityPartnersApi.updateProfile({ groupId, description, area: serviceArea, contact, capabilities: eligibleWork }); setMessage(result.ok ? "Partner profile updated." : result.error.message); }}>Save profile</button>
      </section>
      <section className="card" style={{ marginTop: 16 }}><h2>Work coverage exclusions</h2>
        {coverage && <><p>Service area: {coverage.serviceArea}</p><p>Eligible work: {coverage.eligibleWork.map((item) => item.replaceAll("_", " ")).join(", ")}</p>
          <p>Application limitations: {coverage.limitations || "None provided."}</p>
          <fieldset><legend>Categories this group does not accept</legend>{categories.map((item) => <label key={item} style={{ display: "inline-flex", gap: 6, margin: "6px 12px 6px 0" }}>
            <input type="checkbox" checked={coverage.excludedWork.includes(item)} onChange={(event) => setCoverage((old) => old ? ({ ...old, excludedWork: event.target.checked ? [...old.excludedWork, item] : old.excludedWork.filter((value) => value !== item) }) : old)}/>{item.replaceAll("_", " ")}
          </label>)}</fieldset><button className="button" onClick={async () => { const result = await updateCommunityGroupWorkCoverage(groupId, coverage.excludedWork); setMessage(result.ok ? "Work coverage saved." : result.error.message); }}>Save exclusions</button>
        </>}
      </section>
      <section className="card" style={{ marginTop: 16 }}><h2>Members and invitations</h2>
        <ul>{members.map((member) => <li key={member.userId}>{member.userId} · {member.permission} {member.permission !== "owner" && <button className="button secondary" onClick={async () => { const result = await removeCommunityPartnerGroupMember(groupId, member.userId); setMessage(result.ok ? "Member removed." : result.error.message); await refresh(); }}>Remove</button>}</li>)}</ul>
        <form onSubmit={async (event) => { event.preventDefault(); const result = await createCommunityGroupInvitation(groupId, email, permission); setMessage(result.ok ? "Invitation created. The invitee can accept it after signing in with that email." : result.error.message); if (result.ok) setEmail(""); await refresh(); }} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <input className="field" type="email" required placeholder="Member email" value={email} onChange={(event) => setEmail(event.target.value)}/>
          <select className="field" value={permission} onChange={(event) => setPermission(event.target.value as "editor" | "viewer")}><option value="editor">Editor</option><option value="viewer">Viewer</option></select>
          <button className="button">Invite member</button>
        </form>
        <h3>Invitations sent</h3><ul>{invites.map((invite) => <li key={invite.id}>{invite.email} · {invite.permission} · {invite.status} {invite.status === "pending" && <button className="button secondary" onClick={async () => { const result = await revokeCommunityGroupInvitation(invite.id); setMessage(result.ok ? "Invitation revoked." : result.error.message); await refresh(); }}>Revoke</button>}</li>)}</ul>
      </section>
      <section className="card" style={{ marginTop: 16 }}><h2>Collaboration requests</h2>
        {!collaborations.length && <p>No requests yet.</p>}
        {collaborations.map((item) => <article key={item.id} style={{ borderTop: "1px solid var(--border)", padding: "12px 0" }}><p>{item.note}</p><p>Status: {item.status} · Issue {item.issueId}</p>
          {item.invitedGroupId === groupId && item.status === "pending" && <><button className="button" onClick={async () => { const result = await respondCommunityCollaboration(item.id, "accepted"); setMessage(result.ok ? "Collaboration accepted." : result.error.message); await refresh(); }}>Accept</button><button className="button secondary" style={{ marginLeft: 8 }} onClick={async () => { const result = await respondCommunityCollaboration(item.id, "declined"); setMessage(result.ok ? "Collaboration declined." : result.error.message); await refresh(); }}>Decline</button></>}
        </article>)}
      </section>
    </>}
  </main>;
}
