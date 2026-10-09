import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/shared/header";
import { ThemeProvider } from "./ThemeProvider"; // Adjust this path based on where you saved ThemeProvider.tsx

export const metadata: Metadata = {
  title: "CivicSync — Neighbourhood, in the know",
  description: "Public works, local issues, and community action in one transparent place.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning is required by next-themes to prevent mismatch errors on load
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Header />
          {children}
          <footer
            style={{
              borderTop: "1px solid var(--border)",
              padding: "28px 0",
              marginTop: 72,
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            <div
              className="container"
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <span>© 2026 CivicSync · Demo data is clearly labelled</span>
              <span>Built for more connected neighbourhoods</span>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}