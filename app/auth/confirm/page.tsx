"use client";

import { useEffect, useState } from "react";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/browser";

export default function AuthConfirmPage() {
  const [message, setMessage] = useState("Confirming your account…");

  useEffect(() => {
    async function confirmAccount() {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      const client = createClient();
      if (!client || !tokenHash || (type !== "recovery" && type !== "email")) {
        window.location.replace("/auth/sign-in?error=confirmation");
        return;
      }

      const { error } = await client.auth.verifyOtp({ type, token_hash: tokenHash });
      if (error) {
        window.location.replace("/auth/sign-in?error=confirmation");
        return;
      }

      setMessage("Confirmation complete. Redirecting…");
      window.location.replace(safeRedirectPath(params.get("next")));
    }

    void confirmAccount();
  }, []);

  return <main className="container auth-page"><p role="status">{message}</p></main>;
}
