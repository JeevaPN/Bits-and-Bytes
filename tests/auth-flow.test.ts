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

  it("preserves password recovery and does not allow signup to select roles", () => {
    const actions = read("app/auth/actions.ts");
    expect(actions).toContain("resetPasswordForEmail");
    expect(actions).toContain("display_name: parsed.data.displayName");
    expect(actions).not.toContain("primary_role");
    expect(read("docs/AUTH_DEVELOPMENT.md")).toContain("Confirm email");
  });
});
