"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", icon: "⚚", label: "Home" },
  { href: "/search", icon: "🔎", label: "Search" },
  { href: "/pulse", icon: "⚡︎", label: "Pulse" },
  { href: "/claire", icon: "☘︎", label: "Claire" },
  { href: "/studio", icon: "✚", label: "Studio" },
  { href: "/library", icon: "📚", label: "Library" },
  { href: "/manga", icon: "📖", label: "Manga" },
  { href: "/party", icon: "🎉", label: "Party" },
  { href: "/games", icon: "🎮", label: "Games" },
  { href: "/dms", icon: "✉️", label: "DMs" },
  { href: "/notifications", icon: "🔔", label: "Notifications" },
  { href: "/premium", icon: "★", label: "Premium" },
  { href: "/profile", icon: "♛", label: "Profile" },
  { href: "/settings", icon: "⚙", label: "Settings" },
];

export function DesktopSideNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <aside className="desktop-sidenav" aria-label="Sections">
      {ITEMS.map((it) => (
        <Link key={it.href} href={it.href} className={isActive(it.href) ? "active" : ""}>
          <span className="ic" aria-hidden>
            {it.icon}
          </span>
          {it.label}
        </Link>
      ))}
    </aside>
  );
}
