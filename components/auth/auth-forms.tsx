"use client";
import { useActionState, useEffect, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { requestPasswordReset, signIn, signOut, signUp, updatePassword, type AuthState } from "@/app/auth/actions";

// Autofill extensions can inject fdprocessedid before hydration.
// Tolerate attribute differences on leaf controls only.
// Server actions update cookies without notifying the browser Auth client.
// Reload after session changes so the header and role permissions read fresh state.
const initial: AuthState = { ok: false, message: "" };
function Feedback({ state }: { state: AuthState }) { return state.message ? <p role={state.ok ? "status" : "alert"} style={{ color: state.ok ? "var(--green)" : "#a33", lineHeight: 1.5 }}>{state.message}</p> : null; }

function PasswordField({ autoComplete }: { autoComplete: "current-password" | "new-password" }) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();
  return <div className="label">
    <label htmlFor={inputId}>Password</label>
    <div className="auth-password-input">
      <input suppressHydrationWarning id={inputId} className="field" type={visible ? "text" : "password"} name="password" required minLength={8} maxLength={128} autoComplete={autoComplete} />
      <button
        suppressHydrationWarning
        className="auth-password-toggle"
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-controls={inputId}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((previous) => !previous)}
      >
        {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  </div>;
}
export function SignInForm({ next = "" }: { next?: string }) { const [state, action, pending] = useActionState(signIn, initial); useEffect(() => { if (state.ok && state.redirectTo) window.location.replace(state.redirectTo); }, [state]); return <form action={action} noValidate><label className="label">Email<input suppressHydrationWarning className="field" type="email" name="email" required autoComplete="email" /></label><PasswordField autoComplete="current-password" /><input type="hidden" name="next" value={next} /><button suppressHydrationWarning className="button" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button><Feedback state={state} /></form>; }
export function SignUpForm() { const [state, action, pending] = useActionState(signUp, initial); useEffect(() => { if (state.ok && state.redirectTo) window.location.replace(state.redirectTo); }, [state]); return <form action={action} noValidate><label className="label">I am signing up as<select suppressHydrationWarning className="field" name="workspace" required defaultValue=""><option value="" disabled>Choose account type</option><option value="common">Neighbour</option><option value="group">Community Partner</option></select></label><label className="label">Display name<input suppressHydrationWarning className="field" name="displayName" required minLength={2} maxLength={80} autoComplete="name" /></label><label className="label">Email<input suppressHydrationWarning className="field" type="email" name="email" required autoComplete="email" /></label><PasswordField autoComplete="new-password" /><button suppressHydrationWarning className="button" disabled={pending}>{pending ? "Creating account…" : "Create account"}</button><Feedback state={state} /></form>; }
export function ForgotPasswordForm() { const [state, action, pending] = useActionState(requestPasswordReset, initial); return <form action={action} noValidate><label className="label">Email<input suppressHydrationWarning className="field" type="email" name="email" required autoComplete="email" /></label><button suppressHydrationWarning className="button" disabled={pending}>{pending ? "Requesting…" : "Send reset email"}</button><Feedback state={state} /></form>; }
export function ResetPasswordForm() { const router = useRouter(); const [state, action, pending] = useActionState(updatePassword, initial); useEffect(() => { if (state.ok && state.redirectTo) router.replace(state.redirectTo); }, [state, router]); return <form action={action} noValidate><label className="label">New password<input suppressHydrationWarning className="field" type="password" name="password" required minLength={8} autoComplete="new-password" /></label><label className="label">Confirm password<input suppressHydrationWarning className="field" type="password" name="confirmation" required minLength={8} autoComplete="new-password" /></label><button suppressHydrationWarning className="button" disabled={pending}>{pending ? "Updating…" : "Update password"}</button><Feedback state={state} /></form>; }
export function SignOutButton() { const [state, action, pending] = useActionState(signOut, initial); useEffect(() => { if (state.ok && state.redirectTo) window.location.replace(state.redirectTo); }, [state]); return <form action={action}><button suppressHydrationWarning className="navlink" disabled={pending}>{pending ? "Signing out…" : "Sign out"}</button><Feedback state={state} /></form>; }
