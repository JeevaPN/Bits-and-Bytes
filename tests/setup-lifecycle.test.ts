import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { loadEffectiveEnvironment } from "../scripts/env-resolution.mjs";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("development lifecycle safety", () => {
  it("uses the pinned project-local Supabase CLI", () => {
    const packageJson = JSON.parse(read("package.json")) as { devDependencies: { supabase: string }; scripts: Record<string, string> };
    expect(packageJson.devDependencies.supabase).toBe("2.120.0");
    expect(packageJson.scripts["dev:setup"]).toContain("dev-setup.ps1");
    expect(read("scripts/dev-setup.ps1")).toContain("npx.cmd --no-install supabase");
    expect(read("scripts/dev-setup.ps1")).toContain("ensure-project-deps.ps1");
    expect(read("scripts/dev-setup.ps1")).toContain("db push --linked");
    expect(read("scripts/dev-setup.ps1")).toContain("No Supabase CLI database operation was attempted");
    expect(read("scripts/dev-setup.ps1")).toContain("schema/read-model verification failed");
    expect(read("scripts/dev-setup.ps1")).not.toContain("Get-Command supabase");
  });

  it("refuses unsafe remote reset and requires explicit remote classification", () => {
    const reset = read("scripts/dev-reset.ps1");
    const setup = read("scripts/dev-setup.ps1");
    expect(reset).toContain("Remote reset is refused");
    expect(reset).toContain("ConfirmReset");
    expect(setup).toContain("CIVICSYNC_REMOTE_TARGET -ne 'development'");
    expect(read("scripts/dev-preflight.mjs")).toContain("CIVICSYNC_REMOTE_PROJECT_REF");
    expect(read("scripts/dev-preflight.mjs")).toContain("does not match");
    expect(read("scripts/dev-preflight.mjs")).toContain("existing Supabase CLI link");
    expect(setup.indexOf("node scripts/dev-preflight.mjs --allow-hosted")).toBeLessThan(setup.indexOf("npx.cmd --no-install supabase --version"));
  });

  it("keeps seed operations idempotent and does not fabricate auth users", () => {
    const seed = read("supabase/seed.sql");
    expect(seed).toContain("on conflict");
    expect(seed).toContain("Auth users are intentionally not created");
    expect(read("scripts/dev-seed.ps1")).toContain("db query");
    expect(read("scripts/dev-seed.ps1")).toContain("--linked");
    expect(read("scripts/dev-seed.ps1")).toContain("Seed command failed");
    expect(read("scripts/dev-setup.ps1")).toContain("if ($LASTEXITCODE -ne 0) { throw 'Development seed failed");
  });

  it("checks readiness through the application health contract", () => {
    const verify = read("scripts/dev-verify.ps1");
    expect(verify).toContain("/api/health");
    expect(verify).toContain("CivicSync readiness: OK");
    expect(read("app/api/health/route.ts")).toContain("missingRelations");
    expect(read("app/api/health/route.ts")).toContain("relationErrors");
    expect(read("app/api/health/route.ts")).toContain("publicMapReadModel");
    expect(read("app/api/health/route.ts")).toContain("public_sponsorship_campaigns");
    expect(read("scripts/dev-verify.ps1")).toContain("[ValidateSet('auto','local','remote-dev')]");
  });

  it("verifies actual schema objects after migration history", () => {
    const setup = read("scripts/dev-setup.ps1");
    const verify = read("supabase/verify.sql");
    expect(setup).toContain("supabase/verify.sql");
    expect(verify).toContain("public_project_map_feed");
    expect(verify).toContain("handle_new_user");
    expect(verify).toContain("pg_policies");
  });

  it("does not start the app unless every setup subprocess succeeds", () => {
    const setup = read("scripts/dev-setup.ps1");
    const seed = setup.indexOf("dev-seed.ps1");
    const start = setup.indexOf("Start-Process -FilePath 'npm.cmd'");
    expect(seed).toBeGreaterThan(-1);
    expect(start).toBeGreaterThan(seed);
    expect(setup.slice(seed, start)).toContain("$LASTEXITCODE -ne 0");
    expect(read("scripts/dev-migrate.ps1")).toContain("Migration command failed");
    expect(read("scripts/dev-verify.ps1")).toContain("Verification preflight failed");
    expect(read("scripts/dev-verify.ps1")).toContain("returned 404 for /api/health");
  });

  it("keeps ordinary development startup non-destructive", () => {
    const scripts = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
    expect(scripts.scripts.dev).toBe("next dev");
    expect(scripts.scripts.dev).not.toMatch(/reset|seed|db push/i);
  });

  it("resolves remote project refs with process > .env.local > .env precedence", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civicsync-env-"));
    fs.writeFileSync(path.join(tempRoot, ".env"), "CIVICSYNC_REMOTE_PROJECT_REF=from-env\n");
    fs.writeFileSync(path.join(tempRoot, ".env.local"), "CIVICSYNC_REMOTE_PROJECT_REF=from-local\n");
    expect(loadEffectiveEnvironment(tempRoot, {} as unknown as NodeJS.ProcessEnv).CIVICSYNC_REMOTE_PROJECT_REF).toBe("from-local");
    expect(loadEffectiveEnvironment(tempRoot, { CIVICSYNC_REMOTE_PROJECT_REF: "from-process" } as unknown as NodeJS.ProcessEnv).CIVICSYNC_REMOTE_PROJECT_REF).toBe("from-process");
    expect(loadEffectiveEnvironment(tempRoot, {} as unknown as NodeJS.ProcessEnv).CIVICSYNC_REMOTE_TARGET).toBeUndefined();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("rejects missing and mismatched refs before hosted CLI operations", () => {
    const preflight = read("scripts/dev-preflight.mjs");
    const cli = read("scripts/dev-setup.ps1");
    expect(preflight).toContain("const expectedRef = values.CIVICSYNC_REMOTE_PROJECT_REF");
    expect(cli.indexOf("node scripts/dev-preflight.mjs --allow-hosted")).toBeLessThan(cli.indexOf("npx.cmd --no-install supabase --version"));
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civicsync-preflight-"));
    fs.writeFileSync(path.join(tempRoot, ".env"), "NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder\n");
    const missing = spawnSync(process.execPath, ["scripts/dev-preflight.mjs", "--allow-hosted"], { cwd: root, env: { ...process.env, CIVICSYNC_ENV_ROOT: tempRoot, CIVICSYNC_REMOTE_PROJECT_REF: "" }, encoding: "utf8" });
    const mismatch = spawnSync(process.execPath, ["scripts/dev-preflight.mjs", "--allow-hosted"], { cwd: root, env: { ...process.env, CIVICSYNC_ENV_ROOT: tempRoot, CIVICSYNC_REMOTE_PROJECT_REF: "wrong-project-ref" }, encoding: "utf8" });
    expect(missing.status).toBe(3);
    expect(mismatch.status).toBe(3);
    expect(`${missing.stdout}${missing.stderr}`).toContain("requires CIVICSYNC_REMOTE_PROJECT_REF");
    expect(`${mismatch.stdout}${mismatch.stderr}`).toContain("does not match");
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });
});
