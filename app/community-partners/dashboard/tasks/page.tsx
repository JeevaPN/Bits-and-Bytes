"use client";

import { useEffect, useState } from "react";
import { communityPartnersApi, isCommunityPartnersDemo } from "@/lib/api/community-partners";
import { groups as demoGroups } from "@/lib/domain/demo-data";
import {
  listCommunityPublishedTaskUpdates, listCommunityTaskDetails, listMyCommunityGroups, listPrivateCommunityTaskEvents,
  publishCommunityTaskUpdate, unpublishCommunityTaskUpdate, withdrawPartnerTaskCompletion,
} from "@/lib/supabase/community-partners";
import type { PartnerGroup, PartnerPrivateTaskEvent, PartnerPublishedTaskUpdate, PartnerTaskDetail } from "@/lib/supabase/community-partners";

export default function CommunityPartnerTasks() {
  const [groups, setGroups] = useState<Array<PartnerGroup | (typeof demoGroups)[number]>>([]);
  const [groupId, setGroupId] = useState("");
  const [tasks, setTasks] = useState<PartnerTaskDetail[]>([]);
  const [events, setEvents] = useState<Record<string, PartnerPrivateTaskEvent[]>>({});
  const [published, setPublished] = useState<Record<string, PartnerPublishedTaskUpdate[]>>({});
  const [forms, setForms] = useState<Record<string, { note?: string; evidence?: File; publicNote?: string; publicEvidence?: File; withdrawReason?: string }>>({});
  const [message, setMessage] = useState("Loading partner task board…");

  async function reloadTasks(id: string) {
    if (!id || isCommunityPartnersDemo) { setTasks([]); return; }
    const result = await listCommunityTaskDetails(id);
    if (!result.ok) { setMessage(result.error.message); return; }
    setTasks(result.data);
    const eventResults = await Promise.all(result.data.map(async (task) => [task.id, await listPrivateCommunityTaskEvents(task.id), await listCommunityPublishedTaskUpdates(task.id)] as const));
    const loadedEvents: Record<string, PartnerPrivateTaskEvent[]> = {};
    const loadedPublic: Record<string, PartnerPublishedTaskUpdate[]> = {};
    for (const [taskId, eventResult, publicResult] of eventResults) {
      if (eventResult.ok) loadedEvents[taskId] = eventResult.data;
      if (publicResult.ok) loadedPublic[taskId] = publicResult.data;
    }
    setEvents(loadedEvents);
    setPublished(loadedPublic);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      if (isCommunityPartnersDemo) {
        const approved = demoGroups.filter((group) => group.approved);
        setGroups(approved); setMessage("Demo mode: task changes are not persisted.");
        return;
      }
      const result = await listMyCommunityGroups();
      if (!active) return;
      if (!result.ok) { setMessage(result.error.message); return; }
      const approved = result.data.filter((group) => group.approved);
      setGroups(approved);
      if (!approved.length) { setMessage("No approved partner group is linked to your account."); return; }
      setGroupId(approved[0].id); setMessage(""); await reloadTasks(approved[0].id);
    })();
    return () => { active = false; };
  }, []);

  function patchForm(taskId: string, patch: Partial<NonNullable<typeof forms[string]>>) {
    setForms((old) => ({ ...old, [taskId]: { ...old[taskId], ...patch } }));
  }
  async function saveProgress(task: PartnerTaskDetail) {
    const form = forms[task.id];
    if (!form?.note?.trim()) { setMessage("Add a progress note first."); return; }
    const result = await communityPartnersApi.postProgress({ taskId: task.id, note: form.note, evidence: form.evidence ?? null });
    setMessage(result.ok ? "Progress and private evidence saved." : result.error.message);
    if (result.ok) { patchForm(task.id, { note: "", evidence: undefined }); await reloadTasks(groupId); }
  }
  async function submitCompletion(task: PartnerTaskDetail) {
    const form = forms[task.id];
    if (!form?.note?.trim() || !form.evidence) { setMessage("Add a completion note and evidence image."); return; }
    const result = await communityPartnersApi.submitCompletion({ taskId: task.id, note: form.note, evidence: form.evidence });
    setMessage(result.ok ? "Completion claim submitted for independent community review." : result.error.message);
    if (result.ok) { patchForm(task.id, { note: "", evidence: undefined }); await reloadTasks(groupId); }
  }
  async function withdraw(task: PartnerTaskDetail) {
    const reason = forms[task.id]?.withdrawReason?.trim();
    if (!reason) { setMessage("Add a reason before withdrawing the claim."); return; }
    const result = await withdrawPartnerTaskCompletion(task.id, reason);
    setMessage(result.ok ? "Completion claim withdrawn. Work is back in progress." : result.error.message);
    if (result.ok) await reloadTasks(groupId);
  }
  async function publish(task: PartnerTaskDetail, event: PartnerPrivateTaskEvent) {
    const form = forms[task.id];
    if (!form?.publicNote?.trim()) { setMessage("Write a separate public summary before publishing an update."); return; }
    const result = await publishCommunityTaskUpdate({ groupId, taskId: task.id, eventId: event.id, note: form.publicNote, publicEvidence: form.publicEvidence });
    setMessage(result.ok ? "A public summary was published to the partner profile." : result.error.message);
    if (result.ok) patchForm(task.id, { publicNote: "", publicEvidence: undefined });
    if (result.ok) await reloadTasks(groupId);
  }
  async function unpublish(updateId: string) {
    const result = await unpublishCommunityTaskUpdate(updateId);
    setMessage(result.ok ? "Public update removed from the profile. Any issued evidence link may remain valid briefly." : result.error.message);
    if (result.ok) await reloadTasks(groupId);
  }

  return <main className="container" style={{ paddingTop: 42 }}>
    <div className="eyebrow">Community Partners · task board</div><h1>Partner work board</h1>
    <p style={{ color: "var(--muted)" }}>Partner work stays separate from official issue status. Private evidence is restricted to group members; public summaries and image copies require a separate explicit action.</p>
    {message && <p role="status" className="card">{message}</p>}
    {!!groups.length && <label className="label">Acting group<select className="field" value={groupId} onChange={(event) => { setGroupId(event.target.value); void reloadTasks(event.target.value); }}>
      {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
    </select></label>}
    {!tasks.length && !isCommunityPartnersDemo && <p className="card">No partner tasks are recorded for this group yet.</p>}
    {tasks.map((task) => <article className="card" key={task.id} style={{ marginTop: 14 }}>
      <div className="eyebrow">{task.status.replaceAll("_", " ")} · {task.urgent ? "Urgent · " : ""}{task.category.replaceAll("_", " ")}</div>
      <h2>{task.title}</h2><p>{task.description}</p><p>📍 {task.location} · Official issue review: {task.reviewStatus}</p>
      {task.status !== "awaiting_confirmation" && ["adopted", "in_progress", "reopened"].includes(task.status) && <>
        <label className="label">Progress note<textarea className="field" value={forms[task.id]?.note ?? ""} onChange={(event) => patchForm(task.id, { note: event.target.value })}/></label>
        <label className="label">Private progress evidence<input className="field" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => patchForm(task.id, { evidence: event.target.files?.[0] })}/></label>
        <button className="button secondary" onClick={() => void saveProgress(task)}>Save progress</button>
        <label className="label" style={{ marginTop: 16 }}>Completion note<textarea className="field" value={forms[task.id]?.note ?? ""} onChange={(event) => patchForm(task.id, { note: event.target.value })}/></label>
        <label className="label">Completion evidence<input className="field" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => patchForm(task.id, { evidence: event.target.files?.[0] })}/></label>
        <button className="button" onClick={() => void submitCompletion(task)}>Submit completion claim</button>
      </>}
      {task.status === "awaiting_confirmation" && <>
        <p>Waiting for independent community confirmation. Partner members cannot confirm their own completion. The issue remains under its separate official review process.</p>
        <label className="label">Reason for withdrawing this claim<textarea className="field" value={forms[task.id]?.withdrawReason ?? ""} onChange={(event) => patchForm(task.id, { withdrawReason: event.target.value })}/></label>
        <button className="button secondary" onClick={() => void withdraw(task)}>Withdraw completion claim</button>
      </>}
      <h3 style={{ marginTop: 22 }}>Private group activity</h3>
      {(events[task.id] ?? []).map((event) => <div key={event.id} style={{ borderTop: "1px solid var(--border)", padding: "10px 0" }}>
        <strong>{event.eventType.replaceAll("_", " ")}</strong><p>{event.note}</p>
        {event.evidenceUrl && <p><a href={event.evidenceUrl} target="_blank" rel="noreferrer">Open private evidence (5 minute link)</a></p>}
        <label className="label">Public summary<textarea className="field" maxLength={600} value={forms[task.id]?.publicNote ?? ""} onChange={(event) => patchForm(task.id, { publicNote: event.target.value })}/></label>
        <label className="label">Optional public evidence copy<input className="field" type="file" accept="image/*" onChange={(event) => patchForm(task.id, { publicEvidence: event.target.files?.[0] })}/><small>Publishing creates a separate resized image copy with metadata removed. Approved public profiles can retrieve a five-minute evidence link; private originals remain restricted to group members.</small></label>
        <button className="button secondary" onClick={() => void publish(task, event)}>Publish this summary</button>
      </div>)}
      {!events[task.id]?.length && <p>No private progress events are recorded yet.</p>}
      <h3 style={{ marginTop: 20 }}>Published profile updates</h3>
      {(published[task.id] ?? []).map((item) => <p key={item.id}>{item.note}{item.hasEvidence ? " · evidence attached" : ""} <button className="button secondary" onClick={() => void unpublish(item.id)}>Remove from public profile</button></p>)}
      {!published[task.id]?.length && <p>No task updates have been published.</p>}
    </article>)}
  </main>;
}
