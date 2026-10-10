import { NextResponse } from "next/server";
import { confirmTaskForCurrentUser } from "@/lib/services/neighbourhood-server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: { code: "VALIDATION", message: "Invalid JSON request." } }, { status: 400 }); }
  const input = body as { decision?: string; reason?: string };
  if (input.decision !== "confirmed" && input.decision !== "disputed") return NextResponse.json({ ok: false, error: { code: "VALIDATION", message: "Choose confirmed or disputed." } }, { status: 422 });
  const result = await confirmTaskForCurrentUser({ taskId: (await params).id, decision: input.decision, reason: input.reason });
  const status = result.ok ? 201 : result.error.code === "FORBIDDEN" ? 401 : result.error.code === "NOT_FOUND" ? 404 : result.error.code === "CONFLICT" ? 409 : result.error.code === "VALIDATION" ? 422 : 503;
  return NextResponse.json(result, { status });
}
