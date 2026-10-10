import { NextResponse } from "next/server";
import { challengeIssueForCurrentUser } from "@/lib/services/neighbourhood-server";
export const dynamic = 'force-static';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { let body: { reason?: string; details?: string }; try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: { code: "VALIDATION", message: "Invalid JSON request." } }, { status: 400 }); } const result = await challengeIssueForCurrentUser({ issueId: (await params).id, reason: String(body.reason || ""), details: body.details }); return NextResponse.json(result, { status: result.ok ? 201 : result.error.code === "FORBIDDEN" ? 401 : result.error.code === "CONFLICT" ? 409 : 400 }); }
export function generateStaticParams() {
  return [];
}