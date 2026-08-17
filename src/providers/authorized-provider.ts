/**
 * Velnix Authorized Provider (TEMPLATE).
 *
 * This is the template adapter you fill in when you have legal access to a
 * real anime provider API (e.g. a licensed partner, your own CDN, a service
 * that grants embedding/streaming rights).
 *
 * It is DISABLED by default. The resolver will only attempt it once you:
 *   - Provide real credentials via environment variables, AND
 *   - Enable it by implementing `enabled` to return true when configured.
 *
 * RESPECT ACCESS CONTROLS. Never bypass DRM, authentication, CAPTCHAs,
 * paywalls, or ToS. Only call APIs you are authorized to call.
 *
 * ── How to wire up a real provider ──────────────────────────────────
 * 1. Put credentials in .env.local (never committed):
 *        PROVIDER_MY_PARTNER_CLIENT_ID="..."
 *        PROVIDER_MY_PARTNER_CLIENT_SECRET="..."
 *        PROVIDER_MY_PARTNER_TOKEN="..."
 * 2. Implement `resolve()` to call the partner API (server-side only),
 *    map its response into PlayableSource[], and return it.
 * 3. Set `enabled` to true only when all required credentials are present.
 */

import "server-only";

import type { Provider, ProviderContext, ProviderResult } from "./types";

const CLIENT_ID = process.env.PROVIDER_AUTHORIZED_CLIENT_ID?.trim() || "";
const CLIENT_SECRET = process.env.PROVIDER_AUTHORIZED_CLIENT_SECRET?.trim() || "";
const TOKEN = process.env.PROVIDER_AUTHORIZED_TOKEN?.trim() || "";

export const authorizedProvider: Provider = {
  id: "authorized",
  label: "Authorized Partner Provider",

  // Enabled ONLY when real credentials are configured. Without them the router
  // skips this provider entirely rather than attempting an unauthorized call.
  enabled: Boolean(CLIENT_ID && CLIENT_SECRET && TOKEN),

  async resolve(ctx: ProviderContext): Promise<ProviderResult> {
    if (!this.enabled) {
      throw new Error("Authorized provider is not configured.");
    }

    // ── TEMPLATE ────────────────────────────────────────────────────────
    // Replace this block with a real, authorized call to your partner API.
    // Example (illustrative pseudo-flow):
    //
    //   const token = await getOrRefreshToken(CLIENT_ID, CLIENT_SECRET);
    //   const res = await fetch(`https://partner.example/streams`, {
    //     headers: { Authorization: `Bearer ${token}` },
    //     body: JSON.stringify({ animeId: ctx.animeId, episode: ctx.episode }),
    //   });
    //   const json = await res.json();
    //   return {
    //     sources: json.streams.map((s) => ({
    //       url: s.url, type: s.type === "m3u8" ? "hls" : "mp4",
    //       quality: s.quality, label: s.quality, provider: "authorized",
    //     })),
    //     subtitles: json.subtitles ?? [],
    //     audio: json.audio ?? [],
    //     isSample: false,
    //   };
    //
    // ────────────────────────────────────────────────────────────────────

    void ctx;
    throw new Error(
      "Authorized provider template has not been implemented yet. Add credentials and a real API call.",
    );
  },
};
