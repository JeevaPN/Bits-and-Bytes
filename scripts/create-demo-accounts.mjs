import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { loadEffectiveEnvironment } from "./env-resolution.mjs";

const definitions = [
  { role: "admin", label: "Admin", name: "Demo Admin", email: "admin.demo@civicsync.test" },
  { role: "common", label: "Neighbour", name: "Demo Neighbour", email: "neighbour.demo@civicsync.test" },
  { role: "group", label: "Community Partner", name: "Demo Community Partner", email: "partner.demo@civicsync.test" },
];
const marker = "civicsync-demo-accounts-v1";
const credentialsPath = path.resolve(".cache/demo-accounts.json");

function check(error, operation) {
  if (error) throw new Error(`${operation}: ${error.code || error.status || "ERROR"} ${error.message}`);
}

async function main() {
  const env = loadEffectiveEnvironment();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase URL and server service role key are required.");
  }
  const target = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const users = [];
  for (let page = 1; ; page += 1) {
    const result = await service.auth.admin.listUsers({ page, perPage: 200 });
    check(result.error, "Connect to Supabase Auth");
    users.push(...result.data.users);
    if (result.data.users.length < 200) break;
  }
  for (const definition of definitions) {
    const existing = users.find((user) => user.email?.toLowerCase() === definition.email);
    if (existing && existing.app_metadata.demo_account !== marker) {
      throw new Error(`${definition.email} already belongs to an account not created by this script. It was not changed.`);
    }
  }
  const preflight = await service.from("social_groups").select("id,slug,owner_id,service_area,eligible_work,approval_status").eq("slug", "civicsync-demo-service-group");
  check(preflight.error, "Check partner group schema");

  let report = fs.existsSync(credentialsPath) ? JSON.parse(fs.readFileSync(credentialsPath, "utf8")) : null;
  if (report && report.target !== target) throw new Error("Saved demo credentials refer to another backend. No accounts were changed.");
  if (!report) {
    const password = `CivicDemo@${randomBytes(12).toString("base64url")}!`;
    report = { target, accounts: definitions.map((definition) => ({ ...definition, password })) };
  }
  fs.mkdirSync(path.dirname(credentialsPath), { recursive: true });
  const save = () => fs.writeFileSync(credentialsPath, JSON.stringify(report, null, 2) + "\n");
  save();

  for (const account of report.accounts) {
    let user = users.find((candidate) => candidate.email?.toLowerCase() === account.email);
    if (!user) {
      const created = await service.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { display_name: account.name, requested_workspace: account.role },
        app_metadata: { demo_account: marker, signup_workspace: account.role },
      });
      check(created.error, `Create ${account.label} account`);
      user = created.data.user;
      if (!user) throw new Error(`No user returned for ${account.label}.`);
    } else {
      const updated = await service.auth.admin.updateUserById(user.id, {
        password: account.password,
        email_confirm: true,
        app_metadata: { demo_account: marker, signup_workspace: account.role },
      });
      check(updated.error, `Restore ${account.label} demo credentials`);
    }
    account.userId = user.id;
    save();
    const profile = await service.from("profiles").upsert({
      id: user.id, display_name: account.name, primary_role: account.role,
    }, { onConflict: "id" });
    check(profile.error, `Save ${account.label} role`);
    console.log(`${account.label} account ready: ${account.email}`);
  }

  const partner = report.accounts.find((account) => account.role === "group");
  const existingGroup = preflight.data[0];
  if (existingGroup && existingGroup.owner_id !== partner.userId) {
    throw new Error("The demo group slug belongs to another owner. That group was not changed.");
  }
  const capabilities = ["garbage", "blocked_footpath", "fallen_tree", "other"];
  const issueAreas = await service.from("issues").select("location,category").in("category", capabilities).limit(500);
  check(issueAreas.error, "Read locations for demo group coverage");
  const areas = [...new Set((issueAreas.data ?? []).map((issue) => issue.location).filter(Boolean))];
  const group = await service.from("social_groups").upsert({
    slug: "civicsync-demo-service-group",
    owner_id: partner.userId,
    name: "CivicSync Demo Service Group",
    description: "Demo social service group for community cleanup, footpath access, and local volunteer work.",
    approval_status: "approved",
    location: "Chennai",
    service_area: areas.length ? areas.join("; ") : "Demo Ward North; Demo Ward South; Chennai",
    contact_email: partner.email,
    eligible_work: capabilities,
  }, { onConflict: "slug" }).select("id").single();
  check(group.error, "Create approved demo social service group");
  const membership = await service.from("group_members").upsert({
    group_id: group.data.id, user_id: partner.userId, permission: "owner",
  }, { onConflict: "group_id,user_id" });
  check(membership.error, "Link Partner demo account to its group");
  report.groupId = group.data.id;
  report.completedAt = new Date().toISOString();
  save();

  const profiles = await service.from("profiles").select("id,primary_role").in("id", report.accounts.map((account) => account.userId));
  check(profiles.error, "Read saved account roles");
  for (const account of report.accounts) {
    if (!profiles.data.some((profile) => profile.id === account.userId && profile.primary_role === account.role)) {
      throw new Error(`Saved role does not match ${account.label}.`);
    }
  }
  // This shared credential is intentionally public and must only be used for
  // disposable demo accounts.
  const envPath = path.resolve(".env");
  let envFile = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const setting = `NEXT_PUBLIC_CIVICSYNC_DEMO_PASSWORD=${report.accounts[0].password}`;
  if (/^[ \t]*NEXT_PUBLIC_CIVICSYNC_DEMO_PASSWORD[ \t]*=.*$/m.test(envFile)) {
    envFile = envFile.replace(/^[ \t]*NEXT_PUBLIC_CIVICSYNC_DEMO_PASSWORD[ \t]*=.*$/m, setting);
  } else {
    envFile += `\n# Public shared password for disposable demo accounts\n${setting}\n`;
  }
  fs.writeFileSync(envPath, envFile);
  console.log("All three roles saved. Partner account owns an approved demo group.");
  console.log(`Login details saved locally to ${credentialsPath}`);
  console.log(JSON.stringify(report.accounts.map(({ label, email, password }) => ({ role: label, email, password })), null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
