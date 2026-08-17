"use client";

import { library, removeLibraryEntry, setLibraryEntry, toggleFavorite } from "@/lib/stores";
import type { LibraryStatus } from "@/lib/stores";
import type { Anime } from "@/lib/types";

const STATUSES: { key: LibraryStatus; label: string }[] = [
  { key: "WATCHING", label: "Watching" },
  { key: "PLANNED", label: "Plan to Watch" },
  { key: "COMPLETED", label: "Completed" },
  { key: "PAUSED", label: "Paused" },
  { key: "DROPPED", label: "Dropped" },
];

export function LibraryActions({ anime }: { anime: Anime }) {
  const lib = library.use();
  const entry = lib[`${anime.id}`];
  const isFav = !!entry?.favorite;

  return (
    <div className="flex aic gap8 wrap mt12">
      <button
        className={`btn btn-sm ${isFav ? "btn-primary" : "btn-ghost"}`}
        onClick={() =>
          toggleFavorite(anime.id, "anime", {
            title: anime.title.userPreferred || anime.title.romaji || "Untitled",
            coverImage: anime.coverImage?.url ?? null,
            bannerImage: anime.bannerImage ?? null,
            color: anime.coverImage?.largeColor ?? null,
          })
        }
      >
        {isFav ? "♥ Saved" : "♡ Favorite"}
      </button>
      {entry ? (
        <>
          <span className="chip accent">{statusLabel(entry.status)}</span>
          <button className="btn btn-sm btn-outline" onClick={() => removeLibraryEntry(anime.id, "anime")}>
            Remove
          </button>
        </>
      ) : null}

      <details style={{ position: "relative" }}>
        <summary className="btn btn-sm btn-ghost" style={{ listStyle: "none" }}>
          {entry ? "Update" : "+ Add to Library"} ▾
        </summary>
        <div style={{ position: "absolute", right: 0, top: "110%", zIndex: 12, minWidth: 200 }} className="panel-2">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              className="opt"
              style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", fontSize: 13 }}
              onClick={() =>
                setLibraryEntry({
                  id: anime.id,
                  kind: "anime",
                  title: anime.title.userPreferred || anime.title.romaji || "Untitled",
                  coverImage: anime.coverImage?.url ?? null,
                  bannerImage: anime.bannerImage ?? null,
                  color: anime.coverImage?.largeColor ?? null,
                  status: s.key,
                  totalEpisodes: anime.episodes ?? null,
                  favorite: entry?.favorite ?? false,
                  updatedAt: Date.now(),
                })
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}

function statusLabel(s: LibraryStatus) {
  return STATUSES.find((x) => x.key === s)?.label ?? s;
}
