# CivicSync development authentication

The current development configuration uses Supabase Auth email and password only.

In the Supabase dashboard, open **Authentication → Providers → Email** and disable **Confirm email**. With that setting disabled, `signUp` returns an authenticated session, CivicSync redirects the new Common People account to `/neighbourhood`, and no email OTP or confirmation screen is shown.

Password reset remains available through `/auth/forgot-password` and `/auth/reset-password`.

Before a public production launch, reconsider email verification and enable an appropriate verified-email policy with configured Supabase Auth email delivery. Do not grant admin or approved-group privileges through signup; those roles remain server-controlled.
