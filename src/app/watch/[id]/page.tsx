"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { CharacterCarousel } from "@/components/CharacterCarousel";
import { CommentsSection } from "@/components/CommentsSection";
import { EpisodeGrid } from "@/components/EpisodeGrid";
import { Img } from "@/components/Img";
import { Section } from "@/components/Sections";
import { SongsSection } from "@/components/SongsSection";
import { VideoPlayer } from "@/components/VideoPlayer";
import { FORMAT_LABEL, SEASON_LABEL, STATUS_LABEL } from "@/lib/format";
import {
  continueWatching,
  markWatched,
  profile,
  upsertContinueWatching,
} from "@/lib/stores";
import type { Anime, PlayableSource, ResolverResponse, SubtitleTrack } from "@/lib/types";

interface ProviderInfo {
  id: string;
  label: string;
  enabled: boolean;
  capabilities: string[];
}

export default function WatchPage({ params }: { params: { id: string } }) {
  const animeId = Number(params.id);
  const search = useSearchParams();
  const episode = Number(search.get("episode")) || 1;
  const [audio, setAudio] = useState<"sub" | "dub">("sub");

  const [anime, setAnime] = useState<Anime | null>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [activeProvider, setActiveProvider] = useState<string>("");
  const [resolver, setResolver] = useState<ResolverResponse | null>(null);
  const [resolving, setResolving] = useState(true);
  const [resErr, setResErr] = useState<string | null>(null);

  const isPremium = profile.use().isPremium;
  const saved = continueWatching.use().find((c) => c.animeId === animeId);

  // Load anime metadata
  useEffect(() => {
    let alive = true;
    setAnime(null);
    fetch(`/api/anime/${animeId}`)
      .then((r) => r.json())
      .then((j) => alive && j.status === "ok" && setAnime(j.anime))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [animeId]);

  // Load providers
  useEffect(() => {
    fetch("/api/providers")
      .then((r) => r.json())
      .then((j) => {
        if (j.status === "ok") {
          setProviders(j.providers);
          if (!activeProvider && j.enabledIds?.length) setActiveProvider(j.enabledIds[0]);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve source whenever episode/provider/audio changes
  const resolve = useCallback(async () => {
    setResolving(true);
    setResErr(null);
    setResolver(null);
    try {
      const qs = new URLSearchParams({ episode: String(episode), audio });
      if (activeProvider) qs.set("provider", activeProvider);
      const res = await fetch(`/api/resolver/${animeId}?${qs}`);
      const json: ResolverResponse = await res.json();
      setResolver(json);
      if (json.status !== "ok") setResErr(json.message);
    } catch (e) {
      setResErr(e instanceof Error ? e.message : "Resolver failed.");
      setResolver({ status: "error", message: "Resolver failed." });
    } finally {
      setResolving(false);
    }
  }, [animeId, episode, audio, activeProvider]);

  useEffect(() => {
    resolve();
  }, [resolve]);

  const totalEpisodes = anime?.episodes ?? null;
  const prevHref = episode > 1 ? `/watch/${animeId}?episode=${episode - 1}` : null;
  const nextHref = !totalEpisodes || episode < totalEpisodes ? `/watch/${animeId}?episode=${episode + 1}` : null;

  const onProgress = useCallback(
    (pos: number, dur: number) => {
      if (!anime) return;
      upsertContinueWatching({
        animeId,
        animeTitle: anime.title.userPreferred || anime.title.romaji || "Untitled",
        episode,
        position: pos,
        duration: dur,
        updatedAt: Date.now(),
        coverImage: anime.coverImage?.url ?? null,
        bannerImage: anime.bannerImage ?? null,
        color: anime.coverImage?.largeColor ?? null,
      });
    },
    [anime, animeId, episode],
  );

  const onNearEnd = useCallback(() => {
    markWatched(animeId, episode);
  }, [animeId, episode]);

  const source: PlayableSource | undefined = resolver?.data?.sources?.[0];
  const subs: SubtitleTrack[] = resolver?.data?.subtitles ?? [];

  const title = anime?.title.userPreferred || anime?.title.romaji || `Anime #${animeId}`;
  const epTitle = `Episode ${episode}`;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <AppShell>
      <div className="container">
        <div className="detail-back" style={{ position: "static", width: 40, height: 40, margin: "8px 0", display: "inline-grid" }}>
          <Link href={anime ? `/anime/${anime.id}` : "/search"} aria-label="Back">
            ‹
          </Link>
        </div>

        {/* Player shell */}
        <div className="player-shell" style={{ borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
          {source && !resolving ? (
            <VideoPlayer
              sources={resolver!.data!.sources}
              subtitles={subs}
              poster={anime?.bannerImage || anime?.coverImage?.url || null}
              title={title}
              subtitle={epTitle}
              prevHref={prevHref}
              nextHref={nextHref}
              startAt={saved && saved.episode === episode ? saved.position : 0}
              onProgress={onProgress}
              onNearEnd={onNearEnd}
              note={resolver?.data?.note}
            />
          ) : resolving ? (
            <div className="player-wrap" style={{ display: "grid", placeItems: "center" }}>
              <div className="spinner" />
              <p className="muted tiny" style={{ position: "absolute", bottom: 20 }}>
                Velnix Resolver is fetching a source…
              </p>
            </div>
          ) : (
            <div className="player-wrap">
              <div className="player-unavailable">
                <div className="ic">📡</div>
                <h3 style={{ fontSize: 16 }}>No playable source currently available.</h3>
                <p className="muted tiny" style={{ maxWidth: 360 }}>
                  {resErr || "All configured providers were tried and none returned a stream."}
                </p>
                <div className="flex gap8 wrap mt8" style={{ justifyContent: "center" }}>
                  <button className="btn btn-ghost btn-sm" onClick={resolve}>
                    ↻ Retry
                  </button>
                  {nextHref ? (
                    <Link className="btn btn-outline btn-sm" href={nextHref}>
                      Next episode →
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {resolver?.data?.isSample && resolver.data.note ? (
          <div className="song-row mt12" style={{ background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.25)" }}>
            <div className="glyph" style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}>i</div>
            <div className="info">
              <div className="t" style={{ fontSize: 13 }}>Sample source</div>
              <div className="a">Playback works end-to-end with a public test stream. Add an authorized provider to stream real episodes.</div>
            </div>
          </div>
        ) : null}

        {/* Server + Audio selectors */}
        <div className="flex gap12 wrap mt12">
          <ServerSelector
            providers={providers}
            active={activeProvider}
            onChange={(id) => {
              setActiveProvider(id);
            }}
            attempts={resolver?.attempts}
          />
          <AudioSelector audio={audio} onChange={setAudio} />
        </div>

        {/* Episode headline */}
        <div className="mt16">
          <h1 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.15 }}>{title}</h1>
          <div className="muted" style={{ fontWeight: 600 }}>
            Episode {episode}
            {anime?.nextAiringEpisode ? null : ""}
          </div>
        </div>

        {/* Prev / List / Next */}
        <div className="flex gap8 wrap mt12">
          {prevHref ? (
            <Link className="btn btn-ghost btn-sm" href={prevHref}>
              ⏮ Previous
            </Link>
          ) : (
            <button className="btn btn-ghost btn-sm" disabled>
              ⏮ Previous
            </button>
          )}
          <a className="btn btn-ghost btn-sm" href="#epbrowser">
            ☰ Episode List
          </a>
          {nextHref ? (
            <Link className="btn btn-primary btn-sm" href={nextHref}>
              Next ⏭
            </Link>
          ) : (
            <button className="btn btn-ghost btn-sm" disabled>
              Next ⏭
            </button>
          )}
        </div>

        <div className="flex gap8 wrap mt12">
          <button
            className="chip"
            onClick={() => {
              if (navigator.share) navigator.share({ title, url: shareUrl }).catch(() => {});
              else if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(shareUrl);
            }}
          >
            ↗ Share
          </button>
          <a className="chip" href="#comments">
            💬 Comment
          </a>
          <span className="chip">⚠ Report</span>
          <span className="chip">{audio === "sub" ? "SUB" : "DUB"}</span>
          <span className="chip">{resolver?.data?.sources?.[0]?.quality ?? "Auto"}</span>
        </div>

        {/* About */}
        {anime ? (
          <Section title="About">
            <div className="flex gap12">
              <div className="detail-poster" style={{ width: 84, flexBasis: 84 }}>
                <Img src={anime.coverImage?.url} alt={title} seed={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="muted clamp3" style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                  {anime.description || "No description available."}
                </p>
                <div className="flex wrap gap6 mt12">
                  {anime.genres.slice(0, 4).map((g) => (
                    <Link key={g} href={`/search?q=${encodeURIComponent(g)}`} className="chip">
                      {g}
                    </Link>
                  ))}
                </div>
                <div className="fact-grid mt12" style={{ marginTop: 12 }}>
                  <Fact l="Year" v={anime.seasonYear ? String(anime.seasonYear) : "—"} />
                  <Fact l="Status" v={anime.status ? STATUS_LABEL[anime.status] ?? anime.status : "—"} />
                  <Fact l="Studio" v={anime.studios.find((s) => s.isAnimation)?.name ?? "—"} />
                  <Fact l="Rating" v={anime.averageScore ? `${(anime.averageScore / 10).toFixed(1)}/10` : "—"} />
                </div>
              </div>
            </div>
          </Section>
        ) : null}

        {/* Characters */}
        {anime && anime.characters.length ? (
          <Section title="Characters">
            <CharacterCarousel characters={anime.characters} />
          </Section>
        ) : null}

        {/* Songs */}
        {anime ? (
          <Section title="Songs & Themes">
            <SongsSection songs={anime.songs} />
          </Section>
        ) : null}

        {/* Comments */}
        <div id="comments">
          <CommentsSection animeId={animeId} episode={episode} />
        </div>

        {/* Episode browser below */}
        {anime ? (
          <div id="epbrowser" className="section">
            <div className="section-head">
              <h2 className="section-title">
                <span className="dot" /> Episodes
              </h2>
              <Link className="section-link" href={`/anime/${anime.id}`}>
                All info →
              </Link>
            </div>
            <EpisodeGrid anime={{ ...anime, episodes: anime.episodes }} />
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function Fact({ l, v }: { l: string; v: string }) {
  return (
    <div className="fact">
      <div className="l">{l}</div>
      <div className="v">{v}</div>
    </div>
  );
}

function ServerSelector({
  providers,
  active,
  onChange,
  attempts,
}: {
  providers: ProviderInfo[];
  active: string;
  onChange: (id: string) => void;
  attempts?: ResolverResponse["attempts"];
}) {
  const enabled = providers.filter((p) => p.enabled);
  const [open, setOpen] = useState(false);
  const activeLabel = enabled.find((p) => p.id === active)?.label ?? enabled[0]?.label ?? "Auto";
  const capColors: Record<string, string> = { HLS: "accent", SUB: "", DUB: "", DL: "good", EMBED: "" };

  return (
    <div style={{ position: "relative", flex: 1, minWidth: 150 }}>
      <div className="tiny faint" style={{ marginBottom: 4 }}>
        SERVER ({enabled.length})
      </div>
      <button className="input flex aic jcb" style={{ padding: "9px 12px" }} onClick={() => setOpen((o) => !o)}>
        <span>⚡ {activeLabel.replace(/^Velnix\s*/i, "")}</span>
        <span className="tiny muted">▾</span>
      </button>
      {open ? (
        <div className="panel-2" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 14, marginTop: 4, padding: 6 }}>
          {enabled.length === 0 ? (
            <div className="tiny muted" style={{ padding: 10 }}>
              No provider enabled.
            </div>
          ) : (
            enabled.map((p) => {
              const attempt = attempts?.find((a) => a.provider === p.id);
              return (
                <button
                  key={p.id}
                  className="opt"
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 10px", borderRadius: 9, fontSize: 13 }}
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex aic jcb">
                    <span style={{ fontWeight: 600 }}>
                      {p.id === active ? "✓ " : ""}
                      {p.label.replace(/^Velnix\s*/i, "")}
                    </span>
                    {attempt?.outcome === "success" ? <span className="chip good tiny">✓</span> : attempt?.outcome === "failed" ? <span className="chip tiny">✕</span> : null}
                  </div>
                  <div className="flex gap6 mt8">
                    {p.capabilities.map((c) => (
                      <span key={c} className={`chip tiny ${capColors[c] ?? ""}`} style={{ fontSize: 10, padding: "1px 6px" }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

function AudioSelector({ audio, onChange }: { audio: "sub" | "dub"; onChange: (a: "sub" | "dub") => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", minWidth: 120 }}>
      <div className="tiny faint" style={{ marginBottom: 4 }}>AUDIO</div>
      <button className="input flex aic jcb" style={{ padding: "9px 12px" }} onClick={() => setOpen((o) => !o)}>
        <span>{audio === "sub" ? "SUB" : "DUB"} ▾</span>
      </button>
      {open ? (
        <div className="panel-2" style={{ position: "absolute", top: "100%", right: 0, zIndex: 14, marginTop: 4, padding: 6, minWidth: 120 }}>
          {(["sub", "dub"] as const).map((a) => (
            <button
              key={a}
              className="opt"
              style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 10px", fontSize: 13 }}
              onClick={() => {
                onChange(a);
                setOpen(false);
              }}
            >
              {a === audio ? "✓ " : ""}
              {a === "sub" ? "Subbed" : "Dubbed"}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
