"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthProfileName, AuthStatus } from "@/components/auth/auth-status";
import type { Role } from "@/lib/domain/types";
import { canVisitPath } from "@/lib/auth/workspace-access";
import { getCurrentWorkspaceRole } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/browser";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="theme-toggle-placeholder" aria-hidden="true" />;

  const isDark = theme === "dark";
  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
const links = [["Projects", "/projects"], ["Open Issues", "/issues"], ["Map", "/map"], ["Neighbourhood", "/neighbourhood"], ["Community Partners", "/community-partners"], ["Sponsorship", "/sponsorship"], ["Admin", "/admin"]];
export function Header({ workspaceRole }: { workspaceRole: Role | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(workspaceRole);
  const visibleLinks = links.filter(([, href]) => canVisitPath(activeRole, href));
  const sectionForPath: Record<string, string> = {
    "/projects": "public-projects",
    "/issues": "public-issues",
    "/sponsorship": "sponsorship",
    "/admin": "workspace",
    "/neighbourhood": "workspace",
    "/community-partners": "workspace",
  };
  const onUnifiedHome = pathname === "/" && activeRole !== null;
  const workspaceLabel = activeRole === "admin"
    ? "Admin"
    : activeRole === "common"
      ? "Neighbourhood"
      : activeRole === "group"
        ? "Comm-Partner"
        : null;

  useEffect(() => {
    let active = true;
    const client = createClient();
    if (!client) return;
    const refreshRole = () => {
      void getCurrentWorkspaceRole().then((role) => {
        if (active) setActiveRole(role);
      });
    };
    refreshRole();
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) setActiveRole(null);
      else refreshRole();
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.documentElement.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <header className="site-header" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
      <div className="container site-header-inner">
        <div className="site-header-left">
          <AuthProfileName />
          <button
            className="site-menu-trigger"
            suppressHydrationWarning
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="civicsync-navigation-panel"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
          </button>
          <Link href="/" className="site-header-brand">Civic<span>Sync</span></Link>
        </div>
        <div className="site-header-actions">
          {workspaceLabel && <span className="site-workspace-badge" aria-label={`Current workspace: ${workspaceLabel}`}>{workspaceLabel}</span>}
          <ThemeToggle />
          <AuthStatus />
        </div>
      </div>

      {menuOpen && (
        <div className="site-menu-overlay">
          <button
            className="site-menu-backdrop"
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className="site-menu-panel"
            id="civicsync-navigation-panel"
            role="dialog"
            aria-modal="true"
            aria-label="CivicSync navigation"
          >
            <div className="site-menu-heading">
              <span>Navigate</span>
              <button className="site-menu-close" type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <nav className="site-menu-links" aria-label="Main navigation">
              {visibleLinks.map(([name, href]) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                const destination = onUnifiedHome && href !== "/map" && sectionForPath[href] ? `/#${sectionForPath[href]}` : href;
                return (
                  <Link
                    className={active ? "navlink navlink-active" : "navlink"}
                    href={destination}
                    key={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {name}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}
