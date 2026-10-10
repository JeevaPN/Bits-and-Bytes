import { NextResponse } from "next/server";
import { verifyIssueForCurrentUser } from "@/lib/services/neighbourhood-server";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) { const result = await verifyIssueForCurrentUser((await params).id); return NextResponse.json(result, { status: result.ok ? 200 : result.error.code === "FORBIDDEN" ? 401 : result.error.code === "CONFLICT" ? 409 : 400 }); }
