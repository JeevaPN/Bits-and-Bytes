import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { authErrorMessage } from "@/lib/auth/messages";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("development email/password authentication", () => {
  it("maps confirmation configuration errors without an OTP flow", () => {
    expect(authErrorMessage("email_not_confirmed")).toContain("Disable Confirm email");
    expect(read("app/auth/actions.ts")).toContain("signInWithPassword");
    expect(read("app/auth/actions.ts")).toContain("data.session");
    expect(read("components/auth/auth-forms.tsx")).not.toContain("resendConfirmation");
    expect(read("app/auth/actions.ts")).not.toContain("auth.resend");
    expect(fs.existsSync(path.join(root, "app/auth/check-email/page.tsx"))).toBe(false);
  });

  it("preserves password recovery and prevents public signup from assigning Admin", () => {
    const actions = read("app/auth/actions.ts");
    expect(actions).toContain("resetPasswordForEmail");
    expect(actions).toContain("display_name: parsed.data.displayName");
    expect(actions).toContain('z.enum(["common", "group"])');
    expect(actions).toContain("Admin role requires a trusted staff workflow");
    const signupTrigger = read("supabase/migrations/202610100006_signup_workspace.sql");
    expect(signupTrigger).toContain("when new.raw_user_meta_data->>'requested_workspace' = 'group'");
    expect(signupTrigger).toContain("else 'common'::public.app_role");
    expect(read("components/auth/auth-forms.tsx")).not.toContain('value="admin"');
    expect(read("app/auth/sign-up/page.tsx")).toContain("Admin access is provisioned separately");
    expect(read("docs/AUTH_DEVELOPMENT.md")).toContain("Confirm email");
    expect(read("docs/AUTH_DEVELOPMENT.md")).toContain("Admin access is provisioned separately");
  });

  it("keeps every runtime public surface on persisted data, not browser fixtures", () => {
    for (const file of ["app/page.tsx", "components/neighbourhood/dashboard.tsx", "components/neighbourhood/group-directory.tsx", "components/shared/public-projects-page.tsx", "components/shared/public-map-page.tsx", "components/shared/public-sponsorship-page.tsx", "components/community-partners/dashboard.tsx", "components/community-partners/task-board.tsx", "app/community-partners/dashboard/campaigns/page.tsx"]) {
      expect(read(file)).not.toContain("lib/domain/demo-data");
      expect(read(file)).not.toContain("lib/mock-api");
    }
    expect(read("components/neighbourhood/task-confirmation.tsx")).not.toContain("neighbourhoodMockApi");
    expect(read("components/neighbourhood/simulated-pledge.tsx")).not.toContain("neighbourhoodMockApi");
  });
});
