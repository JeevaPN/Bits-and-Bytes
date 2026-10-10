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
const credentialsPath = path.resolve(".cache/demo-accounts.json");
const partnerGroupSlug = "civicsync-demo-service-group";

function check(error, operation) {
  if (error) throw new Error(`${operation}: ${error.code || error.status || "ERROR"} ${error.message}`);
}

function allowTarget(url, env) {
  const hostname = new URL(url).hostname;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  if (isLocal) return hostname;
  const projectRef = hostname.endsWith(".supabase.co") ? hostname.slice(0, -".supabase.co".length) : "";
  if (env.CIVICSYNC_REMOTE_TARGET !== "development"
    || env.CIVICSYNC_REMOTE_PROJECT_REF !== projectRef
    || env.CIVICSYNC_ALLOW_REMOTE_DEV_SEED !== "1") {
    throw new Error("Demo account provisioning refused for a hosted project. Classify and verify the development target, then enable the existing remote development opt-ins.");
  }
  return hostname;
}

async function listUsers(service) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const result = await service.auth.admin.listUsers({ page, perPage: 200 });
    check(result.error, "Check existing Supabase Auth accounts");
    users.push(...result.data.users);
    if (result.data.users.length < 200) return users;
  }
}

function saveCredentials(report) {
  fs.mkdirSync(path.dirname(credentialsPath), { recursive: true });
  fs.writeFileSync(credentialsPath, `${JSON.stringify(report, null, 2)}\n`);
}

function saveDemoPassword(password) {
  const envPath = path.resolve(".env.local");
  let contents = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const setting = `CIVICSYNC_DEMO_PASSWORD=${password}`;
  if (/^[ \t]*CIVICSYNC_DEMO_PASSWORD[ \t]*=.*$/m.test(contents)) {
    contents = contents.replace(/^[ \t]*CIVICSYNC_DEMO_PASSWORD[ \t]*=.*$/m, setting);
  } else {
    contents += `\n# Server-only password for newly created demo accounts\n${setting}\n`;
  }
  fs.writeFileSync(envPath, contents);
}

async function createDemoPartnerGroup(service, user) {
  const existing = await service.from("social_groups").select("id,owner_id").eq("slug", partnerGroupSlug).maybeSingle();
  check(existing.error, "Check demo partner group");
  if (existing.data) {
    if (existing.data.owner_id === user.id) {
      await service.from("group_members").upsert({ group_id: existing.data.id, user_id: user.id, permission: "owner" }, { onConflict: "group_id,user_id" });
    } else {
      console.log("A group already uses the demo slug; it was left unchanged.");
    }
    return;
  }

  const capabilities = ["garbage", "blocked_footpath", "fallen_tree", "other"];
  const issueAreas = await service.from("issues").select("location").in("category", capabilities).limit(500);
  check(issueAreas.error, "Read locations for demo partner coverage");
  const areas = [...new Set((issueAreas.data ?? []).map((issue) => issue.location).filter(Boolean))];
  const group = await service.from("social_groups").insert({
    slug: partnerGroupSlug,
    owner_id: user.id,
    name: "CivicSync Demo Service Group",
    description: "Demo group for community cleanup, footpath access, and local volunteer work.",
    approval_status: "approved",
    location: "Chennai",
    service_area: areas.length ? areas.join("; ") : "Demo Ward North; Demo Ward South; Chennai",
    contact_email: user.email,
    eligible_work: capabilities,
  }).select("id").single();
  check(group.error, "Create demo partner group");
  const membership = await service.from("group_members").insert({ group_id: group.data.id, user_id: user.id, permission: "owner" });
  check(membership.error, "Link new demo partner to its group");
}

async function main() {
  const env = loadEffectiveEnvironment();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Demo accounts are checked on every development startup. Set NEXT_PUBLIC_SUPABASE_URL and the server-only SUPABASE_SERVICE_ROLE_KEY.");
  }
  const target = allowTarget(env.NEXT_PUBLIC_SUPABASE_URL, env);
  const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const users = await listUsers(service);
  const existingEmails = new Set(users.map((user) => user.email?.toLowerCase()).filter(Boolean));
  const missing = definitions.filter((definition) => !existingEmails.has(definition.email));

  if (missing.length === 0) {
    console.log("All three demo accounts already exist; left them unchanged.");
    return;
  }

  let previousReport = null;
  if (fs.existsSync(credentialsPath)) {
    try { previousReport = JSON.parse(fs.readFileSync(credentialsPath, "utf8")); }
    catch { throw new Error("Saved demo credential file is invalid. It was not overwritten."); }
    if (previousReport.target !== target) throw new Error("Saved demo credentials refer to another Supabase project. No accounts were created.");
  }
  const password = previousReport?.defaultPassword
    ?? previousReport?.accounts?.find((account) => account.password)?.password
    ?? `CivicDemo@${randomBytes(12).toString("base64url")}!`;
  const report = previousReport ?? { target, defaultPassword: password, accounts: [] };
  const createdUsers = [];

  for (const definition of missing) {
    const result = await service.auth.admin.createUser({
      email: definition.email,
      password,
      email_confirm: true,
      user_metadata: { display_name: definition.name, requested_workspace: definition.role },
      app_metadata: { demo_account: "civicsync-demo-accounts-v1", signup_workspace: definition.role },
    });
    check(result.error, `Create missing ${definition.label} account`);
    const user = result.data.user;
    if (!user) throw new Error(`Supabase did not return the new ${definition.label} account.`);

    const profile = await service.from("profiles").upsert({
      id: user.id,
      display_name: definition.name,
      primary_role: definition.role,
    }, { onConflict: "id" });
    check(profile.error, `Set role for new ${definition.label} account`);

    const account = { ...definition, userId: user.id, password };
    report.accounts = [...(report.accounts ?? []).filter((item) => item.email !== definition.email), account];
    saveCredentials(report);
    createdUsers.push(account);
    console.log(`Created ${definition.label} demo account: ${definition.email}`);
  }

  const newPartner = createdUsers.find((account) => account.role === "group");
  if (newPartner) {
    await createDemoPartnerGroup(service, { id: newPartner.userId, email: newPartner.email });
  }

  saveDemoPassword(password);
  console.log(`Created ${createdUsers.length} missing demo account(s). Existing accounts were not changed.`);
  console.log(`Generated login details are saved locally in ${credentialsPath}`);
  console.log(JSON.stringify(createdUsers.map(({ label, email, password: accountPassword }) => ({ role: label, email, password: accountPassword })), null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
