"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { groups } from "@/lib/domain/demo-data";

export function PublicSponsorshipPage() {
  const [pledge, setPledge] = useState("");
  return (
    <div className="container" style={{ paddingTop: 42 }}>
      <section className="sponsorship-hero-layout">
        <div>
          <div className="eyebrow">Simulated support · no payment</div>
          <h1 className="workspace-display-title"><span>Back the</span><em>neighbours.</em></h1>
          <p style={{ color: "var(--muted)", maxWidth: 650, lineHeight: 1.6 }}>Learn about local groups before pledging. This is a hackathon simulation only: no money is transferred or collected.</p>
        </div>
        <div className="sponsorship-hero-image">
          <Image src="/images/community-volunteers-enhanced.png" alt="Local volunteers gathered with young saplings for a neighbourhood planting effort" fill sizes="(max-width: 700px) 100vw, 48vw" />
        </div>
      </section>
      <div className="public-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginTop: 24 }}>
        {groups.map((group) => (
          <article className="card" key={group.id}>
            <div className="eyebrow">Approved group · demo campaign</div>
            <h2>{group.name}</h2>
            <p>{group.description}</p>
            <p><strong>Goal:</strong> ₹25,000 simulated for neighbourhood materials</p>
            <Link style={{ color: "var(--green)" }} href={`/community-partners/${group.slug}`}>View group work history →</Link>
            <div style={{ marginTop: 14 }}><button className="button" onClick={() => setPledge(group.name)}>Pledge ₹500 · simulated</button></div>
          </article>
        ))}
      </div>
      {pledge && <p role="status" className="card" style={{ marginTop: 20, color: "var(--green)" }}>Demo pledge recorded in this preview for {pledge}. No real payment was made.</p>}
    </div>
  );
}
