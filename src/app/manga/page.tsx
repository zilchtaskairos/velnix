"use client";

import { useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { PosterRow, Section } from "@/components/Sections";
import { ErrorBox, Loading } from "@/components/StateBox";
import type { AnimeCard } from "@/lib/types";

interface MangaData {
  trending: AnimeCard[];
  popular: AnimeCard[];
  topRated: AnimeCard[];
  recentlyUpdated: AnimeCard[];
}

export default function MangaPage() {
  const [data, setData] = useState<MangaData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const j = await fetch("/api/manga").then((r) => r.json());
      if (j.status === "error") throw new Error(j.message);
      setData(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load manga.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell>
      <div className="container">
        <h1 className="section-title mt12 mb12" style={{ fontSize: 22 }}>
          <span className="dot" /> Manga
        </h1>

        {loading ? (
          <Loading label="Loading manga" />
        ) : err ? (
          <ErrorBox message={err} onRetry={load} />
        ) : data ? (
          <>
            <Section title="Trending Manga">
              <PosterRow items={data.trending} />
            </Section>
            <Section title="Popular">
              <PosterRow items={data.popular} />
            </Section>
            <Section title="Top Rated">
              <PosterRow items={data.topRated} />
            </Section>
            <Section title="Recently Updated">
              <PosterRow items={data.recentlyUpdated} />
            </Section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
