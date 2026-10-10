import type { Role } from "@/lib/domain/types";
import { PublicIssuesPage } from "@/components/shared/public-issues-page";
import { PublicMapPage } from "@/components/shared/public-map-page";
import { PublicProjectsPage } from "@/components/shared/public-projects-page";
import { PublicSponsorshipPage } from "@/components/shared/public-sponsorship-page";
import { WorkspaceTopicCard } from "@/components/shared/workspace-data-page-stacks";
import { CommunityPartnerWorkspace } from "@/components/community-partners/workspace";

const adminLinks = [
  ["Overview", "/admin"], ["Projects", "/admin/projects"], ["Issue review", "/admin/issues"],
  ["Coordination", "/admin/coordination"], ["Restoration", "/admin/restoration"], ["Group approvals", "/admin/groups"],
] as const;
const neighbourhoodLinks = [
  ["Home", "/neighbourhood"], ["Report an issue", "/neighbourhood/report"],
  ["Community groups", "/neighbourhood/groups"], ["Public issues", "/issues"], ["Project map", "/map"],
] as const;
function WorkspaceContent({ role }: { role: Role }) {
  if (role === "group") return <CommunityPartnerWorkspace />;
  const description = role === "admin"
    ? "Choose an operations area. Shared projects, reports, the map, and sponsorship are all included above."
    : "Choose a neighbourhood activity. Shared projects, reports, the map, and sponsorship are all included above.";
  const links = role === "admin" ? adminLinks : neighbourhoodLinks;
  const sharedSections: Record<string, string> = {
    "/issues": "public-issues",
    "/map": "project-map",
  };

  return <div className="workspace-actual-content">
    <div className="eyebrow">Your workspace</div>
    <h1 className="workspace-display-title">
      <span>{role === "admin" ? "Admin" : "Neighbourhood"}</span>
      <em>workspace.</em>
    </h1>
    <WorkspaceTopicCard
      title="Workspace sections"
      description={description}
      links={links.map(([label, href]) => ({ label, href: sharedSections[href] ? `#${sharedSections[href]}` : href }))}
      image={{
        src: role === "admin" ? "/images/roadworks.webp" : "/images/community-volunteers-enhanced.png",
        alt: role === "admin" ? "A road crew working on a public street" : "Neighbours volunteering in their community",
      }}
    />
  </div>;
}

export function WorkspacePageDeck({ role }: { role: Role }) {
  return (
    <main className="workspace-scroll-deck" aria-label="CivicSync">
      <section id="public-projects" className="workspace-deck-panel" aria-label="Public projects"><PublicProjectsPage /></section>
      <section id="public-issues" className="workspace-deck-panel" aria-label="Public issue reports"><PublicIssuesPage /></section>
      <section id="project-map" className="workspace-deck-panel" aria-label="Project map"><PublicMapPage /></section>
      <section id="sponsorship" className="workspace-deck-panel" aria-label="Community sponsorship"><PublicSponsorshipPage /></section>
      <section id="workspace" className="workspace-deck-panel" aria-label="Your workspace"><WorkspaceContent role={role} /></section>
    </main>
  );
}
