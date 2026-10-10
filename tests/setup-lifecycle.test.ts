import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

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
  });

  it("keeps seed operations idempotent and does not fabricate auth users", () => {
    const seed = read("supabase/seed.sql");
    expect(seed).toContain("on conflict");
    expect(seed).toContain("Auth users are intentionally not created");
    expect(read("scripts/dev-seed.ps1")).toContain("db query");
    expect(read("scripts/dev-seed.ps1")).toContain("--linked");
  });

  it("checks readiness through the application health contract", () => {
    const verify = read("scripts/dev-verify.ps1");
    expect(verify).toContain("/api/health");
    expect(verify).toContain("CivicSync readiness: OK");
    expect(read("app/api/health/route.ts")).toContain("missingRelations");
    expect(read("app/api/health/route.ts")).toContain("relationErrors");
  });

  it("keeps ordinary development startup non-destructive", () => {
    const scripts = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
    expect(scripts.scripts.dev).toBe("next dev");
    expect(scripts.scripts.dev).not.toMatch(/reset|seed|db push/i);
  });
});
