"use client";
import { useActionState, useEffect } from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { requestPasswordReset, resendConfirmation, signIn, signOut, signUp, updatePassword, type AuthState } from "@/app/auth/actions";

const initial: AuthState = { ok: false, message: "" };
function Feedback({ state }: { state: AuthState }) {
  if (!state.message) return null;

  return (
    <div role={state.ok ? "status" : "alert"} style={{ color: state.ok ? "var(--green)" : "#a33", lineHeight: 1.5 }}>
      <p>{state.message}</p>
      {process.env.NODE_ENV === "development" && state.debugInfo && (
        <details style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
          <summary style={{ cursor: "pointer" }}>Signup debugging details</summary>
          <code style={{ display: "block", marginTop: 6, overflowWrap: "anywhere" }}>{state.debugInfo}</code>
        </details>
      )}
    </div>
  );
}
export function SignInForm({ next = "/neighbourhood" }: { next?: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(signIn, initial);
  const defaultWorkspace = next.startsWith("/admin")
    ? "admin"
    : next.startsWith("/community-partners")
      ? "group"
      : "common";

  useEffect(() => {
    if (state.ok && state.redirectTo) router.replace(state.redirectTo);
  }, [state, router]);

  return <form action={action}>
    <label className="label">I am signing in as
      <select className="field" name="workspace" required defaultValue={defaultWorkspace}>
        <option value="common">Neighbourhood</option>
        <option value="group">Community Partner</option>
        <option value="admin">Admin</option>
      </select>
    </label>
    <label className="label">Email<input className="field" type="email" name="email" required autoComplete="email" /></label>
    <label className="label">Password<input className="field" type="password" name="password" required minLength={8} autoComplete="current-password" /></label>
    <input type="hidden" name="next" value={next} />
    <button className="button" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    <Feedback state={state} />
  </form>;
}
export function SignUpForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(signUp, initial);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.ok && state.redirectTo) router.replace(state.redirectTo);
  }, [state, router]);

  return <form action={action}>
    <label className="label">Display name<input className="field" name="displayName" required minLength={2} maxLength={80} autoComplete="name" /></label>
    <label className="label">I am signing up as
      <select className="field" name="workspace" required defaultValue="common">
        <option value="common">Neighbourhood</option>
        <option value="group">Community Partner</option>
        <option value="admin">Admin</option>
      </select>
      <small>This workspace is saved to your account. You can also choose Admin when signing in.</small>
    </label>
    <label className="label">Email<input className="field" type="email" name="email" required autoComplete="email" /></label>
    <label className="label">Password
      <span className="auth-password-input">
        <input className="field" type={showPassword ? "text" : "password"} name="password" required minLength={8} maxLength={128} autoComplete="new-password" />
        <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>
          {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
        </button>
      </span>
      <small>Use 8 to 128 characters.</small>
    </label>
    <button className="button" disabled={pending}>{pending ? "Creating account…" : "Create account"}</button>
    <Feedback state={state} />
  </form>;
}
export function ForgotPasswordForm() { const [state, action, pending] = useActionState(requestPasswordReset, initial); return <form action={action} noValidate><label className="label">Email<input className="field" type="email" name="email" required autoComplete="email" /></label><button className="button" disabled={pending}>{pending ? "Requesting…" : "Send reset email"}</button><Feedback state={state} /></form>; }
export function ResendConfirmationForm() { const [state, action, pending] = useActionState(resendConfirmation, initial); return <form action={action} noValidate><label className="label">Email<input className="field" type="email" name="email" required autoComplete="email" /></label><button className="button secondary" disabled={pending}>{pending ? "Requesting…" : "Resend confirmation"}</button><Feedback state={state} /></form>; }
export function ResetPasswordForm() { const router = useRouter(); const [state, action, pending] = useActionState(updatePassword, initial); useEffect(() => { if (state.ok && state.redirectTo) router.replace(state.redirectTo); }, [state, router]); return <form action={action} noValidate><label className="label">New password<input className="field" type="password" name="password" required minLength={8} autoComplete="new-password" /></label><label className="label">Confirm password<input className="field" type="password" name="confirmation" required minLength={8} autoComplete="new-password" /></label><button className="button" disabled={pending}>{pending ? "Updating…" : "Update password"}</button><Feedback state={state} /></form>; }
export function SignOutButton() { const router = useRouter(); const [state, action, pending] = useActionState(signOut, initial); useEffect(() => { if (state.ok && state.redirectTo) router.replace(state.redirectTo); }, [state, router]); return <form action={action}><button className="navlink" disabled={pending}>{pending ? "Signing out…" : "Sign out"}</button><Feedback state={state} /></form>; }
