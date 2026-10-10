import type { Role } from "@/lib/domain/types";

export function workspaceHome(_role: Role): string {
  if (_role === "admin") return "/admin";
  if (_role === "group") return "/community-partners/dashboard";
  return "/neighbourhood";
}

export function workspaceForPath(pathname: string): Role | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/neighbourhood" || pathname.startsWith("/neighbourhood/")) return "common";
  if (pathname === "/issues" || pathname.startsWith("/issues/")) return "common";
  if (pathname === "/community-partners/dashboard" || pathname.startsWith("/community-partners/dashboard/")) return "group";
  return null;
}

export function canVisitPath(role: Role | null, pathname: string): boolean {
  const requiredRole = workspaceForPath(pathname);
  return requiredRole === null || role === requiredRole;
}
