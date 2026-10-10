"use client";

import { useEffect, useState } from "react";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/browser";
import { logger } from "@/lib/observability/logger";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Completing sign in…");

  useEffect(() => {
    async function completeSignIn() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const client = createClient();
      if (!client || !code) {
        logger.warn("auth callback missing configuration or code", {
          route: "/auth/callback",
          operation: "exchange_code",
          code: !client ? "AUTH_NOT_CONFIGURED" : "CALLBACK_CODE_MISSING",
        });
        window.location.replace("/auth/sign-in?error=callback");
        return;
      }

      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) {
        logger.warn("auth callback exchange rejected", {
          route: "/auth/callback",
          operation: "exchange_code",
          code: error.code || "CALLBACK_EXCHANGE_FAILED",
        });
        window.location.replace("/auth/sign-in?error=callback");
        return;
      }

      setMessage("Sign in complete. Redirecting…");
      window.location.replace(safeRedirectPath(params.get("next")));
    }

    void completeSignIn();
  }, []);

  return <main className="container auth-page"><p role="status">{message}</p></main>;
}
