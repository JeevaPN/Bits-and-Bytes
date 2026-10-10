"use client";

import { useActionState, useEffect, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowRight, Heart, ShieldCheck, Users } from "lucide-react";
import { signInDemo } from "@/app/auth/demo-actions";
import type { AuthState } from "@/app/auth/actions";

const demoAccounts = [
  { role: "admin", label: "Admin", description: "Manage projects and review reported issues.", icon: ShieldCheck },
  { role: "common", label: "Neighbour", description: "Report local issues and confirm completed work.", icon: Users },
  { role: "group", label: "Community Partner", description: "Take on issues and submit completion evidence.", icon: Heart },
] as const;
const initial: AuthState = { ok: false, message: "" };

function DemoAccountChoices() {
  const [state, action, pending] = useActionState(signInDemo, initial);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  useEffect(() => {
    if (state.ok && state.redirectTo) window.location.replace(state.redirectTo);
  }, [state]);

  return <form action={action} aria-label="Choose a demo account">
    <p className="auth-demo-intro">Choose a role to enter its demo workspace. No email or password needed.</p>
    <div className="auth-demo-choices">
      {demoAccounts.map(({ role, label, description, icon: Icon }) => <button
        suppressHydrationWarning
        key={role}
        type="submit"
        name="workspace"
        value={role}
        className="auth-demo-choice"
        disabled={pending || state.ok}
        onClick={() => setSelectedRole(role)}
      >
        <Icon size={22} aria-hidden="true" />
        <span><strong>{pending && selectedRole === role ? `Opening ${label}…` : label}</strong><small>{description}</small></span>
        <ArrowRight size={18} aria-hidden="true" />
      </button>)}
    </div>
    {state.message && <p className="auth-demo-feedback" role={state.ok ? "status" : "alert"}>{state.message}</p>}
  </form>;
}

export function AuthEntryTabs({ mode, children }: { mode: "sign-in" | "sign-up"; children: ReactNode }) {
  const [tab, setTab] = useState<"account" | "demo">("account");
  const id = useId();
  function switchWithKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? "account" : event.key === "End" ? "demo" : tab === "account" ? "demo" : "account";
    setTab(next);
    document.getElementById(`${id}-${next}-tab`)?.focus();
  }

  return <div className="card auth-entry-card">
    <div className="auth-entry-tabs" role="tablist" aria-label="Account or demo access">
      {(["account", "demo"] as const).map((value) => <button
        suppressHydrationWarning
        key={value}
        id={`${id}-${value}-tab`}
        type="button"
        role="tab"
        aria-selected={tab === value}
        aria-controls={`${id}-${value}-panel`}
        tabIndex={tab === value ? 0 : -1}
        onClick={() => setTab(value)}
        onKeyDown={switchWithKeyboard}
      >{value === "demo" ? "Demo accounts" : mode === "sign-in" ? "Sign in" : "Create account"}</button>)}
    </div>
    <div id={`${id}-account-panel`} role="tabpanel" aria-labelledby={`${id}-account-tab`} hidden={tab !== "account"}>{children}</div>
    <div id={`${id}-demo-panel`} role="tabpanel" aria-labelledby={`${id}-demo-tab`} hidden={tab !== "demo"}><DemoAccountChoices /></div>
  </div>;
}
