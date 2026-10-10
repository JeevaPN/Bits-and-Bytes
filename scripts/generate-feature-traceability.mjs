import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checklist = fs.readFileSync(path.join(root, "docs", "FEATURE_CHECKLIST.md"), "utf8");
const rows = [];

for (const line of checklist.split(/\r?\n/)) {
  const match = line.match(/^\s*[-*]?\s*(CS-\d{3})\s*(?:\[([^\]]+)\])?\s*(.*)$/);
  if (!match) continue;
  const [, id, tags = "", description] = match;
  rows.push({ id, tags, description: description.trim() });
}

const evidence = new Map([
  ["CS-001", "PASS — app shell and public route exist; production build verified."],
  ["CS-002", "PASS — server-side auth helpers and protected-route middleware exist; unit-tested."],
  ["CS-003", "PARTIAL — Supabase auth flows exist; live provider configuration remains external."],
  ["CS-004", "PARTIAL — RBAC helpers and migration policies exist; live Supabase application is external."],
  ["CS-005", "PASS — shared validation and typed neighbourhood adapter are unit-tested."],
  ["CS-006", "PARTIAL — audit/auth hardening migration exists; full cross-domain audit coverage remains."],
  ["CS-096", "PASS — OSM map renders canonical project/issue adapter records with accessible list fallback."],
  ["CS-097", "PARTIAL — OSM attribution and configurable tile URL exist; production tile policy is external."],
]);

const output = [
  "# CivicSync feature traceability",
  "",
  "> Generated from docs/FEATURE_CHECKLIST.md. This is an evidence register, not a claim that the whole master scope is complete.",
  "> Run npm run generate:traceability after checklist changes, then npm run validate:traceability.",
  "",
  "| ID | Checklist tags | Evidence status | Feature |",
  "|---|---|---|---|",
  ...rows.map((row) => "| " + row.id + " | " + (row.tags || "—") + " | " + (evidence.get(row.id) ?? "NOT_IMPLEMENTED — no verified implementation evidence recorded in this repository yet.") + " | " + row.description + " |"),
  "",
];

fs.writeFileSync(path.join(root, "docs", "FEATURE_TRACEABILITY.md"), output.join("\n"), "utf8");
console.log("Generated traceability matrix for " + rows.length + " features.");
