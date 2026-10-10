import React from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceRole } from "@/lib/auth/authorization";
import { MapPreview as LiveMapPreview } from "@/components/shared/public-map-page";
import { workspaceHome } from "@/lib/auth/workspace-access";

export default async function Home() {
  const role = await getCurrentWorkspaceRole();
  // The root route is always the public landing page. Workspaces have their own stable routes.
  const client = await createClient();
  const [projectResult, issueResult, groupResult] = client ? await Promise.all([
    client.from("projects").select("id,slug,title,department,location,status,expected_end").eq("is_published", true).order("updated_at", { ascending: false }).limit(3),
    client.from("public_issue_feed").select("id", { count: "exact", head: true }),
    client.from("public_community_groups").select("id", { count: "exact", head: true }),
  ]) : [{ data: null, count: 0, error: null }, { data: null, count: 0, error: null }, { data: null, count: 0, error: null }];
  const projects = projectResult.data ?? [];

  return (
    <main className="home-scroll-pages">
      {/* Hero Section */}
      <section
        className="home-snap-section home-hero-section"
        style={{
          overflow: "hidden",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="container home-hero-grid"
        >
          <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
            <div
              className="eyebrow"
              style={{
                color: "var(--accent)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontSize: 12,
              }}
            >
              A clearer view of your neighbourhood
            </div>
            
            <h1 className="home-hero-title">
              The work around you,
              <span className="home-hero-accent">in the open.</span>
            </h1>
            <p
              style={{
                fontSize: 18,
                lineHeight: 1.7,
                color: "var(--text-secondary)",
                maxWidth: 550,
              }}
            >
              See what’s being built, flag what needs fixing, and help local
              groups make a difference — all in one place.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
              <Link
                className="button"
                href={role ? workspaceHome(role) : "/projects"}
                style={{
                  background: "var(--accent)",
                  color: "#FFFFFF",
                  border: "1px solid var(--accent)",
                  borderRadius: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 18px",
                  fontWeight: 500,
                }}
              >
                {role ? "Open your workspace" : "Explore projects"} <ArrowUpRight size={17} />
              </Link>
              <Link
                className="button secondary"
                href={role === "admin" || role === "group" ? "/map" : "/neighbourhood/report"}
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "10px 18px",
                  fontWeight: 500,
                }}
              >
                {role === "admin" || role === "group" ? "Explore the map" : "Report an issue"}
              </Link>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 18 }}>
              Open to everyone · No account needed to browse
            </p>
          </div>
          
          <div
            className="card animate-fade-up"
            style={{
              animationDelay: "150ms",
              padding: 12,
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
            }}
          >
            <LiveMapPreview />
            <div
              style={{
                padding: "16px 12px 4px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  Your neighbourhood at a glance
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                  Projects, reports and community action
                </div>
              </div>
              <Link href="/map" style={{ color: "var(--accent)", fontWeight: 500 }}>
                Explore map →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Projects Section */}
      <section className="container home-snap-section home-projects-section animate-fade-up" style={{ animationDelay: "200ms" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <div
              className="eyebrow"
              style={{
                color: "var(--accent)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontSize: 12,
              }}
            >
              The latest
            </div>
            <h2 className="home-section-title">
              Your city, <span className="home-serif-accent">in progress</span>
            </h2>
          </div>
          <Link href="/projects" style={{ color: "var(--accent)", fontWeight: 500 }}>
            All projects →
          </Link>
        </div>
        <div className="home-project-grid" style={{ display: "grid", gap: 16 }}>
          {projects.map((p, index) => (
            <Link
              className="card animate-fade-up"
              href={`/projects/${p.slug}`}
              key={p.id}
              style={{
                animationDelay: `${250 + (index * 100)}ms`,
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 20,
                textDecoration: "none",
                display: "block",
              }}
            >
              <span
                className="eyebrow"
                style={{ color: "var(--accent)", fontSize: 11, fontWeight: 600 }}
              >
                {p.status} · {p.department}
              </span>
              <h3 style={{ color: "var(--text-primary)", margin: "8px 0", fontSize: 16 }}>
                {p.title}
              </h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 16px" }}>
                {p.location}
              </p>
              <small style={{ color: "var(--text-secondary)" }}>
                Expected{" "}
                {new Date(p.expected_end).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })}
              </small>
            </Link>
          ))}
          <Link
            className="card animate-fade-up"
            href="/community-partners"
            style={{
              animationDelay: `${250 + (projects.length * 100)}ms`,
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 20,
              textDecoration: "none",
              display: "block",
            }}
          >
            <span
              className="eyebrow"
              style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 600 }}
            >
              Community-led
            </span>
            <h3 style={{ color: "var(--text-primary)", margin: "8px 0", fontSize: 16 }}>
              Good things grow together
            </h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 16px" }}>
              Meet local groups taking on the work that makes a neighbourhood feel
              like home.
            </p>
            <span style={{ color: "var(--accent)", fontWeight: 500 }}>
              Meet the groups →
            </span>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section
        className="container home-snap-section home-stats-section animate-fade-up"
        style={{
          animationDelay: "500ms",
        }}
      >
        <Stat
          icon={<MapPin size={20} />}
          value={`${projects.length} featured projects`}
          label="See planned and ongoing public works"
        />
        <Stat
          icon={<ShieldCheck size={20} />}
          value={`${issueResult.count ?? 0} public reports`}
          label="Community counts stay separate from official review"
        />
        <Stat
          icon={<Users size={20} />}
          value={`${groupResult.count ?? 0} approved groups`}
          label="Local people working on local needs"
        />
      </section>

      {/* CTA Section */}
      <section className="container home-snap-section home-cta-section animate-fade-up" style={{ animationDelay: "600ms" }}>
        <div
          className="card"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
            padding: 30,
            borderRadius: 8,
          }}
        >
          <div>
            <div
              style={{
                color: "var(--accent)",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: ".1em",
              }}
            >
              Make your corner better
            </div>
            <h2 className="home-cta-title">
              Notice something? <span className="home-serif-accent">Let’s get it on the map.</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>
              A clear report helps neighbours and civic teams understand what’s
              happening.
            </p>
          </div>
          <Link
            className="button"
            style={{
              background: "var(--accent)",
              color: "#FFFFFF",
              border: "1px solid var(--accent)",
              padding: "10px 20px",
              borderRadius: 6,
              fontWeight: 500,
            }}
            href="/neighbourhood/report"
          >
            Make a report →
          </Link>
        </div>
      </section>
    </main>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 13,
        alignItems: "flex-start",
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        padding: 20,
        borderRadius: 8,
      }}
    >
      <span style={{ color: "var(--accent)", display: "flex", marginTop: 2 }}>
        {icon}
      </span>
      <div>
        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{value}</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
          {label}
        </div>
      </div>
    </div>
  );
}