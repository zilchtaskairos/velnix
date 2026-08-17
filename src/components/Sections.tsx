"use client";

import Link from "next/link";

import { AnimeCard } from "./AnimeCard";
import type { AnimeCard as T } from "@/lib/types";

export function Section({
  title,
  href,
  children,
  action,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">
          <span className="dot" />
          {title}
        </h2>
        {action ?? (href ? <Link className="section-link" href={href}>See all →</Link> : null)}
      </div>
      {children}
    </section>
  );
}

export function PosterRow({ items, size = "md" }: { items: T[]; size?: "sm" | "md" | "lg" }) {
  return (
    <div className="hrow">
      {items.map((a) => (
        <AnimeCard key={a.id} anime={a} size={size} />
      ))}
    </div>
  );
}

export function PosterGrid({ items }: { items: T[] }) {
  return (
    <div className="grid grid-posters">
      {items.map((a) => (
        <AnimeCard key={a.id} anime={a} size="md" />
      ))}
    </div>
  );
}

export function SkeletonRow({ count = 5 }: { count?: number }) {
  return (
    <div className="hrow">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skel skel-poster" />
      ))}
    </div>
  );
}
