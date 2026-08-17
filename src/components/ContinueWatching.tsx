"use client";

import Link from "next/link";

import { continueWatching } from "@/lib/stores";
import { fmtRemaining } from "@/lib/format";

export function ContinueWatchingSection({ compact = false }: { compact?: boolean }) {
  const entries = continueWatching.use().slice(0, compact ? 6 : 12);
  if (entries.length === 0) return null;
  return (
    <div className="hrow">
      {entries.map((e) => {
        const pct = e.duration ? Math.min(100, Math.round((e.position / e.duration) * 100)) : 0;
        return (
          <Link key={e.animeId} href={`/watch/${e.animeId}?episode=${e.episode}`} className="cw-card card-tap">
            <div className="bg" style={e.bannerImage ? { backgroundImage: `url(${e.bannerImage})` } : e.color ? { background: e.color } : undefined}>
              <div className="scrim" />
              <div className="info">
                <div className="t">{e.animeTitle}</div>
                <div className="e">
                  Episode {e.episode} · {fmtRemaining(Math.max(0, e.duration - e.position))}
                </div>
              </div>
              <div className="progress-bar">
                <i style={{ width: `${pct}%` }} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
