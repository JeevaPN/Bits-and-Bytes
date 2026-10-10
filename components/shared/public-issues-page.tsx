import { IssueBrowser } from "@/components/neighbourhood/issue-browser";

export function PublicIssuesPage() {
  return (
    <div className="container" style={{ paddingTop: 42 }}>
      <div className="eyebrow">Shared public information</div>
      <h1>Public issue reports</h1>
      <p style={{ color: "var(--muted)", maxWidth: 680 }}>
        Browse and search reported neighbourhood issues. Community observations are separate from official review and do not determine an issue’s resolution.
      </p>
      <div style={{ marginTop: 32 }}><IssueBrowser detailBasePath="/issues" /></div>
    </div>
  );
}
