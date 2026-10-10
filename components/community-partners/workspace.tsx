"use client";

import Link from "next/link";
import { useState } from "react";
import { CommunityPartnersDashboard } from "@/components/community-partners/dashboard";
import { PartnerTaskBoard } from "@/components/community-partners/task-board";

export function CommunityPartnerWorkspace() {
  const [taskRevision, setTaskRevision] = useState(0);
  const [actingGroupId, setActingGroupId] = useState("");

  return <div className="workspace-actual-content partner-workspace">
    <div className="eyebrow">Social service groups</div>
    <h1 className="workspace-display-title"><span>Community Partner</span><em>workspace.</em></h1>
    <p className="partner-workspace-intro">Your group helps resolve issues reported by neighbours. Find suitable work, take responsibility for an issue, and follow it through to completion.</p>

    <nav className="partner-workflow-steps" aria-label="Group issue workflow">
      <a className="card" href="#partner-issues">
        <span className="eyebrow">01 · Find an issue</span>
        <h2>Take on local work</h2>
        <p>Browse listed issues and choose work your group can carry out.</p>
        <span className="partner-workflow-link">Find listed issues →</span>
      </a>
      <a className="card" href="#partner-tasks">
        <span className="eyebrow">02 · Carry out the work</span>
        <h2>Track our progress</h2>
        <p>Manage accepted issues and add progress notes and photos.</p>
        <span className="partner-workflow-link">View our group’s work →</span>
      </a>
      <a className="card" href="#partner-tasks">
        <span className="eyebrow">03 · Complete the issue</span>
        <h2>Submit completed work</h2>
        <p>Upload completion evidence for independent community confirmation.</p>
        <span className="partner-workflow-link">Submit completion evidence →</span>
      </a>
    </nav>

    <div className="partner-group-tools">
      <span>Manage your social service group</span>
      <Link href="/community-partners/dashboard/settings">Group details and members →</Link>
      <Link href="/community-partners/application-status">Group approval status →</Link>
    </div>

    <section id="partner-issues" className="partner-workspace-section" aria-label="Listed issues for community groups">
      <CommunityPartnersDashboard embedded onTaskAccepted={(groupId) => {
        setActingGroupId(groupId);
        setTaskRevision((revision) => revision + 1);
      }} />
    </section>
    <section id="partner-tasks" className="partner-workspace-section" aria-label="Group progress and completion">
      <PartnerTaskBoard embedded refreshKey={taskRevision} preferredGroupId={actingGroupId} />
    </section>
  </div>;
}
