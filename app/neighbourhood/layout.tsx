import Link from "next/link";
import type { ReactNode } from "react";
export default function NeighbourhoodLayout({ children }: { children: ReactNode }) { return <><nav aria-label="Neighbourhood navigation" className="container" style={{ display: "flex", gap: 8, paddingTop: 15 }}><Link className="navlink" href="/neighbourhood">Neighbourhood home</Link><Link className="navlink" href="/neighbourhood/report">Report an issue</Link><Link className="navlink" href="/community-partners">Community Partners</Link><Link className="navlink" href="/sponsorship">Sponsorship</Link></nav>{children}</>; }
