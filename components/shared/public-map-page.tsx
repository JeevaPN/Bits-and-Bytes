import Link from "next/link";
import { OSMMapLoader } from "@/components/map/osm-map-loader";

export function MapPreview() {
  return <div className="card map-preview-card"><OSMMapLoader /></div>;
}

export function PublicMapPage() {
  return <div className="container public-map-page">
    <section className="public-map-layout"><div className="public-map-copy">
      <div className="eyebrow">Shared map · OpenStreetMap</div>
      <h1 className="workspace-display-title"><span>See your</span><em>neighbourhood.</em></h1>
      <p style={{ color: "var(--muted)" }}>Explore published CivicSync projects and community reports by location. OpenStreetMap supplies the basemap.</p>
      <div className="workspace-topic-buttons"><Link className="button secondary" href="/map">Open the live map →</Link><Link className="button secondary" href="/issues">Browse public reports →</Link></div>
    </div><MapPreview /></section>
  </div>;
}
