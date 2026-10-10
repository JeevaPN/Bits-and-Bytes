import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { LightWatermark } from "@/components/shared/light-watermark";
import { ThemeProvider } from "./ThemeProvider"; // Adjust this path based on where you saved ThemeProvider.tsx
import { WorkspaceFooterLinks } from "@/components/auth/workspace-footer-links";

export const metadata: Metadata = {
  title: "CivicSync — Neighbourhood, in the know",
  description: "Public works, local issues, and community action in one transparent place.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const workspaceRole = null;

  return (
    // suppressHydrationWarning is required by next-themes to prevent mismatch errors on load
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LightWatermark />
          <Header workspaceRole={workspaceRole} />
          {children}
          <footer className="site-footer">
            <div className="container">
              <div className="site-footer-grid">
                <div className="site-footer-about">
                  <Link href="/" className="site-footer-brand">Civic<span>Sync</span></Link>
                  <p>Follow public works, report local issues, and support community-led action in one place.</p>
                </div>
                <nav aria-label="Explore CivicSync" className="site-footer-links">
                  <h2>Explore</h2>
                  <Link href="/projects">Public projects</Link>
                  <Link href="/issues">Public issue reports</Link>
                  <Link href="/map">Project map</Link>
                  <WorkspaceFooterLinks section="explore" />
                </nav>
                <nav aria-label="Get involved with CivicSync" className="site-footer-links">
                  <h2>Get involved</h2>
                  <WorkspaceFooterLinks section="involved" />
                  <Link href="/sponsorship">Community sponsorship</Link>
                </nav>
                <nav aria-label="CivicSync workspaces" className="site-footer-links">
                  <h2>Workspaces</h2>
                  <WorkspaceFooterLinks section="workspaces" />
                </nav>
              </div>
              <div className="site-footer-bottom">
                <span>© 2026 CivicSync · Demo data is clearly labelled</span>
                <span>Built for more connected neighbourhoods</span>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
