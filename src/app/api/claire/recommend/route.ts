/**
 * Claire recommendation endpoint.
 *
 * Claire is Velnix's recommendation layer. This endpoint runs a deterministic
 * taste-matching engine over live AniList data (no fake results): it interprets
 * the user's free-text intent + their local taste (genres from library/
 * continue-watching sent by the client), runs targeted AniList searches, and
 * scores results by genre overlap. Returns ranked cards.
 *
 * A real LLM can be dropped behind this endpoint later (see claire/README) —
 * the request/response contract stays the same.
 */

import { NextResponse } from "next/server";

import { searchAnime } from "@/lib/anilist";
import type { AnimeCard } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GENRE_KEYWORDS: Record<string, string[]> = {
  Action: ["action", "fight", "battle", "combat", "shonen", "powerful", "strong"],
  Adventure: ["adventure", "journey", "quest", "explore"],
  Romance: ["romance", "romantic", "love", "couple", "relationship", "date"],
  Comedy: ["comedy", "funny", "laugh", "hilarious", "slice of life", "cozy", "wholesome"],
  Fantasy: ["fantasy", "magic", "magical", "isekai", "reincarnat", "dragon", "elf"],
  "Sci-Fi": ["sci-fi", "scifi", "space", "robot", "mech", "cyber", "future", "ai"],
  Drama: ["drama", "emotional", "sad", "tears", "tragic"],
  Mystery: ["mystery", "detective", "crime", "whodunit", "investigation"],
  Horror: ["horror", "scary", "creepy", "ghost", "zombie"],
  "Supernatural": ["supernatural", "ghost", "demon", "vampire", "spirit"],
  Sports: ["sports", "basketball", "volleyball", "soccer", "football", "box"],
  Psychological: ["psychological", "mind", "dark", "thriller"],
};

interface ReqBody {
  text: string;
  taste?: string[]; // genres the user likes
  limit?: number;
}

export async function POST(request: Request) {
  let body: ReqBody;
  try {
    body = (await request.json()) as ReqBody;
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request." }, { status: 400 });
  }

  const text = (body.text || "").trim();
  if (!text) {
    return NextResponse.json({ status: "empty", message: "Tell me what you're in the mood for." });
  }

  const lower = text.toLowerCase();

  // 1) Detect genres from keywords + user taste.
  const detected = new Set<string>();
  for (const [genre, kws] of Object.entries(GENRE_KEYWORDS)) {
    if (kws.some((k) => lower.includes(k))) detected.add(genre);
  }
  (body.taste || []).forEach((g) => detected.add(g));

  // 2) Extract a search term: prefer a quoted phrase, else the cleanest noun run.
  let term = "";
  const quoted = text.match(/[“"']([^”"']{2,60})[”"']/);
  if (quoted) {
    term = quoted[1];
  } else {
    // strip stop words / meta phrases
    const cleaned = lower
      .replace(/(find me|recommend|something like|similar to|what should i watch|an anime where|watch after|i want|please|suggest)/g, " ")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const meaningful = cleaned.split(" ").filter((w) => w.length > 3 && !["about","with","that","this","where","which","have","main","character","becomes","something","after","next","watch","anime"].includes(w));
    term = meaningful.slice(0, 3).join(" ");
  }

  // 3) Run a few parallel AniList searches.
  const searches: Promise<AnimeCard[]>[] = [];
  const queryTerms = new Set<string>();
  if (term) queryTerms.add(term);
  // genre-based searches via the genre as a fuzzy keyword
  const genres = Array.from(detected).slice(0, 3);
  for (const g of genres) queryTerms.add(g);
  if (queryTerms.size === 0) queryTerms.add("anime");

  for (const q of Array.from(queryTerms).slice(0, 4)) {
    searches.push(
      searchAnime(q, 1, 12).then((r) => r.items).catch(() => [] as AnimeCard[]),
    );
  }

  const results = await Promise.all(searches);
  const merged = dedupe(results.flat());

  // 4) Score by genre overlap + popularity.
  const scored = merged
    .map((c) => {
      const overlap = c.genres.filter((g) => detected.has(g)).length;
      const score = overlap * 5 + (c.averageScore ? c.averageScore / 20 : 0);
      return { card: c, score };
    })
    .sort((a, b) => b.score - a.score);

  const limit = Math.min(20, body.limit || 8);
  const top = scored.slice(0, limit).map((s) => s.card);

  const reason =
    genres.length > 0
      ? `Based on your love of ${genres.slice(0, 2).join(" & ")}, here are ${top.length} picks worth your time.`
      : `Here are ${top.length} picks that match “${text}”.`;

  return NextResponse.json({
    status: top.length ? "ok" : "empty",
    message: top.length ? reason : "I couldn't find a confident match — try describing a mood or genre.",
    detected: genres,
    results: top,
  });
}

function dedupe(cards: AnimeCard[]): AnimeCard[] {
  const seen = new Set<number>();
  const out: AnimeCard[] = [];
  for (const c of cards) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}
