import { NextResponse } from "next/server";

import { mangaApi } from "@/lib/manga";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const id = Number(ctx.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ status: "error", message: "Invalid manga id." }, { status: 400 });
  }
  try {
    const manga = await mangaApi.get(id);
    if (!manga) return NextResponse.json({ status: "empty", message: "Manga not found." }, { status: 404 });
    return NextResponse.json({ status: "ok", manga });
  } catch (e) {
    return NextResponse.json(
      { status: "error", message: e instanceof Error ? e.message : "Failed to load manga." },
      { status: 502 },
    );
  }
}
