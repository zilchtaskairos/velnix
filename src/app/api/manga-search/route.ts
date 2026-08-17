import { NextResponse } from "next/server";

import { mangaApi } from "@/lib/manga";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  if (!q.trim()) {
    return NextResponse.json({ status: "empty", message: "Enter a search term.", results: [] });
  }
  try {
    const results = await mangaApi.search(q, 24);
    if (!results.length) {
      return NextResponse.json({ status: "empty", message: `No manga for “${q}”.`, results: [] });
    }
    return NextResponse.json({ status: "ok", results });
  } catch (e) {
    return NextResponse.json(
      { status: "error", message: e instanceof Error ? e.message : "Manga search failed.", results: [] },
      { status: 502 },
    );
  }
}
