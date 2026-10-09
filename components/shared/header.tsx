"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthStatus } from "@/components/auth/auth-status";

export function ThemeToggle() { const { theme, setTheme } = useTheme(); const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), []); if (!mounted) return <div style={{ width: 36, height: 36 }} aria-hidden="true" />; return <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer", padding: 8, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Toggle theme">{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>; }
const links = [["Projects", "/projects"], ["Map", "/map"], ["Neighbourhood", "/neighbourhood"], ["Community Partners", "/community-partners"], ["Sponsorship", "/sponsorship"]];
export function Header() { return <header style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}><div className="container" style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}><Link href="/" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.04em", color: "var(--text-primary)" }}>Civic<span style={{ color: "var(--accent)" }}>Sync</span></Link><nav aria-label="Main navigation" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>{links.map(([name, href]) => <Link className="navlink" href={href} key={href}>{name}</Link>)}</nav><div style={{ display: "flex", alignItems: "center", gap: 12 }}><ThemeToggle /><Link className="button" href="/neighbourhood">Neighbourhood</Link><AuthStatus /></div></div></header>; }
