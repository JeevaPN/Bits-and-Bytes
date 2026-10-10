import type { Role } from "@/lib/domain/types";

export function workspaceHome(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "group") return "/community-partners/dashboard";
  return "/neighbourhood";
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
