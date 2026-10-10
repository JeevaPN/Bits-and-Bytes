import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/lib/domain/types";
import { workspaceForPath, workspaceHome } from "@/lib/auth/workspace-access";
import { DEMO_WORKSPACE_COOKIE, isDemoWorkspace } from "@/lib/auth/demo-workspace";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const requiredRole = workspaceForPath(request.nextUrl.pathname);
  const demoWorkspace = request.cookies.get(DEMO_WORKSPACE_COOKIE)?.value;
  if (requiredRole && isDemoWorkspace(demoWorkspace)) {
    if (requiredRole === demoWorkspace) return response;
    return redirectWithCookies(request, response, workspaceHome(demoWorkspace));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll(values) { values.forEach(({ name, value, options }) => { request.cookies.set(name, value); response.cookies.set(name, value, options); }); } } });

  if (!requiredRole) {
    await supabase.auth.getUser();
    return response;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirectWithCookies(request, response, "/auth/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_role")
    .eq("id", user.id)
    .maybeSingle();

  let role = profile?.primary_role as Role | undefined;
  if (role !== "admin" && role !== "group") {
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id)
      .limit(1);
    role = memberships?.length ? "group" : "common";
  }

  const isPartnerOnboarding =
    request.nextUrl.pathname === "/community-partners/apply" ||
    request.nextUrl.pathname === "/community-partners/application-status";
  const isAllowedPartnerOnboarding =
    requiredRole === "group" &&
    isPartnerOnboarding &&
    (role === "common" || role === "group");

  if (role !== requiredRole && !isAllowedPartnerOnboarding) {
    return redirectWithCookies(request, response, workspaceHome(role ?? "common"));
  }
  return response;
}

function redirectWithCookies(request: NextRequest, source: NextResponse, path: string) {
  const destination = NextResponse.redirect(new URL(path, request.url));
  source.cookies.getAll().forEach((cookie) => destination.cookies.set(cookie));
  return destination;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
