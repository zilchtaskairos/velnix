"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Img } from "./Img";
import { watchedEpisodes } from "@/lib/stores";
import type { Anime } from "@/lib/types";

/** Generates the episode list for an anime. Honors real AniList episode counts. */
function buildEpisodes(anime: Anime): number[] {
  const eps = anime.episodes;
  if (eps && eps > 0) return Array.from({ length: eps }, (_, i) => i + 1);
  // Unknown total: show episodes aired so far if available, else a small honest default.
  if (anime.nextAiringEpisode?.episode) {
    const aired = anime.nextAiringEpisode.episode; // currently-airing ep number
    return Array.from({ length: Math.max(1, aired - 1 > 0 ? aired : 1) }, (_, i) => i + 1);
  }
  // Nothing announced — but allow at least episode 1 so the resolver can attempt playback.
  return [1];
}

export function EpisodeGrid({ anime }: { anime: Anime }) {
  const all = useMemo(() => buildEpisodes(anime), [anime]);
  const watched = watchedEpisodes.use()[anime.id] ?? [];
  const [filter, setFilter] = useState("");
  const [range, setRange] = useState<[number, number] | null>(null);

  const filtered = useMemo(() => {
    let list = all;
    if (range) list = list.filter((n) => n >= range[0] && n <= range[1]);
    if (filter.trim()) {
      const f = filter.trim().toLowerCase();
      list = list.filter((n) => String(n).includes(f));
    }
    return list;
  }, [all, filter, range]);

  const ranges: [number, number][] = [];
  for (let i = 0; i < all.length; i += 25) ranges.push([i + 1, Math.min(i + 25, all.length)]);

  const backdrop = anime.bannerImage || anime.coverImage?.url || null;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex aic gap8 wrap mb12">
        <input
          className="input"
          style={{ flex: 1, minWidth: 140, padding: "9px 12px", fontSize: 13 }}
          placeholder="Filter episodes…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <span className="chip">{all.length} episodes</span>
        <span className="chip">{watched.length} watched</span>
      </div>

      {all.length > 25 && (
        <div className="tabs mb12">
          <button className={`tab ${!range ? "active" : ""}`} onClick={() => setRange(null)}>
            All
          </button>
          {ranges.map(([a, b]) => (
            <button key={`${a}-${b}`} className={`tab ${range && range[0] === a ? "active" : ""}`} onClick={() => setRange([a, b])}>
              {a === b ? a : `${a}–${b}`}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="muted tiny">No episodes match your filter.</p>
      ) : (
        <div className="ep-grid">
          {filtered.map((n) => {
            const isWatched = watched.includes(n);
            const isLast = n === all.length;
            return (
              <Link key={n} href={`/watch/${anime.id}?episode=${n}`} className={`ep card-tap`}>
                <div className="thumb">
                  {backdrop ? <Img src={backdrop} alt="" seed={`${anime.id}-${n}`} /> : null}
                  <span className="play">▶</span>
                  <span className="epno">EP {n}</span>
                  {isLast ? <span className="filler">FINAL</span> : null}
                  {isWatched ? <span className="watched-dot">✓</span> : null}
                </div>
                <div className="meta">
                  <div className="t">
                    Episode {n}
                    {isLast ? " — Finale" : ""}
                  </div>
                  <div className="d">{anime.duration ? `${anime.duration} min` : "Tap to watch"}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
