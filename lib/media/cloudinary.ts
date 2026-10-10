import crypto from "node:crypto";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 10 * 1024 * 1024;
export function createEvidenceUploadSignature(userId: string, mimeType: string, size: number) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME; const apiKey = process.env.CLOUDINARY_API_KEY; const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error("CLOUDINARY_NOT_CONFIGURED");
  if (!allowedMimeTypes.has(mimeType) || !Number.isInteger(size) || size <= 0 || size > maxBytes) throw new Error("INVALID_EVIDENCE_FILE");
  const timestamp = Math.floor(Date.now() / 1000); const folder = `civicsync/evidence/${userId}`; const publicId = crypto.randomUUID();
  const params = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(`${params}${apiSecret}`).digest("hex");
  return { cloudName, apiKey, timestamp, folder, publicId, signature, maxBytes, allowedMimeTypes: [...allowedMimeTypes] };
}
