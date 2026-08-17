/**
 * Velnix Resolver normalizer.
 *
 * Converts provider results into the single, frontend-facing
 * `ResolvedEpisode` shape so the Watch page never needs to know how any
 * individual provider works.
 */

import "server-only";

import type {
  AudioTrack,
  PlayableSource,
  ResolvedEpisode,
  SubtitleTrack,
} from "@/lib/types";
import type { ProviderResult } from "./types";

function normalizeType(t: string | undefined): PlayableSource["type"] {
  if (!t) return "mp4";
  const v = t.toLowerCase();
  if (v.includes("m3u8") || v.includes("hls")) return "hls";
  if (v.includes("mpd") || v.includes("dash")) return "dash";
  if (v.includes("webm")) return "webm";
  return "mp4";
}

export function normalizeEpisode(
  animeId: string,
  episode: number,
  result: ProviderResult,
  animeTitle?: string,
): ResolvedEpisode {
  const sources: PlayableSource[] = (result.sources ?? []).map((s) => ({
    url: s.url,
    type: normalizeType(s.type),
    quality: s.quality || "Auto",
    label: s.label || s.quality || "Auto",
    provider: s.provider,
  }));

  const subtitles: SubtitleTrack[] = (result.subtitles ?? []).filter(
    (s) => s && s.url,
  );
  const audio: AudioTrack[] = (result.audio ?? []).filter((a) => a && a.id);

  return {
    animeId,
    episode,
    sources,
    subtitles,
    audio,
    filler: result.filler,
    isSample: result.isSample,
    note: result.note,
    animeTitle,
  };
}
