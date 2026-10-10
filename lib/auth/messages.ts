export function authErrorMessage(code?: string): string {
  const messages: Record<string, string> = {
    user_already_exists: "An account with this email already exists. Try signing in.",
    email_address_invalid: "Use a valid email address.",
    weak_password: "Choose a stronger password.",
    signup_disabled: "New account creation is disabled in Supabase Auth.",
    email_provider_disabled: "Email sign-up is disabled in Supabase Auth.",
    email_not_confirmed: "Email confirmation is enabled in Supabase Auth. Disable Confirm email for this development configuration.",
  };
  return messages[code || ""] || "Authentication failed. Check your details and try again.";
}
