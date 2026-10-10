"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthStatus } from "@/components/auth/auth-status";

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
const links = [["Projects", "/projects"], ["Map", "/map"], ["Neighbourhood", "/neighbourhood"], ["Community Partners", "/community-partners"], ["Sponsorship", "/sponsorship"], ["Admin", "/admin"]];
export function Header() {
  const pathname = usePathname();

  return <header style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
    <div className="container" style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
      <Link href="/" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.04em", color: "var(--text-primary)" }}>Civic<span style={{ color: "var(--accent)" }}>Sync</span></Link>
      <nav aria-label="Main navigation" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {links.map(([name, href]) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return <Link className={active ? "navlink navlink-active" : "navlink"} href={href} key={href} aria-current={active ? "page" : undefined}>{name}</Link>;
        })}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}><ThemeToggle /><AuthStatus /></div>
    </div>
  </header>;
}
