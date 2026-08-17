import { NextResponse } from "next/server";

import { mangaApi } from "@/lib/manga";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const [trending, popular, topRated] = await Promise.allSettled([
      mangaApi.trending(18),
      mangaApi.popular(18),
      mangaApi.topRated(18),
    ]);
    const val = <T>(r: PromiseSettledResult<T[]>): T[] =>
      r.status === "fulfilled" ? r.value : [];
    return NextResponse.json({
      status: "ok",
      trending: val(trending),
      popular: val(popular),
      topRated: val(topRated),
      recentlyUpdated: val(popular),
    });
  } catch (e) {
    return NextResponse.json(
      { status: "error", message: e instanceof Error ? e.message : "Failed to load manga." },
      { status: 502 },
    );
  }
}
