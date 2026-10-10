import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const files = [".env.local", ".env"];
const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const optional = ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_OSM_TILE_URL", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "RESEND_API_KEY", "RESEND_FROM_EMAIL"];
const values = {};
for (const file of files) { const full = path.join(root, file); if (!fs.existsSync(full)) continue; for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) { const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/); if (match && values[match[1]] === undefined) values[match[1]] = match[2].replace(/^['"]|['"]$/g, ""); } }
const missing = required.filter((name) => !values[name]);
const malformed = [];
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 20) malformed.push("Node.js 20+");
if (values.NEXT_PUBLIC_SUPABASE_URL && !/^https:\/\//.test(values.NEXT_PUBLIC_SUPABASE_URL) && !/^http:\/\/(127\.0\.0\.1|localhost)/.test(values.NEXT_PUBLIC_SUPABASE_URL)) malformed.push("NEXT_PUBLIC_SUPABASE_URL");
if (values.NEXT_PUBLIC_SITE_URL && !/^https?:\/\//.test(values.NEXT_PUBLIC_SITE_URL)) malformed.push("NEXT_PUBLIC_SITE_URL");
console.log(`Environment files detected: ${files.filter((file) => fs.existsSync(path.join(root, file))).join(", ") || "none"}`);
console.log(`Required database variables present: ${required.filter((name) => values[name]).length}/${required.length}`);
console.log(`Optional integration variables present: ${optional.filter((name) => values[name]).length}/${optional.length}`);
if (missing.length) { console.error(`Missing required variables: ${missing.join(", ")}`); process.exit(2); }
if (malformed.length) { console.error(`Malformed configuration variables: ${malformed.join(", ")}`); process.exit(2); }
const local = /^https?:\/\/(127\.0\.0\.1|localhost)/.test(values.NEXT_PUBLIC_SUPABASE_URL);
console.log(`Database mode: ${local ? "local Supabase URL" : "hosted Supabase URL (non-destructive mode)"}`);
if (!local && !process.argv.includes("--allow-hosted")) { console.error("Hosted Supabase URL detected. Select an explicitly classified remote-dev target instead of running local setup against hosted configuration."); process.exit(3); }
if (!local && process.argv.includes("--allow-hosted")) {
  const expectedRef = process.env.CIVICSYNC_REMOTE_PROJECT_REF;
  const hostname = new URL(values.NEXT_PUBLIC_SUPABASE_URL).hostname;
  const actualRef = hostname.endsWith(".supabase.co") ? hostname.slice(0, -".supabase.co".length) : "";
  if (!expectedRef) { console.error("Hosted setup requires CIVICSYNC_REMOTE_PROJECT_REF. Set it to the non-secret Supabase project ref after verifying the target."); process.exit(3); }
  if (!actualRef || expectedRef !== actualRef) { console.error("Hosted setup refused: CIVICSYNC_REMOTE_PROJECT_REF does not match the configured Supabase URL project identity."); process.exit(3); }
  const linkPath = path.join(root, "supabase", ".temp", "project-ref");
  const linkedRef = fs.existsSync(linkPath) ? fs.readFileSync(linkPath, "utf8").trim() : "";
  if (!linkedRef) { console.error("Hosted setup requires an existing Supabase CLI link. Open the Supabase dashboard URL, copy its project ref, set CIVICSYNC_REMOTE_PROJECT_REF, then run: npx.cmd --no-install supabase link --project-ref <verified-project-ref>"); process.exit(3); }
  if (linkedRef !== expectedRef) { console.error("Hosted setup refused: the existing Supabase CLI link points to a different project ref. Relink only after verifying the intended development project."); process.exit(3); }
  console.log("Hosted target identity: URL project ref matches the explicitly supplied development project ref.");
  console.log("Hosted target identity: existing Supabase CLI link matches the same project ref.");
}
