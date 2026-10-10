import "server-only";
import crypto from "node:crypto";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 10 * 1024 * 1024;
const publicIdPart = /^[a-zA-Z0-9_-]{36}$/;

export function isAllowedEvidenceFile(mimeType: string, size: number) {
  return allowedMimeTypes.has(mimeType) && Number.isInteger(size) && size > 0 && size <= maxBytes;
}

export function evidenceNamespace(userId: string) {
  return `civicsync/evidence/${userId}`;
}

export function isValidEvidencePublicId(userId: string, publicId: string) {
  const prefix = `${evidenceNamespace(userId)}/`;
  return publicId.startsWith(prefix) && publicIdPart.test(publicId.slice(prefix.length)) && !publicId.slice(prefix.length).includes("/");
}

export function createEvidenceUploadSignature(userId: string, mimeType: string, size: number) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME; const apiKey = process.env.CLOUDINARY_API_KEY; const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error("CLOUDINARY_NOT_CONFIGURED");
  if (!isAllowedEvidenceFile(mimeType, size)) throw new Error("INVALID_EVIDENCE_FILE");
  const timestamp = Math.floor(Date.now() / 1000); const folder = `civicsync/evidence/${userId}`; const publicId = crypto.randomUUID();
  const type = "authenticated";
  const params = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}&type=${type}`;
  const signature = crypto.createHash("sha1").update(`${params}${apiSecret}`).digest("hex");
  return { cloudName, apiKey, timestamp, folder, publicId, type, resourceType: "image", uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/authenticated/upload`, signature, maxBytes, allowedMimeTypes: [...allowedMimeTypes] };
}

type CloudinaryResource = { public_id?: string; resource_type?: string; type?: string; format?: string; version?: number };

async function cloudinaryResource(userId: string, publicId: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME; const apiKey = process.env.CLOUDINARY_API_KEY; const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret || !isValidEvidencePublicId(userId, publicId)) return null;
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image/authenticated/${publicId.split("/").map(encodeURIComponent).join("/")}`, { headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}` }, cache: "no-store" });
  if (!response.ok) return null;
  const resource = await response.json() as CloudinaryResource;
  return resource.public_id === publicId && resource.resource_type === "image" && resource.type === "authenticated" ? resource : null;
}

export async function verifyEvidenceAsset(userId: string, publicId: string) {
  return cloudinaryResource(userId, publicId);
}

export function createAuthenticatedDeliveryUrl(resource: { public_id: string; version?: number; format?: string }) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME; const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiSecret) return null;
  const extension = resource.format ? `.${resource.format}` : "";
  const version = resource.version ? `v${resource.version}/` : "";
  const path = `${version}${resource.public_id}${extension}`;
  const signature = crypto.createHash("sha1").update(`${path}${apiSecret}`).digest("base64url").slice(0, 8);
  return `https://res.cloudinary.com/${cloudName}/image/authenticated/s--${signature}--/${path}`;
}

export async function deleteEvidenceAsset(userId: string, publicId: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME; const apiKey = process.env.CLOUDINARY_API_KEY; const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret || !isValidEvidencePublicId(userId, publicId)) return;
  const timestamp = Math.floor(Date.now() / 1000);
  const params = `public_id=${publicId}&timestamp=${timestamp}&type=authenticated`;
  const signature = crypto.createHash("sha1").update(`${params}${apiSecret}`).digest("hex");
  await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), type: "authenticated", api_key: apiKey, signature }) });
}
