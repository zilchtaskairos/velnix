import { NextResponse } from "next/server";

import { AniListError, anilist, getAnime, searchAnime } from "@/lib/anilist";
import type { AnimeCard } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    // Hero: default to Bleach: Thousand-Year Blood War per spec.
    let hero = null;
    try {
      const sr = await searchAnime("Bleach: Thousand-Year Blood War", 1, 5);
      const target = sr.items.find((i) => /thousand.year|tybw/i.test(i.title)) ?? sr.items[0];
      if (target) hero = await getAnime(target.id);
    } catch {
      hero = null;
    }

    const [trending, topAiring, popular, recommended] = await Promise.allSettled([
      anilist.trending(18),
      anilist.topAiring(18),
      anilist.popular(18),
      anilist.recommended(18),
    ]);

    const val = <T>(r: PromiseSettledResult<T[]>): T[] =>
      r.status === "fulfilled" ? r.value : [];
    const valHero = (r: PromiseSettledResult<unknown>) =>
      r.status === "fulfilled" ? r.value : null;

    // If hero failed, derive it from trending.
    if (!hero) {
      const t = val(trending);
      if (t.length) {
        try {
          hero = await getAnime(t[0].id);
        } catch {
          hero = null;
        }
      }
    }

    return NextResponse.json({
      status: "ok",
      hero,
      trending: val(trending),
      topAiring: val(topAiring),
      popular: val(popular),
      recommended: val(recommended),
      recentlyUpdated: val(topAiring),
      newReleases: (val(popular) as AnimeCard[]).slice(0, 12),
    });
  } catch (e) {
    const message = e instanceof AniListError ? e.message : "Failed to load home feed.";
    return NextResponse.json({ status: "error", message }, { status: 502 });
  }
}
