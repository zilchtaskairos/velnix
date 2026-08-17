/**
 * Velnix Demo Provider.
 *
 * Returns PUBLIC test HLS streams (provided by their owners specifically for
 * testing video playback) so the Velnix Player can demonstrate real, working
 * playback end-to-end. Every source it returns is marked `isSample: true`.
 *
 * This provider is the default "authorized playable source" for the prototype.
 * To stream real episodes, disable this provider (VELNIX_PROVIDER_DEMO=0) and
 * enable a real provider in src/providers/authorized-provider.ts instead.
 *
 * The streams below are public sample streams hosted for playback testing:
 *  - Mux test streams (https://test-streams.mux.dev) — public test content.
 *  - Apple bipbop reference stream — public reference content.
 */

import "server-only";

import type { Provider, ProviderContext, ProviderResult } from "./types";

// Public, owner-provided test streams. Rotated by episode for variety.
const SAMPLE_STREAMS: { url: string; title: string; quality: string }[] = [
  {
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    title: "Big Buck Bunny",
    quality: "1080p",
  },
  {
    url: "https://test-streams.mux.dev/tos_ismc/main.m3u8",
    title: "Tears of Steel",
    quality: "1080p",
  },
  {
    url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8",
    title: "Apple BipBop Reference",
    quality: "720p",
  },
  {
    url: "https://test-streams.mux.dev/pts_shift/master.m3u8",
    title: "Mux Sample Stream",
    quality: "1080p",
  },
];

const SAMPLE_VTT = "https://test-streams.mux.dev/test_001/subtitles/eng/subtitle.vtt";

export const demoProvider: Provider = {
  id: "demo",
  label: "Velnix Sample Source",
  enabled: process.env.VELNIX_PROVIDER_DEMO?.trim() !== "0",

  async resolve(ctx: ProviderContext): Promise<ProviderResult> {
    // Choose a stream deterministically from the episode so navigation is stable.
    const pool = SAMPLE_STREAMS;
    const pick = pool[((ctx.episode - 1) % pool.length + pool.length) % pool.length];

    return {
      sources: [
        {
          url: pick.url,
          type: "hls",
          quality: pick.quality,
          label: `Sample · ${pick.title}`,
          provider: "demo",
        },
      ],
      subtitles: [
        { url: SAMPLE_VTT, label: "English (sample)", srclang: "en", default: false },
      ],
      audio: [],
      filler: false,
      isSample: true,
      note: `Sample stream provided for playback testing (${pick.title}). Configure an authorized provider in src/providers/authorized-provider.ts to stream real episodes.`,
    };
  },
};
