/**
 * Velnix AniList client.
 *
 * All access to the AniList metadata API goes through this module, which the
 * Velnix backend uses to serve normalized data to the frontend. The frontend
 * never calls AniList directly — keeping metadata logic server-side.
 *
 * AniList's public GraphQL endpoint is free and key-less for reads. An optional
 * ANILIST_TOKEN can be supplied (via env) to raise rate limits.
 */

import "server-only";

import {
  fallbackByGenre,
  fallbackGetAnime,
  fallbackHome,
  fallbackRecommend,
  fallbackSearch,
} from "./fallback";

import {
  MEDIA_QUERY,
  POPULAR_QUERY,
  RECOMMENDED_QUERY,
  SEARCH_QUERY,
  SEASON_QUERY,
  TOP_AIRING_QUERY,
  TRENDING_QUERY,
} from "./queries";
import type {
  Anime,
  AnimeCard,
  AnimeFormat,
  AnimeSeason,
  AnimeStatus,
  Character,
  RelatedAnime,
  Song,
  VoiceActor,
} from "./types";

const ENDPOINT =
  process.env.ANILIST_ENDPOINT?.trim() || "https://graphql.anilist.co";

const TOKEN = process.env.ANILIST_TOKEN?.trim() || "";

export class AniListError extends Error {
  constructor(
    message: string,
    readonly kind: "timeout" | "network" | "graphql" | "empty" = "network",
  ) {
    super(message);
    this.name = "AniListError";
  }
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string; status?: number }[];
}

/** Fetch helper with timeout + structured errors. */
async function gql<T>(
  query: string,
  variables: Record<string, unknown>,
  timeoutMs = 9000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
      // AniList data changes slowly; cache briefly at the edge to stay fast.
      next: { revalidate: 300 },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AniListError("AniList request timed out.", "timeout");
    }
    throw new AniListError(
      `Network error contacting AniList: ${(err as Error).message}`,
      "network",
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 429) {
    throw new AniListError("AniList rate limit reached. Please slow down.", "network");
  }
  if (!res.ok) {
    throw new AniListError(`AniList responded with HTTP ${res.status}.`, "network");
  }

  let json: GraphQLResponse<T>;
  try {
    json = (await res.json()) as GraphQLResponse<T>;
  } catch {
    throw new AniListError("Could not parse AniList response.", "network");
  }

  if (json.errors && json.errors.length) {
    throw new AniListError(json.errors.map((e) => e.message).join("; "), "graphql");
  }
  if (!json.data) {
    throw new AniListError("AniList returned no data.", "empty");
  }
  return json.data;
}

// ───────────────────────────── Mappers ─────────────────────────────

function titleOf(t?: {
  userPreferred?: string | null;
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
}) {
  return {
    userPreferred: t?.userPreferred ?? t?.romaji ?? t?.english ?? null,
    romaji: t?.romaji ?? null,
    english: t?.english ?? null,
    native: t?.native ?? null,
  };
}

function pickImage(m: {
  coverImage?: { extraLarge?: string | null; large?: string | null; medium?: string | null; color?: string | null };
}) {
  const url = m.coverImage?.extraLarge || m.coverImage?.large || m.coverImage?.medium || null;
  return { url, largeColor: m.coverImage?.color ?? null };
}

function cardFromMedia(m: Record<string, unknown>): AnimeCard {
  const t = titleOf(m.title as never);
  const c = m.coverImage as { extraLarge?: string; large?: string; color?: string } | undefined;
  return {
    id: m.id as number,
    title: t.userPreferred || "Untitled",
    nativeTitle: t.native ?? null,
    coverImage: c?.extraLarge || c?.large || null,
    bannerImage: (m.bannerImage as string | null) || null,
    color: c?.color || null,
    format: (m.format as string | null) || null,
    episodes: (m.episodes as number | null) ?? null,
    seasonYear: (m.seasonYear as number | null) ?? null,
    status: (m.status as string | null) || null,
    genres: (m.genres as string[]) || [],
    averageScore: (m.averageScore as number | null) ?? null,
  };
}

function relatedFromNode(
  node: Record<string, unknown>,
  relationType: string,
): RelatedAnime {
  const t = titleOf(node.title as never);
  const c = node.coverImage as { large?: string; extraLarge?: string } | undefined;
  return {
    id: node.id as number,
    title: t.userPreferred || "Untitled",
    coverImage: c?.extraLarge || c?.large || null,
    bannerImage: (node.bannerImage as string | null) || null,
    format: (node.format as string | null) || null,
    relationType,
    episodes: (node.episodes as number | null) ?? null,
    year: (node.seasonYear as number | null) ?? null,
  };
}

// ───────────────────────────── Public API ─────────────────────────────

export interface SearchResult {
  items: AnimeCard[];
  pageInfo: { currentPage: number; hasNextPage: boolean; total: number };
}

export async function searchAnime(
  term: string,
  page = 1,
  perPage = 20,
): Promise<SearchResult> {
  const trimmed = term.trim();
  if (!trimmed) return { items: [], pageInfo: { currentPage: 1, hasNextPage: false, total: 0 } };

  try {
    const data = await gql<{
      Page: {
        pageInfo: { currentPage: number; hasNextPage: boolean; total: number };
        media: Record<string, unknown>[];
      };
    }>(SEARCH_QUERY, { search: trimmed, page, perPage }, 9000);

    const media = data.Page?.media ?? [];
    return {
      items: media.map(cardFromMedia),
      pageInfo: data.Page?.pageInfo ?? { currentPage: page, hasNextPage: false, total: 0 },
    };
  } catch (e) {
    // Network-unreachable → use the real-data offline catalog (graceful fallback).
    if (e instanceof AniListError && (e.kind === "network" || e.kind === "timeout")) {
      return fallbackSearch(trimmed);
    }
    throw e;
  }
}

export async function getAnime(id: number): Promise<Anime | null> {
  let data: { Media: Record<string, unknown> | null };
  try {
    data = await gql<{ Media: Record<string, unknown> | null }>(MEDIA_QUERY, { id });
  } catch (e) {
    if (e instanceof AniListError && (e.kind === "network" || e.kind === "timeout")) {
      return fallbackGetAnime(id);
    }
    if (e instanceof AniListError && e.kind === "graphql") return null;
    throw e;
  }
  const m = data.Media;
  if (!m) return null;

  const t = titleOf(m.title as never);
  const img = pickImage(m);

  const relationsEdge = (m.relations as { edges?: unknown[] } | undefined)?.edges ?? [];
  const relations: RelatedAnime[] = relationsEdge
    .map((edge) => {
      const e = edge as { relationType?: string; node?: Record<string, unknown> };
      if (!e.node) return null;
      return relatedFromNode(e.node, e.relationType || "OTHER");
    })
    .filter((x): x is RelatedAnime => !!x);

  const recNodes =
    (m.recommendations as { nodes?: { recommendationMedia?: Record<string, unknown> }[] } | undefined)
      ?.nodes ?? [];
  const recommendations: RelatedAnime[] = recNodes
    .map((n) => (n.recommendationMedia ? relatedFromNode(n.recommendationMedia, "RECOMMENDATION") : null))
    .filter((x): x is RelatedAnime => !!x);

  const charEdges =
    (m.characters as { edges?: Record<string, unknown>[] } | undefined)?.edges ?? [];
  const characters: Character[] = charEdges.map((edge) => {
    const node = edge.node as {
      id: number;
      name?: { full?: string; native?: string };
      image?: { large?: string };
    } | undefined;
    const vas = (edge.voiceActors as Record<string, unknown>[] | undefined) ?? [];
    const voiceActors: VoiceActor[] = vas
      .map((va) => {
        const v = va as {
          id: number;
          name?: { full?: string; native?: string };
          image?: { large?: string };
          languageV2?: string;
        };
        return {
          id: v.id,
          name: v.name?.full || "Unknown",
          nativeName: v.name?.native ?? null,
          image: v.image?.large ?? null,
          language: v.languageV2 ?? null,
        };
      })
      .filter((v) => v.name !== "Unknown" || v.image);
    return {
      id: node?.id ?? 0,
      name: node?.name?.full || "Unknown",
      nativeName: node?.name?.native ?? null,
      image: node?.image?.large ?? null,
      role: (edge.role as string) || "Supporting",
      voiceActors,
    };
  });

  const studios = (
    (m.studios as { nodes?: { id: number; name: string; isAnimation: boolean }[] } | undefined)
      ?.nodes ?? []
  ).map((s) => ({ id: s.id, name: s.name, isAnimation: s.isAnimation }));

  // Theme songs: AniList surfaces theme-song credits via staff roles such as
  // "Opening Theme", "Ending Theme", "Theme Song Performance/Composition/Lyrics".
  // We extract those into real Song entries (artist = credited person). Song
  // *titles* come from a music database (not connected here), so we label by
  // role and keep the section honest rather than fabricating titles.
  const staffEdges =
    (m.staff as { edges?: { role?: string; node?: { name?: { full?: string } } }[] } | undefined)?.edges ?? [];
  const songs: Song[] = staffEdges
    .flatMap((edge): Song[] => {
      const role = (edge.role || "").trim();
      const name = edge.node?.name?.full || "Unknown Artist";
      const r = role.toLowerCase();
      if (r.includes("ending") || r === "ed" || r.startsWith("ed:")) {
        return [{ type: "ENDING", title: "Ending Theme", artist: name }];
      }
      if (r.includes("opening") || r === "op" || r.startsWith("op:")) {
        return [{ type: "OPENING", title: "Opening Theme", artist: name }];
      }
      if (r.includes("theme song performance") || r.includes("theme song composition") || r.includes("theme song lyrics")) {
        return [{ type: "OPENING", title: "Theme Song", artist: name }];
      }
      return [];
    })
    // Dedupe by type+artist
    .filter((x, i, arr) => arr.findIndex((y) => y.type === x.type && y.artist === x.artist) === i);

  const externalLinks = (
    (m.externalLinks as
      | { id: number; site: string; url: string; type: string; icon?: string }[]
      | undefined) ?? []
  ).map((l) => ({ id: l.id, site: l.site, url: l.url, type: l.type, icon: l.icon ?? null }));

  return {
    id: m.id as number,
    idMal: (m.idMal as number | null) ?? null,
    title: t,
    description: stripHtml(m.description as string | null),
    coverImage: img,
    bannerImage: (m.bannerImage as string | null) || null,
    format: (m.format as AnimeFormat | null) ?? null,
    status: (m.status as AnimeStatus | null) ?? null,
    episodes: (m.episodes as number | null) ?? null,
    duration: (m.duration as number | null) ?? null,
    season: (m.season as AnimeSeason | null) ?? null,
    seasonYear: (m.seasonYear as number | null) ?? null,
    averageScore: (m.averageScore as number | null) ?? null,
    meanScore: (m.meanScore as number | null) ?? null,
    popularity: (m.popularity as number | null) ?? null,
    genres: (m.genres as string[]) || [],
    studios,
    startDate: (m.startDate as never) ?? null,
    trailer: (m.trailer as never) ?? null,
    nextAiringEpisode: (m.nextAiringEpisode as never) ?? null,
    relations,
    recommendations,
    characters,
    songs,
    externalLinks,
  };
}

function stripHtml(s: string | null): string | null {
  if (!s) return null;
  return s
    .replace(/<br\s*\/?>(\s*)?/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim();
}

async function pageList(query: string, perPage: number, extra: Record<string, unknown> = {}) {
  const data = await gql<{ Page: { media: Record<string, unknown>[] } }>(
    query,
    { perPage, ...extra },
    9000,
  );
  return (data.Page?.media ?? []).map(cardFromMedia);
}

export const anilist = {
  search: searchAnime,
  get: getAnime,
  trending: async (n = 18) => withFallback(pageList(TRENDING_QUERY, n), () => fallbackHome().trending.slice(0, n)),
  popular: async (n = 18) => withFallback(pageList(POPULAR_QUERY, n), () => fallbackHome().popular.slice(0, n)),
  recommended: async (n = 18) => withFallback(pageList(RECOMMENDED_QUERY, n), () => fallbackHome().recommended.slice(0, n)),
  topAiring: async (n = 18) => withFallback(pageList(TOP_AIRING_QUERY, n), () => fallbackHome().topAiring.slice(0, n)),
  season: async (season: AnimeSeason, year: number, n = 18) =>
    withFallback(pageList(SEASON_QUERY, n, { season, year }), () => fallbackHome().popular.slice(0, n)),
};

// Try the live API; on a network/timeout failure, use the offline catalog.
async function withFallback<T>(promise: Promise<T[]>, fallback: () => T[]): Promise<T[]> {
  try {
    return await promise;
  } catch (e) {
    if (e instanceof AniListError && (e.kind === "network" || e.kind === "timeout")) {
      return fallback();
    }
    throw e;
  }
}

// Re-exported for the Claire endpoint so it can fall back too.
export { fallbackRecommend as _fallbackRecommend };
