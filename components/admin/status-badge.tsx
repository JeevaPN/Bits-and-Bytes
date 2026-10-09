const colors: Record<string, { bg: string; fg: string }> = {
  planned: { bg: "#edf0ff", fg: "#4355a4" }, active: { bg: "#e4f4e9", fg: "#267247" }, delayed: { bg: "#fff1d9", fg: "#966118" }, completed: { bg: "#e6f3f0", fg: "#1c6c5c" }, cancelled: { bg: "#f1eeee", fg: "#675e5e" },
  unverified: { bg: "#fff1d9", fg: "#966118" }, accepted: { bg: "#e4f4e9", fg: "#267247" }, rejected: { bg: "#fbe7e5", fg: "#9a4035" }, referred: { bg: "#edf0ff", fg: "#4355a4" }, more_info: { bg: "#eaf0fa", fg: "#365879" },
};
export function StatusBadge({ status, label }: { status: string; label?: string }) { const color = colors[status] ?? { bg: "#edf1ed", fg: "#53645a" }; return <span style={{ display: "inline-block", padding: "5px 9px", borderRadius: 99, background: color.bg, color: color.fg, fontSize: 12, fontWeight: 700 }}>{label ?? status.replaceAll("_", " ")}</span>; }
