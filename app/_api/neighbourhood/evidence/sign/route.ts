import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/authorization";
import { createEvidenceUploadSignature } from "@/lib/media/cloudinary";
export const dynamic = 'force-static';
export async function POST(request: Request) { const user = await requireCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); let body: { mimeType?: string; size?: number }; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); } try { return NextResponse.json(createEvidenceUploadSignature(user.id, String(body.mimeType || ""), Number(body.size || 0))); } catch (error) { const message = error instanceof Error ? error.message : "UPLOAD_UNAVAILABLE"; const status = message === "CLOUDINARY_NOT_CONFIGURED" ? 503 : 400; return NextResponse.json({ error: status === 503 ? "Evidence upload is not configured." : "Unsupported evidence file." }, { status }); } }
export function generateStaticParams() {
  return [];
}