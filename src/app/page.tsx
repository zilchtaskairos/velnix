"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Brand } from "@/components/Brand";
import { ContinueWatchingSection } from "@/components/ContinueWatching";
import { Img } from "@/components/Img";
import { PosterRow, Section } from "@/components/Sections";
import { ErrorBox, Loading } from "@/components/StateBox";
import { library, profile } from "@/lib/stores";
import type { Anime, AnimeCard } from "@/lib/types";

interface MangaCard { trending: AnimeCard[] }
interface HomeData {
  hero: Anime | null;
  trending: AnimeCard[];
  topAiring: AnimeCard[];
  popular: AnimeCard[];
  recommended: AnimeCard[];
  recentlyUpdated: AnimeCard[];
  newReleases: AnimeCard[];
}

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [manga, setManga] = useState<AnimeCard[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [h, m] = await Promise.all([
        fetch("/api/home").then((r) => r.json()),
        fetch("/api/manga").then((r) => r.json().catch(() => ({}))) as Promise<MangaCard>,
      ]);
      if (h.status === "error") throw new Error(h.message);
      setData(h);
      setManga((m as MangaCard).trending ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load home feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const lib = library.use();
  const libEntries = Object.values(lib).filter((e) => e.kind === "anime").slice(0, 12);
  const isPremium = profile.use().isPremium;

  return (
    <AppShell>
      <div className="container" style={{ paddingTop: 0 }}>
        {loading && !data ? (
          <div className="mt24">
            <Loading label="Loading Velnix" />
          </div>
        ) : err ? (
          <div className="mt24">
            <ErrorBox message={err} onRetry={load} />
          </div>
        ) : (
          data && (
            <>
              <Hero anime={data.hero} />

              <Section title="Continue Watching" href="/library">
                <ContinueWatchingSection />
              </Section>

              <Section title="Trending Now">
                <PosterRow items={data.trending} />
              </Section>

              <Section title="Top Airing">
                <PosterRow items={data.topAiring} />
              </Section>

              <ClaireCard isPremium={isPremium} />

              <Section title="Recently Updated">
                <PosterRow items={data.recentlyUpdated} />
              </Section>

              <Section title="Popular on Velnix">
                <PosterRow items={data.popular} />
              </Section>

              {libEntries.length > 0 && (
                <Section title="My Library" href="/library">
                  <PosterRow items={libEntries.map((e) => ({ id: e.id, title: e.title, coverImage: e.coverImage, bannerImage: e.bannerImage, color: e.color, format: null, episodes: e.totalEpisodes ?? null, seasonYear: null, status: null, genres: [], averageScore: null }))} size="sm" />
                </Section>
              )}

              {manga.length > 0 && (
                <Section title="Manga" href="/manga">
                  <PosterRow items={manga} />
                </Section>
              )}

              <Section title="New Releases">
                <PosterRow items={data.newReleases} />
              </Section>

              <GamesPreview />

              <footer className="center mt24" style={{ padding: "30px 0 10px", color: "var(--text-faint)" }}>
                <Brand size="sm" href={null} />
                <p className="tiny mt8">© {new Date().getFullYear()} Velnix · Anime data by AniList</p>
              </footer>
            </>
          )
        )}
      </div>
    </AppShell>
  );
}

function Hero({ anime }: { anime: Anime | null }) {
  if (!anime) return null;
  const bg = anime.bannerImage || anime.coverImage?.url || null;
  return (
    <div className="hero">
      {bg ? <div className="bg" style={{ backgroundImage: `url(${bg})` }} /> : <div className="bg" style={{ background: "linear-gradient(135deg,#2a0f24,#0c0a14)" }} />}
      <div className="scrim" />
      <div className="inner fade-in">
        <div className="meta-row">
          {anime.format ? <span className="chip solid">{anime.format}</span> : null}
          {anime.seasonYear ? <span className="chip">{anime.seasonYear}</span> : null}
          {anime.averageScore ? <span className="chip good">★ {Math.round(anime.averageScore / 10).toFixed(1)}</span> : null}
        </div>
        <h1>{anime.title.userPreferred || anime.title.romaji}</h1>
        {anime.description ? <p className="desc">{anime.description}</p> : null}
        <div className="actions">
          <Link className="btn btn-primary" href={`/watch/${anime.id}?episode=1`}>
            ▶ Watch Now
          </Link>
          <Link className="btn btn-ghost" href={`/anime/${anime.id}`}>
            ⓘ More Info
          </Link>
        </div>
      </div>
    </div>
  );
}

function ClaireCard({ isPremium }: { isPremium: boolean }) {
  return (
    <section className="section">
      <Link href="/claire" className="claire-banner card-tap" style={{ display: "block" }}>
        <div className="flex aic gap12 wrap">
          <div style={{ fontSize: 34 }}>☘︎</div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Ask Claire</div>
            <div className="muted tiny">Velnix's anime assistant — “find me something like Solo Leveling”</div>
          </div>
          <div className={`chip ${isPremium ? "solid" : "accent"}`}>{isPremium ? "★ Premium" : "Free"}</div>
        </div>
      </Link>
    </section>
  );
}

function GamesPreview() {
  const games = [
    { name: "Anime Vanguard", tag: "Tower Defense", grad: "linear-gradient(135deg,#ff2e6e,#7a1340)", emoji: "🛡️" },
    { name: "Blade Ball", tag: "Action", grad: "linear-gradient(135deg,#5b8def,#1d3a6b)", emoji: "⚔️" },
    { name: "Sols RNG", tag: "RNG", grad: "linear-gradient(135deg,#a855f7,#3d1d5e)", emoji: "🎲" },
    { name: "Anime Adventures", tag: "Adventure", grad: "linear-gradient(135deg,#22c55e,#14532d)", emoji: "🗺️" },
  ];
  return (
    <Section title="Games" href="/games">
      <div className="hrow">
        {games.map((g) => (
          <Link key={g.name} href="/games" className="card-tap" style={{ width: 200, height: 110, borderRadius: "var(--radius)", background: g.grad, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 12 }}>
            <div style={{ position: "absolute", top: 10, right: 12, fontSize: 30, opacity: 0.85 }}>{g.emoji}</div>
            <div style={{ fontWeight: 800, fontSize: 15, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{g.name}</div>
            <div className="tiny" style={{ color: "rgba(255,255,255,0.85)" }}>{g.tag}</div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
