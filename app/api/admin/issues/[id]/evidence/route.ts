import { NextResponse } from "next/server";
import { createAuthenticatedDeliveryUrl, verifyEvidenceAsset } from "@/lib/media/cloudinary";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability/logger";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const client = await createClient();
  if (!client) return new NextResponse("Unavailable", { status: 503 });
  const { data: { user } } = await client.auth.getUser();
  if (!user) return new NextResponse("Authentication required", { status: 401 });
  const { data: profile } = await client.from("profiles").select("primary_role").eq("id", user.id).maybeSingle();
  if (profile?.primary_role !== "admin") return new NextResponse("Forbidden", { status: 403 });
  const { id } = await context.params;
  const { data: issue } = await client.from("issues").select("evidence_path,reporter_id").eq("id", id).maybeSingle();
  const publicId = typeof issue?.evidence_path === "string" ? issue.evidence_path : "";
  const reporterId = typeof issue?.reporter_id === "string" ? issue.reporter_id : "";
  if (!publicId || !reporterId) { logger.warn("admin evidence reference missing", { route: "/api/admin/issues/[id]/evidence", operation: "admin_evidence_read", code: "EVIDENCE_REFERENCE_MISSING" }); return new NextResponse("Evidence unavailable", { status: 404 }); }
  const resource = publicId && reporterId ? await verifyEvidenceAsset(reporterId, publicId).catch(() => null) : null;
  if (!resource) { logger.warn("admin evidence asset unavailable", { route: "/api/admin/issues/[id]/evidence", operation: "admin_evidence_read", code: "EVIDENCE_ASSET_NOT_FOUND", provider: "cloudinary" }); return new NextResponse("Evidence unavailable", { status: 404 }); }
  const url = createAuthenticatedDeliveryUrl({ public_id: resource.public_id!, version: resource.version, format: resource.format });
  if (!url) { logger.warn("admin evidence delivery URL unavailable", { route: "/api/admin/issues/[id]/evidence", operation: "admin_evidence_read", code: "EVIDENCE_DELIVERY_URL_FAILED", provider: "cloudinary" }); return new NextResponse("Evidence unavailable", { status: 404 }); }
  const image = await fetch(url, { cache: "no-store" });
  if (!image.ok || !image.body) { logger.warn("admin evidence delivery rejected", { route: "/api/admin/issues/[id]/evidence", operation: "admin_evidence_read", code: `CLOUDINARY_DELIVERY_HTTP_${image.status}`, provider: "cloudinary", status: image.status }); return new NextResponse("Evidence unavailable", { status: 404 }); }
  return new NextResponse(image.body, { status: 200, headers: { "content-type": image.headers.get("content-type") || "image/*", "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
}
