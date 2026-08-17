"use client";

import Link from "next/link";

import type { SeasonGroup } from "@/lib/seasons";

export function SeasonSelector({ groups }: { groups: SeasonGroup[] }) {
  if (groups.length <= 1 && groups[0]?.items.length <= 1) return null;

  return (
    <div className="season-tabs">
      {groups.map((g) =>
        g.items.map((it, idx) => (
          <Link
            key={`${g.key}-${it.id}`}
            href={`/anime/${it.id}`}
            className={`season-tab ${it.current ? "active" : ""}`}
          >
            {g.key === "seasons" && g.items.length > 1
              ? `Season ${idx + 1}`
              : g.key === "seasons"
                ? "Main"
                : truncate(it.title, 22)}
          </Link>
        )),
      )}
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
