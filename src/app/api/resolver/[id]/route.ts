/**
 * Velnix Resolver — the single endpoint the Watch page calls.
 *
 *   GET /api/resolver/[id]?episode=N[&audio=sub|dub][&provider=X]
 *
 * Returns a normalized `ResolverResponse`. The frontend never sees provider
 * internals. The Provider Router tries each enabled provider in order and
 * returns the first usable source; failures cascade to the next provider.
 */

import { NextResponse } from "next/server";

import { getAnime } from "@/lib/anilist";
import { resolveSource } from "@/providers/router";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request, ctx: { params: { id: string } }) {
  const id = String(ctx.params.id);
  const { searchParams } = new URL(request.url);
  const episode = Number(searchParams.get("episode")) || 1;
  const audio = (searchParams.get("audio") as "sub" | "dub") || "sub";
  const requestedProvider = searchParams.get("provider") || undefined;

  // Resolve anime title for nicer responses / provider context.
  let animeTitle: string | undefined;
  try {
    const anime = await getAnime(Number(id));
    animeTitle = anime?.title.userPreferred || anime?.title.english || undefined;
  } catch {
    /* metadata unavailable — resolver can still proceed without it */
  }

  const response = await resolveSource({
    animeId: id,
    episode,
    animeTitle,
    meta: { audio, requestedProvider },
  });

  // If a specific provider was requested but isn't the one that won, the
  // router still returns the best available source — surfaced via attempts.
  return NextResponse.json(response, {
    status: response.status === "ok" ? 200 : response.status === "timeout" ? 504 : 502,
  });
}
