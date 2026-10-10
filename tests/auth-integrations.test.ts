import { afterEach, describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { createEvidenceUploadSignature } from "@/lib/media/cloudinary";

describe("authentication safety helpers", () => {
  it("allows only same-origin approved paths", () => {
    expect(safeRedirectPath("/neighbourhood/report")).toBe("/neighbourhood/report");
    expect(safeRedirectPath("https://example.com")).toBe("/neighbourhood");
    expect(safeRedirectPath("//example.com")).toBe("/neighbourhood");
    expect(safeRedirectPath("/unknown-admin")).toBe("/neighbourhood");
  });
});

describe("Cloudinary evidence signing", () => {
  const original = { cloud: process.env.CLOUDINARY_CLOUD_NAME, key: process.env.CLOUDINARY_API_KEY, secret: process.env.CLOUDINARY_API_SECRET };
  afterEach(() => { process.env.CLOUDINARY_CLOUD_NAME = original.cloud; process.env.CLOUDINARY_API_KEY = original.key; process.env.CLOUDINARY_API_SECRET = original.secret; });
  it("requires server configuration and rejects unsafe files", () => { delete process.env.CLOUDINARY_CLOUD_NAME; delete process.env.CLOUDINARY_API_KEY; delete process.env.CLOUDINARY_API_SECRET; expect(() => createEvidenceUploadSignature("user-1", "image/jpeg", 100)).toThrow("CLOUDINARY_NOT_CONFIGURED"); });
  it("creates a user-scoped signature without returning the API secret", () => { process.env.CLOUDINARY_CLOUD_NAME = "demo-cloud"; process.env.CLOUDINARY_API_KEY = "demo-key"; process.env.CLOUDINARY_API_SECRET = "demo-secret"; const result = createEvidenceUploadSignature("user-1", "image/jpeg", 100); expect(result.cloudName).toBe("demo-cloud"); expect(result.apiKey).toBe("demo-key"); expect(result.folder).toBe("civicsync/evidence/user-1"); expect(result).not.toHaveProperty("apiSecret"); });
});
