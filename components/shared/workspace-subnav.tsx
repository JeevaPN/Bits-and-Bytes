"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function WorkspaceSubnav({ items, label }: { items: ReadonlyArray<readonly [string, string]>; label: string }) {
  const pathname = usePathname();
  return <nav aria-label={label} className="workspace-subnav">
    {items.map(([name, href]) => {
      const active = pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} className={active ? "workspace-subnav-link is-active" : "workspace-subnav-link"} aria-current={active ? "page" : undefined}>{name}</Link>;
    })}
  </nav>;
}
