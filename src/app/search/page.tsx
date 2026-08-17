"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { PosterGrid } from "@/components/Sections";
import { EmptyBox, ErrorBox, Loading } from "@/components/StateBox";
import { FORMAT_LABEL, STATUS_LABEL } from "@/lib/format";
import type { AnimeCard } from "@/lib/types";

type Mode = "anime" | "manga";
type Status = "idle" | "loading" | "empty" | "ok" | "error";

export default function SearchPage() {
  const [mode, setMode] = useState<Mode>("anime");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [items, setItems] = useState<AnimeCard[]>([]);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const run = useCallback(
    async (term: string, m: Mode) => {
      const trimmed = term.trim();
      if (!trimmed) {
        setStatus("idle");
        setItems([]);
        return;
      }
      const id = ++reqId.current;
      setStatus("loading");
      setError("");
      try {
        const endpoint = m === "anime" ? "/api/search" : "/api/manga-search";
        const res = await fetch(`${endpoint}?q=${encodeURIComponent(trimmed)}`);
        const json = await res.json();
        if (id !== reqId.current) return;
        const list: AnimeCard[] = json.items ?? json.results ?? [];
        setItems(list);
        if (json.status === "empty" || list.length === 0) setStatus("empty");
        else setStatus("ok");
      } catch (e) {
        if (id !== reqId.current) return;
        setError(e instanceof Error ? e.message : "Search failed.");
        setStatus("error");
      }
    },
    [],
  );

  // Debounced live search.
  useEffect(() => {
    const t = setTimeout(() => run(q, mode), 380);
    return () => clearTimeout(t);
  }, [q, mode, run]);

  return (
    <AppShell>
      <div className="container">
        <div className="searchbar mt12">
          <span className="muted" style={{ fontSize: 18 }}>🔎</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${mode === "anime" ? "anime" : "manga"}…`}
            enterKeyHint="search"
          />
          {q ? (
            <button className="btn btn-ghost btn-sm" onClick={() => setQ("")}>
              ✕
            </button>
          ) : null}
          <button className="btn btn-primary btn-sm" onClick={() => run(q, mode)}>
            Search
          </button>
        </div>

        <div className="tabs mt12">
          {(["anime", "manga"] as Mode[]).map((m) => (
            <button key={m} className={`tab ${mode === m ? "active" : ""}`} onClick={() => setMode(m)}>
              {m === "anime" ? "Anime" : "Manga"}
            </button>
          ))}
        </div>
        <p className="tiny faint mt8">
          Also try searching characters, people & studios — results open the right Velnix page. Powered by AniList.
        </p>

        <div className="mt16">
          {status === "idle" && <PopularSuggestions mode={mode} onPick={(t) => setQ(t)} />}
          {status === "loading" && <Loading label="Searching" />}
          {status === "empty" && <EmptyBox title="No results" message={`We couldn't find any ${mode} for “${q}”. Try another title or spelling.`} />}
          {status === "error" && <ErrorBox message={error} onRetry={() => run(q, mode)} />}
          {status === "ok" && <PosterGrid items={items} />}
        </div>
      </div>
    </AppShell>
  );
}

function PopularSuggestions({ mode, onPick }: { mode: Mode; onPick: (t: string) => void }) {
  const [items, setItems] = useState<AnimeCard[] | null>(null);
  useEffect(() => {
    let alive = true;
    setItems(null);
    fetch(mode === "anime" ? "/api/home" : "/api/manga")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const list = mode === "anime" ? j.trending : j.trending;
        setItems(list ?? []);
      })
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [mode]);

  const suggestions = ["Jujutsu Kaisen", "Solo Leveling", "Frieren", "Demon Slayer", "One Piece", "Chainsaw Man", "Attack on Titan", "Spy x Family"];
  return (
    <div>
      <h3 className="section-title mt8 mb12">
        <span className="dot" /> Trending {mode === "anime" ? "anime" : "manga"} to explore
      </h3>
      {items === null ? (
        <Loading label="Loading picks" />
      ) : (
        <>
          <div className="flex wrap gap8 mb16">
            {suggestions.map((s) => (
              <button key={s} className="chip" onClick={() => onPick(s)}>
                {s}
              </button>
            ))}
          </div>
          {items.length ? <PosterGrid items={items.slice(0, 18)} /> : null}
        </>
      )}
    </div>
  );
}
