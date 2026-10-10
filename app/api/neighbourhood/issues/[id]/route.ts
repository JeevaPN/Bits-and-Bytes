import { NextResponse } from "next/server";
import { getPublicIssue } from "@/lib/services/neighbourhood-server";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { const result = await getPublicIssue((await params).id); return NextResponse.json(result, { status: result.ok ? 200 : result.error.code === "NOT_FOUND" ? 404 : 503 }); }
