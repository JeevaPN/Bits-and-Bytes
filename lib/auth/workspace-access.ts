import type { Role } from "@/lib/domain/types";

export function workspaceHome(_role: Role): string {
  return "/";
}

export function workspaceForPath(pathname: string): Role | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/neighbourhood" || pathname.startsWith("/neighbourhood/")) return "common";
  if (pathname === "/community-partners" || pathname.startsWith("/community-partners/")) return "group";
  return null;
}

export function canVisitPath(role: Role | null, pathname: string): boolean {
  const requiredRole = workspaceForPath(pathname);
  return requiredRole === null || role === requiredRole;
}
