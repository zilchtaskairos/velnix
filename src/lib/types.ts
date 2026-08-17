/**
 * Velnix — shared domain types.
 *
 * These types describe the *normalized* shape of data that flows between the
 * Velnix frontend, the Velnix backend, and the metadata/provider layers. They
 * are intentionally provider-agnostic: the frontend never sees raw provider
 * payloads, only these normalized shapes.
 */

// ───────────────────────────── Metadata ─────────────────────────────

export type AnimeFormat =
  | "TV"
  | "TV_SHORT"
  | "MOVIE"
  | "SPECIAL"
  | "OVA"
  | "ONA"
  | "MUSIC"
  | "MANGA"
  | "NOVEL"
  | "ONE_SHOT";

export type AnimeStatus =
  | "FINISHED"
  | "RELEASING"
  | "NOT_YET_RELEASED"
  | "CANCELLED"
  | "HIATUS";

export type AnimeSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";

export interface AnimeTitle {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
  userPreferred?: string | null;
}

export interface AnimeImage {
  url?: string | null;
  largeColor?: string | null;
}

export interface Studio {
  id: number;
  name: string;
  isAnimation: boolean;
}

export interface Character {
  id: number;
  name: string;
  nativeName?: string | null;
  image?: string | null;
  role: string;
  voiceActors: VoiceActor[];
}

export interface VoiceActor {
  id: number;
  name: string;
  nativeName?: string | null;
  image?: string | null;
  language?: string | null;
}

export interface Song {
  type: "OPENING" | "ENDING";
  title: string;
  artist?: string | null;
}

export interface RelatedAnime {
  id: number;
  title: string;
  coverImage?: string | null;
  bannerImage?: string | null;
  format?: string | null;
  relationType: string;
  episodes?: number | null;
  year?: number | null;
}

export interface Anime {
  id: number;
  idMal?: number | null;
  title: AnimeTitle;
  description?: string | null;
  coverImage?: AnimeImage;
  bannerImage?: string | null;
  format?: AnimeFormat | null;
  status?: AnimeStatus | null;
  episodes?: number | null;
  duration?: number | null;
  season?: AnimeSeason | null;
  seasonYear?: number | null;
  averageScore?: number | null;
  meanScore?: number | null;
  popularity?: number | null;
  genres: string[];
  studios: Studio[];
  startDate?: { year?: number | null; month?: number | null; day?: number | null } | null;
  trailer?: { id: string; site: string; thumbnail?: string | null } | null;
  nextAiringEpisode?: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  } | null;
  relations: RelatedAnime[];
  recommendations: RelatedAnime[];
  characters: Character[];
  songs: Song[];
  externalLinks?: { id: number; site: string; url: string; type: string; icon?: string | null }[];
}

// A lighter-weight card used in grids, search results, carousels.
export interface AnimeCard {
  id: number;
  title: string;
  nativeTitle?: string | null;
  coverImage?: string | null;
  bannerImage?: string | null;
  color?: string | null;
  format?: string | null;
  episodes?: number | null;
  seasonYear?: number | null;
  status?: string | null;
  genres: string[];
  averageScore?: number | null;
}

// ───────────────────────────── Resolver / Provider ─────────────────────────────

export type SourceType = "hls" | "mp4" | "dash" | "webm";

export interface PlayableSource {
  /** Fully-qualified, authorized URL the player will load directly. */
  url: string;
  type: SourceType;
  quality: string;
  label?: string;
  /** Provider that produced this source (used only for diagnostics/logs). */
  provider?: string;
}

export interface SubtitleTrack {
  url: string;
  label: string;
  srclang: string;
  default?: boolean;
}

export interface AudioTrack {
  id: string;
  label: string;
  language?: string;
}

export interface ResolvedEpisode {
  animeId: string;
  animeTitle?: string;
  episode: number;
  /** All playable sources, best-first. */
  sources: PlayableSource[];
  subtitles: SubtitleTrack[];
  audio: AudioTrack[];
  /** Filler flag surfaced by the provider when known (undefined = unknown). */
  filler?: boolean;
  /** Whether the returned stream is a sample/demo placeholder. */
  isSample?: boolean;
  /** Optional note shown to the user (e.g. sample source disclaimer). */
  note?: string;
}

export type ResolverStatus =
  | "ok"
  | "no_source"
  | "no_provider"
  | "timeout"
  | "error";

export interface ResolverResponse {
  status: ResolverStatus;
  message: string;
  /** Which providers were tried, in order, and their outcome. */
  attempts?: { provider: string; outcome: "success" | "failed" | "skipped"; detail?: string }[];
  data?: ResolvedEpisode;
}

// ───────────────────────────── Continue Watching ─────────────────────────────

export interface ContinueWatchingEntry {
  animeId: number;
  animeTitle: string;
  episode: number;
  position: number; // seconds
  duration: number; // seconds
  updatedAt: number; // epoch ms
  coverImage?: string | null;
  bannerImage?: string | null;
  color?: string | null;
}
