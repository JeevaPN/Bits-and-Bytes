"use client";
/* eslint-disable @next/next/no-img-element -- protected same-origin URLs must retain browser session cookies. */

import { useState } from "react";

/* The protected evidence URL must be requested by the browser so its Admin session cookie is sent. */
export function EvidenceImage({ src, alt, large = false }: { src: string; alt: string; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <p role="status" style={{ color: "var(--muted)" }}>Evidence could not be loaded. It may be missing or inaccessible.</p>;
  return <img src={src} alt={alt} onError={() => setFailed(true)} style={{ display: "block", maxWidth: "100%", height: "auto", maxHeight: large ? 560 : 360, objectFit: "contain", borderRadius: 8 }} />;
}
