import { NextResponse } from "next/server";

import { AniListError, searchAnime } from "@/lib/anilist";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || searchParams.get("query") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const perPage = Math.min(40, Math.max(1, Number(searchParams.get("perPage")) || 20));

  if (!q.trim()) {
    return NextResponse.json(
      { status: "empty", message: "Enter a search term.", items: [], pageInfo: { currentPage: 1, hasNextPage: false, total: 0 } },
      { status: 200 },
    );
  }

  try {
    const result = await searchAnime(q, page, perPage);
    if (result.items.length === 0) {
      return NextResponse.json(
        { status: "empty", message: `No results for “${q}”.`, items: [], pageInfo: result.pageInfo },
        { status: 200 },
      );
    }
    return NextResponse.json({ status: "ok", ...result });
  } catch (e) {
    const message = e instanceof AniListError ? e.message : "Search failed unexpectedly.";
    const status = e instanceof AniListError && e.kind === "timeout" ? 504 : 502;
    return NextResponse.json({ status: "error", message, items: [] }, { status });
  }
}
