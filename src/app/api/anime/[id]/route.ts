import { NextResponse } from "next/server";

import { AniListError, getAnime } from "@/lib/anilist";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, ctx: { params: { id: string } }) {
  const id = Number(ctx.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ status: "error", message: "Invalid anime id." }, { status: 400 });
  }

  try {
    const anime = await getAnime(id);
    if (!anime) {
      return NextResponse.json({ status: "empty", message: "Anime not found." }, { status: 404 });
    }
    return NextResponse.json({ status: "ok", anime });
  } catch (e) {
    const message = e instanceof AniListError ? e.message : "Failed to load anime.";
    const status = e instanceof AniListError && e.kind === "timeout" ? 504 : 502;
    return NextResponse.json({ status: "error", message }, { status });
  }
}
