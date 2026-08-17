/**
 * Velnix Provider interface.
 *
 * A provider is an adapter that knows how to turn an (animeId, episode) pair
 * into one or more playable streams. Providers are isolated modules so new
 * providers can be added without touching the Watch page or the frontend.
 *
 * Add a new provider by:
 *   1. Implementing `Provider` in src/providers/<name>.ts
 *   2. Registering it in src/providers/registry.ts
 *   3. Setting its enable flag in .env.local
 */

import "server-only";

import type {
  AudioTrack,
  PlayableSource,
  SubtitleTrack,
} from "@/lib/types";

export interface ProviderContext {
  animeId: string;
  episode: number;
  animeTitle?: string;
  /** Any extra normalized metadata useful to the provider (optional). */
  meta?: Record<string, unknown>;
}

export interface ProviderResult {
  sources: PlayableSource[];
  subtitles?: SubtitleTrack[];
  audio?: AudioTrack[];
  filler?: boolean;
  isSample?: boolean;
  note?: string;
}

export interface Provider {
  /** Stable identifier, e.g. "demo". */
  id: string;
  /** Human label for diagnostics/logs only — never shown as the primary UI. */
  label: string;
  /** Whether this provider should be attempted. Reads from env. */
  enabled: boolean;
  /**
   * Resolve a playable source. Throw an Error to signal this provider failed;
   * the router will record the failure and move on.
   */
  resolve(ctx: ProviderContext): Promise<ProviderResult>;
}
