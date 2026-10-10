import Image from "next/image";
import Link from "next/link";

type TopicCardProps = {
  title: string;
  description: string;
  links: Array<{ label: string; href: string }>;
  image?: { src: string; alt: string };
};

function TopicCard({ title, description, links, image }: TopicCardProps) {
  return <div className={image ? "card workspace-topic-card has-image" : "card workspace-topic-card"}>
    <div className="workspace-topic-copy">
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="workspace-topic-buttons">
        {links.map((link) => <Link className="button secondary" href={link.href} key={link.href}>{link.label} →</Link>)}
      </div>
    </div>
    {image && <div className="workspace-topic-image"><Image src={image.src} alt={image.alt} fill sizes="(max-width: 700px) 100vw, 42vw" /></div>}
  </div>;
}

export function WorkspaceDataPageStacks() {
  return <>
    <section className="workspace-deck-panel" aria-label="Public projects">
      <div className="container workspace-data-panel-content">
        <div className="eyebrow">Shared CivicSync page</div>
        <h1 className="workspace-display-title"><span>Public</span><em>projects.</em></h1>
        <p className="workspace-data-intro">Explore published projects, their schedules, and locations.</p>
        <TopicCard title="Explore public works" description="Open the project register and browse every published project in a regular vertical list." links={[
          { label: "Browse projects", href: "/projects" },
          { label: "Open project map", href: "/map" },
        ]} image={{ src: "/images/roadworks.webp", alt: "A road crew repairing a neighbourhood street" }} />
      </div>
    </section>
    <section className="workspace-deck-panel" aria-label="Public issue reports">
      <div className="container workspace-data-panel-content">
        <div className="eyebrow">Shared CivicSync page</div>
        <h1 className="workspace-display-title"><span>Public issue</span><em>reports.</em></h1>
        <p className="workspace-data-intro">Browse community observations and their separate official review status.</p>
        <TopicCard title="Explore issue reports" description="Open the full report list, search for an area, and read each report in a normal scrolling page." links={[
          { label: "Browse issue reports", href: "/issues" },
          { label: "Report an issue", href: "/neighbourhood/report" },
        ]} image={{ src: "/images/community-planning.webp", alt: "Neighbours reviewing a map and discussing a local project" }} />
      </div>
    </section>
  </>;
}

export function WorkspaceTopicCard(props: TopicCardProps) {
  return <TopicCard {...props} />;
}
