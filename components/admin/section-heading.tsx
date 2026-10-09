import type { ReactNode } from "react";
export function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 22 }}><div><div className="eyebrow">{eyebrow}</div><h2 style={{ margin: "7px 0", fontSize: 28 }}>{title}</h2><p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>{description}</p></div>{action}</div>;
}
