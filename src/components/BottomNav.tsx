"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", icon: "⚚", label: "Home", match: (p: string) => p === "/" },
  { href: "/pulse", icon: "⚡︎", label: "Pulse", match: (p: string) => p.startsWith("/pulse") },
  { href: "/claire", icon: "☘︎", label: "Claire", match: (p: string) => p.startsWith("/claire") },
  { href: "/studio", icon: "✚", label: "Studio", match: (p: string) => p.startsWith("/studio") },
  { href: "/library", icon: "📚", label: "Library", match: (p: string) => p.startsWith("/library") || p.startsWith("/manga") },
  { href: "/profile", icon: "♛", label: "Profile", match: (p: string) => p.startsWith("/profile") },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottomnav" aria-label="Primary">
      {ITEMS.map((it) => (
        <Link key={it.href} href={it.href} className={it.match(pathname) ? "active" : ""} aria-current={it.match(pathname) ? "page" : undefined}>
          <span className="ic" aria-hidden>
            {it.icon}
          </span>
          <span>{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
