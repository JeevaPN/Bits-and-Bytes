import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/shared/header";
export const metadata: Metadata = { title: "CivicSync — Neighbourhood, in the know", description: "Public works, local issues, and community action in one transparent place." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Header />{children}<footer style={{borderTop:"1px solid var(--line)",padding:"28px 0",marginTop:72,color:"var(--muted)",fontSize:13}}><div className="container" style={{display:"flex",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}><span>© 2026 CivicSync · Demo data is clearly labelled</span><span>Built for more connected neighbourhoods</span></div></footer></body></html>; }
