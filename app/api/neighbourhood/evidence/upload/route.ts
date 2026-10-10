import { lookup } from "node:dns/promises";
import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { evidenceNamespace, isAllowedEvidenceFile } from "@/lib/media/cloudinary";
import { logger } from "@/lib/observability/logger";

const publicIdPattern = /^[a-zA-Z0-9_-]{36}$/;
const safeProviderDetail = (value: unknown) => String(value || "Cloudinary rejected the upload.").replace(/https?:\/\/\S+/gi, "[url]").replace(/(api[_-]?key|signature|public[_-]?id)\s*[=:]\s*[^,\s]+/gi, "$1=[redacted]").slice(0, 240);
const transportDetail = (error: unknown) => { if (!(error instanceof Error)) return "Provider request failed before receiving a response."; const cause = error.cause as { code?: string; errno?: string; syscall?: string; hostname?: string } | undefined; const causeText = cause ? [cause.code, cause.errno, cause.syscall, cause.hostname].filter(Boolean).join("/") : ""; return safeProviderDetail([error.message, causeText].filter(Boolean).join("; ")); };

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: "Authentication required.", requestId }, { status: 401, headers: { "x-request-id": requestId } });
    const incoming = await request.formData();
    const file = incoming.get("file");
    const folder = String(incoming.get("folder") || "");
    const publicId = String(incoming.get("public_id") || "");
    const type = String(incoming.get("type") || "");
    const signature = String(incoming.get("signature") || "");
    const timestamp = String(incoming.get("timestamp") || "");
    const apiKey = String(incoming.get("api_key") || "");
    if (!(file instanceof File) || !isAllowedEvidenceFile(file.type, file.size) || folder !== evidenceNamespace(user.id) || !publicIdPattern.test(publicId) || type !== "authenticated" || !signature || !/^\d+$/.test(timestamp) || !apiKey) {
      logger.warn("evidence upload rejected before provider request", { requestId, route: "/api/neighbourhood/evidence/upload", operation: "cloudinary_upload", code: "INVALID_SIGNED_UPLOAD" });
      return NextResponse.json({ error: "Invalid evidence upload request.", requestId }, { status: 400, headers: { "x-request-id": requestId } });
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return NextResponse.json({ error: "Evidence upload is not configured.", requestId }, { status: 503, headers: { "x-request-id": requestId } });
    try { await lookup("api.cloudinary.com"); }
    catch (error) { logger.error("Cloudinary API DNS lookup failed", { requestId, route: "/api/neighbourhood/evidence/upload", operation: "cloudinary_upload", provider: "cloudinary", code: "CLOUDINARY_DNS_FAILURE", detail: transportDetail(error) }); return NextResponse.json({ error: "The evidence storage service cannot be resolved by this server.", requestId }, { status: 503, headers: { "x-request-id": requestId } }); }
    const body = new FormData();
    body.append("file", file);
    body.append("api_key", apiKey); body.append("timestamp", timestamp); body.append("folder", folder); body.append("public_id", publicId); body.append("type", type); body.append("signature", signature);
    let providerResponse: Response;
    try { providerResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body, signal: AbortSignal.timeout(30_000) }); }
    catch (error) { const timedOut = error instanceof DOMException && error.name === "TimeoutError"; logger.error("Cloudinary upload network failure", { requestId, route: "/api/neighbourhood/evidence/upload", operation: "cloudinary_upload", provider: "cloudinary", code: timedOut ? "CLOUDINARY_TIMEOUT" : "CLOUDINARY_NETWORK_FAILURE", detail: timedOut ? "Cloudinary request exceeded 30 seconds." : transportDetail(error) }); return NextResponse.json({ error: timedOut ? "The evidence storage service timed out." : "The evidence storage service could not be reached.", requestId }, { status: 503, headers: { "x-request-id": requestId } }); }
    const result = await providerResponse.json().catch(() => null) as { public_id?: string; error?: { message?: string } } | null;
    if (!providerResponse.ok || result?.public_id !== `${folder}/${publicId}`) {
      const detail = safeProviderDetail(result?.error?.message || `Cloudinary returned HTTP ${providerResponse.status}.`);
      logger.error("Cloudinary upload rejected", { requestId, route: "/api/neighbourhood/evidence/upload", operation: "cloudinary_upload", provider: "cloudinary", status: providerResponse.status, code: `CLOUDINARY_HTTP_${providerResponse.status}`, detail });
      return NextResponse.json({ error: "The evidence storage service rejected the image.", requestId }, { status: providerResponse.status >= 500 ? 503 : 422, headers: { "x-request-id": requestId } });
    }
    logger.info("Cloudinary evidence upload completed", { requestId, route: "/api/neighbourhood/evidence/upload", operation: "cloudinary_upload", provider: "cloudinary", status: providerResponse.status, code: "CLOUDINARY_UPLOAD_OK" });
    return NextResponse.json({ public_id: result.public_id, requestId }, { headers: { "x-request-id": requestId } });
  } catch (error) {
    logger.error("Evidence upload route failed", { requestId, route: "/api/neighbourhood/evidence/upload", operation: "cloudinary_upload", code: "UPLOAD_ROUTE_FAILURE", detail: error instanceof Error ? safeProviderDetail(error.message) : "Unexpected upload route failure." });
    return NextResponse.json({ error: "The evidence upload could not be completed.", requestId }, { status: 503, headers: { "x-request-id": requestId } });
  }
}
