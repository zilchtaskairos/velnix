"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ContinueWatchingSection } from "@/components/ContinueWatching";
import { AnimeCardMini } from "@/components/AnimeCard";
import { EmptyBox } from "@/components/StateBox";
import { clearContinueWatching, continueWatching, library, type LibraryStatus } from "@/lib/stores";

const ANIME_TABS: { key: string; label: string; filter?: LibraryStatus; favOnly?: boolean }[] = [
  { key: "all", label: "All" },
  { key: "WATCHING", label: "Watching", filter: "WATCHING" },
  { key: "COMPLETED", label: "Completed", filter: "COMPLETED" },
  { key: "PLANNED", label: "Plan to Watch", filter: "PLANNED" },
  { key: "PAUSED", label: "Paused", filter: "PAUSED" },
  { key: "DROPPED", label: "Dropped", filter: "DROPPED" },
  { key: "FAV", label: "★ Favorites", favOnly: true },
];

export default function LibraryPage() {
  const [kind, setKind] = useState<"anime" | "manga">("anime");
  const [tab, setTab] = useState("all");

  const lib = library.use();
  const cw = continueWatching.use();

  const entries = Object.values(lib)
    .filter((e) => e.kind === kind)
    .filter((e) => (tab === "all" ? true : tab === "FAV" ? e.favorite : e.status === tab))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const tabs = kind === "anime" ? ANIME_TABS : [{ key: "all", label: "All" }, { key: "FAV", label: "★ Favorites", favOnly: true }];

  return (
    <AppShell>
      <div className="container">
        <h1 className="section-title mt12 mb12" style={{ fontSize: 22 }}>
          <span className="dot" /> Library
        </h1>

        {kind === "anime" && cw.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Continue Watching</h2>
              <button className="section-link" onClick={() => clearContinueWatching()}>
                Clear
              </button>
            </div>
            <ContinueWatchingSection />
          </section>
        )}

        <div className="tabs mb12">
          <button className={`tab ${kind === "anime" ? "active" : ""}`} onClick={() => setKind("anime")}>
            Anime
          </button>
          <button className={`tab ${kind === "manga" ? "active" : ""}`} onClick={() => setKind("manga")}>
            Manga
          </button>
        </div>

        <div className="tabs mb12">
          {tabs.map((t) => (
            <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {entries.length === 0 ? (
          <EmptyBox
            title={`Your ${kind} library is empty`}
            message={`Add titles from any anime or manga page, or mark favorites. Browse to get started.`}
            action={
              <Link className="btn btn-primary btn-sm" href={kind === "anime" ? "/search" : "/manga"}>
                Discover {kind}
              </Link>
            }
          />
        ) : (
          <div className="flex gap12" style={{ flexDirection: "column" }}>
            {entries.map((e) => (
              <div key={`${e.kind}:${e.id}`}>
                <Link href={kind === "anime" ? `/anime/${e.id}` : `/manga/${e.id}`} className="list-row card-tap">
                  <img className="cv" src={e.coverImage || ""} alt="" loading="lazy" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex aic gap8">
                      <span style={{ fontWeight: 700, fontSize: 14 }} className="truncate">
                        {e.title}
                      </span>
                      {e.favorite ? <span style={{ color: "var(--accent-2)" }}>♥</span> : null}
                    </div>
                    <div className="tiny muted">
                      {e.status === "WATCHING" ? "Watching" : e.status === "COMPLETED" ? "Completed" : e.status === "PLANNED" ? "Plan to Watch" : e.status === "PAUSED" ? "Paused" : "Dropped"}
                      {e.kind === "anime" && e.episodesWatched ? ` · ${e.episodesWatched}${e.totalEpisodes ? `/${e.totalEpisodes}` : ""} ep` : ""}
                      {e.kind === "manga" && e.chaptersRead ? ` · ${e.chaptersRead} ch` : ""}
                      {e.rating ? ` · ★ ${e.rating}` : ""}
                    </div>
                  </div>
                  <span style={{ color: "var(--text-faint)" }}>›</span>
                </Link>
              </div>
            ))}
          </div>
        )}

        <p className="tiny faint mt16">
          Library is stored on this device for now. With an account, it syncs across devices.
        </p>
      </div>
    </AppShell>
  );
}

// Keep AnimeCardMini import used for potential future dense view.
void AnimeCardMini;
