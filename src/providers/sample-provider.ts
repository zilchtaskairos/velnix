/**
 * Velnix Sample Provider (secondary).
 *
 * A second public test source so the Provider Router can demonstrate fallback
 * behavior. Disabled by default. Enable with VELNIX_PROVIDER_SAMPLE=1 to show
 * the router trying provider A then provider B.
 */

import "server-only";

import type { Provider, ProviderContext, ProviderResult } from "./types";

export const sampleProvider: Provider = {
  id: "sample",
  label: "Velnix Alternate Sample",
  enabled: process.env.VELNIX_PROVIDER_SAMPLE?.trim() === "1",

  async resolve(ctx: ProviderContext): Promise<ProviderResult> {
    void ctx;
    return {
      sources: [
        {
          url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          type: "hls",
          quality: "1080p",
          label: "Sample · Alternate",
          provider: "sample",
        },
      ],
      isSample: true,
      note: "Alternate sample stream.",
    };
  },
};
