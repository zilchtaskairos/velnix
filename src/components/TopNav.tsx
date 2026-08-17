"use client";

import Link from "next/link";

import { Brand } from "./Brand";
import { notifications, dms } from "@/lib/stores";

export function TopNav() {
  const unread = notifications.use().filter((n) => !n.read).length;
  const dmConvos = dms.use();
  return (
    <header className="topnav">
      <Brand size="md" />
      <div className="spacer" />
      <Link href="/dms" className="iconbtn" aria-label="Direct messages">
        <Icon name="dm" />
        {dmConvos.some((c) => c.messages.some((m) => m.from === "them")) && (
          <span className="dot-badge" />
        )}
      </Link>
      <Link href="/notifications" className="iconbtn" aria-label="Notifications">
        <Icon name="bell" />
        {unread > 0 && <span className="dot-badge" />}
      </Link>
      <Link href="/search" className="iconbtn" aria-label="Search">
        <Icon name="search" />
      </Link>
    </header>
  );
}

function Icon({ name }: { name: "dm" | "bell" | "search" }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "dm")
    return (
      <svg {...common}>
        <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.3-4.9A8.38 8.38 0 0 1 3.5 11 8.5 8.5 0 0 1 12 2.5 8.38 8.38 0 0 1 21 11.5z" />
      </svg>
    );
  if (name === "bell")
    return (
      <svg {...common}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
