# CivicSync development authentication

The current development configuration uses Supabase Auth email and password only.

In the Supabase dashboard, open **Authentication → Providers → Email** and disable **Confirm email**. With that setting disabled, `signUp` returns an authenticated session, CivicSync saves the selected Neighbour or Community Partner role and redirects the new account to `/`, and no email OTP or confirmation screen is shown. Admin access is provisioned separately through a trusted staff workflow and cannot be selected during public signup.

Password reset remains available through `/auth/forgot-password` and `/auth/reset-password`.

Before a public production launch, reconsider email verification and enable an appropriate verified-email policy with configured Supabase Auth email delivery. Public signup allows Neighbour and Community Partner roles only. The server saves the initial choice in `profiles.primary_role` and server-owned Auth metadata. Sign-in uses that saved role; an old demo-workspace cookie cannot override an authenticated account. `SUPABASE_SERVICE_ROLE_KEY` is required on the server to save the selected role; it is never sent to the browser. Choosing Community Partner sets the account role and does not approve a community group.
