import { NextResponse } from "next/server";
import { createSimulatedPledgeForCurrentUser } from "@/lib/services/neighbourhood-server";
export const dynamic = 'force-static';
export async function POST(request: Request) {
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: { code: "VALIDATION", message: "Invalid JSON request." } }, { status: 400 }); }
  const input = body as { campaignId?: string; amount?: number };
  const result = await createSimulatedPledgeForCurrentUser({ campaignId: String(input.campaignId ?? ""), amount: Number(input.amount) });
  const status = result.ok ? 201 : result.error.code === "FORBIDDEN" ? 401 : result.error.code === "NOT_FOUND" ? 404 : result.error.code === "VALIDATION" ? 422 : 503;
  return NextResponse.json(result, { status });
}
export function generateStaticParams() {
  return [];
}