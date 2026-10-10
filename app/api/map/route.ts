import { NextResponse } from "next/server";
import { listPublicMapRecords } from "@/lib/services/map-server";

export async function GET() {
  const result = await listPublicMapRecords();
  return NextResponse.json(result, { status: result.ok ? 200 : 503, headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}
