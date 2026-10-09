import React from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, ShieldCheck, Users } from "lucide-react";
import { projects, issues, groups } from "@/lib/domain/demo-data";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Hero Section */}
      <section
        style={{
          padding: "76px 0 82px",
          overflow: "hidden",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr .9fr",
            gap: 54,
            alignItems: "center",
          }}
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
            
            <h1
              style={{
                fontSize: "clamp(42px,6vw,68px)",
                lineHeight: 1.02,
                letterSpacing: "-.035em",
                maxWidth: 650,
                margin: "18px 0",
                color: "var(--text-primary)",
              }}
            >
              The work around you,{" "}
              <span style={{ color: "var(--accent)" }}>in the open.</span>
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
                href="/projects"
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
                Explore projects <ArrowUpRight size={17} />
              </Link>
              <Link
                className="button secondary"
                href="/neighbourhood/report"
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "10px 18px",
                  fontWeight: 500,
                }}
              >
                Report an issue
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
            <MapPreview />
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
      <section className="container animate-fade-up" style={{ paddingTop: 54, animationDelay: "200ms" }}>
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
            <h2 style={{ fontSize: 28, margin: "8px 0 0", color: "var(--text-primary)" }}>
              Your city, in progress
            </h2>
          </div>
          <Link href="/projects" style={{ color: "var(--accent)", fontWeight: 500 }}>
            All projects →
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
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
                {new Date(p.expectedEndDate).toLocaleDateString("en-IN", {
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
        className="container animate-fade-up"
        style={{
          animationDelay: "500ms",
          paddingTop: 58,
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 18,
        }}
      >
        <Stat
          icon={<MapPin size={20} />}
          value={`${projects.length} demo projects`}
          label="See planned and ongoing public works"
        />
        <Stat
          icon={<ShieldCheck size={20} />}
          value={`${issues.length} demo reports`}
          label="Community counts stay separate from official review"
        />
        <Stat
          icon={<Users size={20} />}
          value={`${groups.length} approved groups`}
          label="Local people working on local needs"
        />
      </section>

      {/* CTA Section */}
      <section className="container animate-fade-up" style={{ animationDelay: "600ms", paddingTop: 54, paddingBottom: 82 }}>
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
            <h2 style={{ fontSize: 24, margin: "8px 0", color: "var(--text-primary)" }}>
              Notice something? Let’s get it on the map.
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

function MapPreview() {
  return (
    <div
      style={{
        height: 280,
        borderRadius: 6,
        background: "var(--bg-base)",
        position: "relative",
        overflow: "hidden",
        border: "1px solid var(--border)",
        backgroundImage:
          "linear-gradient(32deg, transparent 46%, var(--bg-surface) 46%, var(--bg-surface) 51%, transparent 51%), linear-gradient(120deg, transparent 43%, var(--bg-surface) 43%, var(--bg-surface) 49%, transparent 49%), linear-gradient(75deg, transparent 66%, var(--bg-surface) 66%, var(--bg-surface) 70%, transparent 70%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "48%",
          top: "40%",
          background: "var(--text-primary)",
          color: "var(--bg-base)",
          borderRadius: 6,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          border: "1px solid var(--border)",
        }}
      >
        ● Lakeview Road
      </div>
      
      {/* Live Dot 1 */}
      <span
        className="live-dot"
        style={{
          position: "absolute",
          left: "26%",
          top: "70%",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "var(--accent)",
        }}
      />

      {/* Live Dot 2 */}
      <span
        className="live-dot"
        style={{
          position: "absolute",
          left: "71%",
          top: "23%",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "var(--text-secondary)",
          animationDelay: "1s",
        }}
      />

      {/* Restored Map Label */}
      <small
        style={{
          position: "absolute",
          bottom: 12,
          left: 14,
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
          padding: "4px 8px",
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          border: "1px solid var(--border)",
        }}
      >
        DEMO MAP · Chennai
      </small>
    </div>
  );
}