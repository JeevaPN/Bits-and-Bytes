import { NextResponse } from "next/server";
import { getProjectFollowForCurrentUser, setProjectFollowForCurrentUser } from "@/lib/services/neighbourhood-server";
export const dynamic = 'force-static';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { const result = await getProjectFollowForCurrentUser((await params).id); return NextResponse.json(result, { status: result.ok ? 200 : result.error.code === "FORBIDDEN" ? 401 : 503 }); }
//export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: { code: "VALIDATION", message: "Invalid JSON request." } }, { status: 400 }); } const result = await setProjectFollowForCurrentUser((await params).id, Boolean((body as { following?: unknown }).following)); return NextResponse.json(result, { status: result.ok ? 200 : result.error.code === "FORBIDDEN" ? 401 : result.error.code === "NOT_FOUND" ? 404 : 503 }); }
export function generateStaticParams() {
  return [];
}