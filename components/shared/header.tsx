"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthProfileName, AuthStatus } from "@/components/auth/auth-status";
import type { Role } from "@/lib/domain/types";
import { workspaceHome } from "@/lib/auth/workspace-access";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="theme-toggle-placeholder" aria-hidden="true" />;
  const isDark = theme === "dark";
  return <button className="theme-toggle" type="button" onClick={() => setTheme(isDark ? "light" : "dark")} aria-label={`Switch to ${isDark ? "light" : "dark"} mode`} title={`Switch to ${isDark ? "light" : "dark"} mode`}>
    {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}<span>{isDark ? "Light mode" : "Dark mode"}</span>
  </button>;
}

const publicLinks = [
  { label: "Projects", href: "/projects" },
  { label: "Map", href: "/map" },
  { label: "Community groups", href: "/community-partners" },
  { label: "Sponsorship", href: "/sponsorship" },
];

function workspaceLabel(role: Role | null) {
  if (role === "admin") return "Admin workspace";
  if (role === "group") return "Partner workspace";
  if (role === "common") return "Neighbourhood";
  return "";
}

export function Header({ workspaceRole }: { workspaceRole: Role | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [...publicLinks, ...(workspaceRole === "common" ? [{ label: "Issues", href: "/issues" }] : [])];
  const workspace = workspaceLabel(workspaceRole);
  const destination = workspaceRole ? workspaceHome(workspaceRole) : "/auth/sign-in";

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.documentElement.style.overflow = previousOverflow; document.removeEventListener("keydown", closeOnEscape); };
  }, [menuOpen]);

  function isActive(href: string) { return pathname === href || pathname.startsWith(`${href}/`); }
  function renderLinks(onClick?: () => void) {
    return <>
      {links.map(({ label, href }) => <Link className={isActive(href) ? "site-nav-link is-active" : "site-nav-link"} href={href} key={href} aria-current={isActive(href) ? "page" : undefined} onClick={onClick}>{label}</Link>)}
      {workspace && <Link className={isActive(destination) ? "site-nav-link is-active" : "site-nav-link"} href={destination} aria-current={isActive(destination) ? "page" : undefined} onClick={onClick}>{workspace}</Link>}
      {!workspace && <Link className="site-nav-link site-mobile-create" href="/auth/sign-up" onClick={onClick}>Create account</Link>}
    </>;
  }

  return <header className="site-header">
    <div className="container site-header-inner">
      <div className="site-header-left">
        <Link href="/" className="site-header-brand" aria-label="CivicSync home">Civic<span>Sync</span></Link>
      </div>
      <nav className="site-primary-nav" aria-label="Main navigation">{renderLinks()}</nav>
      <div className="site-header-actions">
        <AuthProfileName />
        <ThemeToggle />
        <AuthStatus />
        {!workspaceRole && <Link className="site-sign-up-link" href="/auth/sign-up">Create account</Link>}
        <button className="site-menu-trigger" type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="civicsync-navigation-panel" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>
    </div>
    {menuOpen && <div className="site-menu-overlay">
      <button className="site-menu-backdrop" type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} />
      <aside className="site-menu-panel" id="civicsync-navigation-panel" role="dialog" aria-modal="true" aria-label="CivicSync navigation">
        <div className="site-menu-heading"><span>Explore CivicSync</span><button className="site-menu-close" type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)}><X size={20} aria-hidden="true" /></button></div>
        <nav className="site-menu-links" aria-label="Mobile navigation">{renderLinks(() => setMenuOpen(false))}</nav>
      </aside>
    </div>}
  </header>;
}
