import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { CharacterCarousel } from "@/components/CharacterCarousel";
import { EpisodeGrid } from "@/components/EpisodeGrid";
import { Img } from "@/components/Img";
import { LibraryActions } from "@/components/LibraryActions";
import { PosterRow, Section } from "@/components/Sections";
import { SeasonSelector } from "@/components/SeasonSelector";
import { buildSeasonGroups } from "@/lib/seasons";
import { SongsSection } from "@/components/SongsSection";
import { FORMAT_LABEL, SEASON_LABEL, STATUS_LABEL } from "@/lib/format";
import { getAnime } from "@/lib/anilist";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AnimeDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) notFound();

  let anime;
  try {
    anime = await getAnime(id);
  } catch {
    return (
      <AppShell>
        <div className="container mt24">
          <div className="state-box">
            <div className="ic">⚠</div>
            <h3>Couldn't load this anime</h3>
            <p className="muted">The metadata service may be busy. Please try again.</p>
            <Link className="btn btn-ghost btn-sm mt8" href="/search">
              Back to Search
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!anime) notFound();

  const studio = anime.studios.find((s) => s.isAnimation) ?? anime.studios[0];
  const title = anime.title.userPreferred || anime.title.romaji || anime.title.english || "Untitled";
  const groups = buildSeasonGroups(anime.id, title, anime.relations);

  return (
    <AppShell>
      <div className="container">
        {/* Backdrop + header */}
        <div className="detail-hero">
          <Img src={anime.bannerImage || anime.coverImage?.url} alt="" seed={title} style={{}} />
          <div className="scrim" />
          <Link href="/search" className="detail-back" aria-label="Back">
            ‹
          </Link>
        </div>

        <div className="detail-body">
          <div className="detail-head">
            <div className="detail-poster">
              <Img src={anime.coverImage?.url} alt={title} seed={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="detail-title" style={{ paddingBottom: 8 }}>
              <h1>{title}</h1>
              {anime.title.native ? <div className="native">{anime.title.native}</div> : null}
              <div className="flex aic gap8 wrap mt8">
                {anime.averageScore ? <span className="chip good">★ {(anime.averageScore / 10).toFixed(1)}</span> : null}
                {anime.format ? <span className="chip">{FORMAT_LABEL[anime.format] ?? anime.format}</span> : null}
                {anime.status ? <span className="chip">{STATUS_LABEL[anime.status] ?? anime.status}</span> : null}
                {anime.episodes ? <span className="chip">{anime.episodes} ep</span> : null}
              </div>
            </div>
          </div>

          {/* Watch CTA — the primary flow */}
          <div className="flex aic gap8 wrap mt16">
            <Link className="btn btn-primary" href={`/watch/${anime.id}?episode=1`}>
              ▶ Watch Episode 1
            </Link>
            <Link className="btn btn-ghost" href="#episodes">
              ☰ Episodes
            </Link>
          </div>

          <LibraryActions anime={anime} />

          {/* Description */}
          {anime.description ? (
            <p className="muted mt16" style={{ lineHeight: 1.6 }}>
              {anime.description}
            </p>
          ) : null}

          {/* Genres */}
          {anime.genres.length ? (
            <div className="genres mt16">
              {anime.genres.map((g) => (
                <Link key={g} href={`/search?q=${encodeURIComponent(g)}`} className="chip">
                  {g}
                </Link>
              ))}
            </div>
          ) : null}

          {/* Facts grid */}
          <div className="fact-grid">
            <Fact label="Season" value={anime.season ? `${SEASON_LABEL[anime.season] ?? anime.season} ${anime.seasonYear ?? ""}`.trim() : anime.seasonYear ? String(anime.seasonYear) : "—"} />
            <Fact label="Studio" value={studio?.name ?? "—"} />
            <Fact label="Format" value={anime.format ? FORMAT_LABEL[anime.format] ?? anime.format : "—"} />
            <Fact label="Status" value={anime.status ? STATUS_LABEL[anime.status] ?? anime.status : "—"} />
            <Fact label="Episodes" value={anime.episodes ? String(anime.episodes) : anime.nextAiringEpisode ? `${anime.nextAiringEpisode.episode - 1}+` : "TBA"} />
            <Fact label="Score" value={anime.averageScore ? `${(anime.averageScore / 10).toFixed(1)} / 10` : "—"} />
          </div>

          {anime.nextAiringEpisode ? (
            <div className="song-row mt16">
              <div className="glyph" style={{ background: "var(--accent-grad)" }}>⏰</div>
              <div className="info">
                <div className="t">Episode {anime.nextAiringEpisode.episode} coming soon</div>
                <div className="a">Airs in {fmtCountdown(anime.nextAiringEpisode.timeUntilAiring)}</div>
              </div>
            </div>
          ) : null}

          {/* Seasons selector */}
          <Section title="Seasons & Releases">
            <SeasonSelector groups={groups} />
          </Section>

          {/* Episodes */}
          <div id="episodes" className="section">
            <div className="section-head">
              <h2 className="section-title">
                <span className="dot" /> Episodes
              </h2>
            </div>
            <EpisodeGrid anime={anime} />
          </div>

          {/* Characters */}
          {anime.characters.length ? (
            <Section title="Characters & Voice Actors">
              <CharacterCarousel characters={anime.characters} />
            </Section>
          ) : null}

          {/* Songs */}
          <Section title="Songs & Themes">
            <SongsSection songs={anime.songs} />
          </Section>

          {/* Related */}
          {anime.relations.length ? (
            <Section title="Related">
              <PosterRow items={anime.relations.map((r) => ({ id: r.id, title: r.title, coverImage: r.coverImage, bannerImage: r.bannerImage, format: r.format, episodes: r.episodes, seasonYear: r.year, status: null, genres: [], averageScore: null }))} size="sm" />
            </Section>
          ) : null}

          {/* Recommendations */}
          {anime.recommendations.length ? (
            <Section title="Recommendations">
              <PosterRow items={anime.recommendations.map((r) => ({ id: r.id, title: r.title, coverImage: r.coverImage, bannerImage: r.bannerImage, format: r.format, episodes: r.episodes, seasonYear: r.year, status: null, genres: [], averageScore: null }))} />
            </Section>
          ) : null}

          {/* Official links (secondary) */}
          {anime.externalLinks && anime.externalLinks.length ? (
            <Section title="Official Links">
              <div className="flex wrap gap8">
                {anime.externalLinks.map((l) => (
                  <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener" className="chip">
                    {l.site} ↗
                  </a>
                ))}
              </div>
              <p className="tiny faint mt8">Official sources are secondary. The main Velnix flow stays inside Velnix Watch.</p>
            </Section>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <div className="l">{label}</div>
      <div className="v">{value}</div>
    </div>
  );
}

function fmtCountdown(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
