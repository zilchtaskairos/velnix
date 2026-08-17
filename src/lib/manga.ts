/**
 * Velnix — AniList manga client.
 * Mirrors the anime client but queries type: MANGA. Used for manga discovery,
 * details, and chapter lists. AniList provides cover/title/author/genres but
 * not page images, so the reader uses a clean vertical layout placeholder that
 * a licensed manga provider can fill via the same provider-adapter pattern.
 */

import "server-only";

import type { AnimeCard } from "./types";

const ENDPOINT = process.env.ANILIST_ENDPOINT?.trim() || "https://graphql.anilist.co";
const TOKEN = process.env.ANILIST_TOKEN?.trim() || "";

export interface Manga {
  id: number;
  title: string;
  nativeTitle?: string | null;
  description?: string | null;
  coverImage?: string | null;
  bannerImage?: string | null;
  color?: string | null;
  format?: string | null;
  status?: string | null;
  chapters?: number | null;
  volumes?: number | null;
  averageScore?: number | null;
  seasonYear?: number | null;
  genres: string[];
  authors: { name: string; role: string }[];
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
      next: { revalidate: 300 },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
    const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
    if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
    return json.data as T;
  } finally {
    clearTimeout(timer);
  }
}

function cardFrom(m: Record<string, unknown>): AnimeCard {
  const t = m.title as { userPreferred?: string; native?: string };
  const c = m.coverImage as { extraLarge?: string; large?: string; color?: string } | undefined;
  return {
    id: m.id as number,
    title: t.userPreferred || "Untitled",
    nativeTitle: t.native ?? null,
    coverImage: c?.extraLarge || c?.large || null,
    bannerImage: (m.bannerImage as string | null) || null,
    color: c?.color || null,
    format: (m.format as string | null) || null,
    episodes: (m.chapters as number | null) ?? null,
    seasonYear: (m.startDate as { year?: number })?.year ?? null,
    status: (m.status as string | null) || null,
    genres: (m.genres as string[]) || [],
    averageScore: (m.averageScore as number | null) ?? null,
  };
}

const CARD = `
  id
  title { userPreferred romaji english native }
  coverImage { extraLarge large color }
  bannerImage
  format status chapters volumes
  startDate { year }
  averageScore
  genres
`;

const TRENDING_MANGA = `query($n:Int!){Page(page:1,perPage:$n){media(type:MANGA,sort:TRENDING_DESC){${CARD}}}}`;
const POPULAR_MANGA = `query($n:Int!){Page(page:1,perPage:$n){media(type:MANGA,sort:POPULARITY_DESC){${CARD}}}}`;
const TOP_RATED_MANGA = `query($n:Int!){Page(page:1,perPage:$n){media(type:MANGA,sort:SCORE_DESC){${CARD}}}}`;
const SEARCH_MANGA = `query($s:String!,$n:Int!){Page(page:1,perPage:$n){media(type:MANGA,search:$s,sort:SEARCH_MATCH){${CARD}}}}`;

const MANGA_DETAILS = `
query($id:Int!){
  Media(id:$id,type:MANGA){
    id
    title { userPreferred romaji english native }
    description(asHtml:false)
    coverImage { extraLarge large color }
    bannerImage
    format status chapters volumes
    startDate { year }
    seasonYear
    averageScore
    genres
    staff(perPage:8){edges{role node{name}}}
  }
}
`;

export const mangaApi = {
  async trending(n = 18): Promise<AnimeCard[]> {
    try {
      const d = await gql<{ Page: { media: Record<string, unknown>[] } }>(TRENDING_MANGA, { n });
      return d.Page.media.map(cardFrom);
    } catch {
      return MALL.slice(0, n).map(mToCard);
    }
  },
  async popular(n = 18): Promise<AnimeCard[]> {
    try {
      const d = await gql<{ Page: { media: Record<string, unknown>[] } }>(POPULAR_MANGA, { n });
      return d.Page.media.map(cardFrom);
    } catch {
      return [...MALL].sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0)).slice(0, n).map(mToCard);
    }
  },
  async topRated(n = 18): Promise<AnimeCard[]> {
    try {
      const d = await gql<{ Page: { media: Record<string, unknown>[] } }>(TOP_RATED_MANGA, { n });
      return d.Page.media.map(cardFrom);
    } catch {
      return [...MALL].sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0)).slice(0, n).map(mToCard);
    }
  },
  async search(term: string, n = 18): Promise<AnimeCard[]> {
    try {
      const d = await gql<{ Page: { media: Record<string, unknown>[] } }>(SEARCH_MANGA, { term, n });
      return d.Page.media.map(cardFrom);
    } catch {
      return fbMangaSearch(term).slice(0, n);
    }
  },
  async get(id: number): Promise<Manga | null> {
    try {
      const d = await gql<{ Media: Record<string, unknown> }>(MANGA_DETAILS, { id });
      const m = d.Media;
      if (!m) return MALL.find((x) => x.id === id) ?? null;
      const t = m.title as { userPreferred?: string; native?: string };
      const c = m.coverImage as { extraLarge?: string; large?: string; color?: string } | undefined;
      const staff = (m.staff as { edges?: { role: string; node: { name: string } }[] })?.edges ?? [];
      return {
        id: m.id as number,
        title: t.userPreferred || "Untitled",
        nativeTitle: t.native ?? null,
        description: stripHtml(m.description as string | null),
        coverImage: c?.extraLarge || c?.large || null,
        bannerImage: (m.bannerImage as string | null) || null,
        color: c?.color || null,
        format: (m.format as string | null) || null,
        status: (m.status as string | null) || null,
        chapters: (m.chapters as number | null) ?? null,
        volumes: (m.volumes as number | null) ?? null,
        averageScore: (m.averageScore as number | null) ?? null,
        seasonYear: (m.startDate as { year?: number })?.year ?? null,
        genres: (m.genres as string[]) || [],
        authors: staff.map((s) => ({ name: s.node.name, role: s.role })),
      };
    } catch {
      return MALL.find((x) => x.id === id) ?? null;
    }
  },
};

function stripHtml(s: string | null): string | null {
  if (!s) return null;
  return s.replace(/<br\s*\/?>(\s*)?/gi, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}

// ───────────────────────────── Offline fallback (manga) ─────────────────────────────
// Same pattern as the anime catalog: real manga metadata used ONLY when AniList
// is unreachable. IDs live in a dedicated range (30000001+).

interface CompactManga {
  t: string;
  n?: string;
  f: string;
  st: string;
  ch: number | null;
  yr: number;
  sc: number | null;
  g: string[];
  author: string;
  artist?: string;
  d: string;
}

const MC: CompactManga[] = [
  { t: "One Piece", n: "ONE PIECE", f: "MANGA", st: "RELEASING", ch: 1100, yr: 1997, sc: 89, g: ["Action", "Adventure", "Comedy", "Fantasy"], author: "Eiichiro Oda", d: "Monkey D. Luffy and his crew search for the legendary One Piece treasure in the Great Pirate Era." },
  { t: "Jujutsu Kaisen", n: "呪術廻戦", f: "MANGA", st: "FINISHED", ch: 271, yr: 2018, sc: 84, g: ["Action", "Supernatural", "Fantasy"], author: "Gege Akutami", d: "Yuji Itadori joins a school of jujutsu sorcerers to fight cursed spirits after swallowing a cursed finger." },
  { t: "Chainsaw Man", n: "チェンソーマン", f: "MANGA", st: "RELEASING", ch: 180, yr: 2019, sc: 86, g: ["Action", "Supernatural", "Horror"], author: "Tatsuki Fujimoto", d: "A poor young man fuses with a chainsaw devil and joins the devil hunters." },
  { t: "Berserk", n: "ベルセルク", f: "MANGA", st: "RELEASING", ch: 374, yr: 1989, sc: 91, g: ["Action", "Adventure", "Dark Fantasy", "Drama", "Horror"], author: "Kentaro Miura", d: "The lone mercenary Guts battles demons and his former friend Griffith in a dark medieval world." },
  { t: "Solo Leveling", n: "나 혼자만 레벨업", f: "MANGA", st: "FINISHED", ch: 179, yr: 2018, sc: 85, g: ["Action", "Adventure", "Fantasy"], author: "Chugong", artist: "DUBU (REDICE Studio)", d: "The world's weakest hunter gains the ability to level up without limit." },
  { t: "Demon Slayer", n: "鬼滅の刃", f: "MANGA", st: "FINISHED", ch: 205, yr: 2016, sc: 82, g: ["Action", "Supernatural", "Historical"], author: "Koyoharu Gotouge", d: "Tanjiro becomes a demon slayer to avenge his family and cure his sister." },
  { t: "Spy x Family", n: "SPY×FAMILY", f: "MANGA", st: "RELEASING", ch: 100, yr: 2019, sc: 81, g: ["Action", "Comedy", "Slice of Life"], author: "Tatsuya Endo", d: "A spy, assassin and telepathic child form a fake family for a mission." },
  { t: "My Hero Academia", n: "僕のヒーローアカデミア", f: "MANGA", st: "FINISHED", ch: 430, yr: 2014, sc: 78, g: ["Action", "Comedy"], author: "Kohei Horikoshi", d: "A quirkless boy inherits a legendary power and trains to become the greatest hero." },
  { t: "Attack on Titan", n: "進撃の巨人", f: "MANGA", st: "FINISHED", ch: 139, yr: 2009, sc: 86, g: ["Action", "Drama", "Fantasy", "Mystery"], author: "Hajime Isayama", d: "Humanity fights for survival behind enormous walls against man-eating Titans." },
  { t: "Tokyo Revengers", n: "東京卍リベンジャーズ", f: "MANGA", st: "FINISHED", ch: 278, yr: 2017, sc: 75, g: ["Action", "Drama", "Supernatural"], author: "Ken Wakui", d: "A loser time-leaps to save his ex-girlfriend by rewriting a biker gang's future." },
  { t: "Kingdom", n: "キングダム", f: "MANGA", st: "RELEASING", ch: 800, yr: 2006, sc: 87, g: ["Action", "Adventure", "Historical"], author: "Yasuhisa Hara", d: "An orphan slave and a young king forge an alliance to unify ancient China's warring states." },
  { t: "Vagabond", n: "バガボンド", f: "MANGA", st: "HIATUS", ch: 327, yr: 1998, sc: 90, g: ["Action", "Adventure", "Historical", "Drama"], author: "Takehiko Inoue", d: "The legendary swordsman Miyamoto Musashi seeks the meaning of true strength." },
  { t: "Vinland Saga", n: "ヴィンランド・サガ", f: "MANGA", st: "RELEASING", ch: 207, yr: 2005, sc: 85, g: ["Action", "Adventure", "Drama", "Historical"], author: "Makoto Yukimura", d: "A Viking warrior seeks revenge and ultimately a peaceful land called Vinland." },
  { t: "Blue Lock", n: "ブルーロック", f: "MANGA", st: "RELEASING", ch: 300, yr: 2018, sc: 80, g: ["Sports", "Drama"], author: "Muneyuki Kaneshiro", artist: "Yusuke Nomura", d: "Japan's top strikers compete in a brutal program to forge the ultimate egoist." },
  { t: "Kaiju No. 8", n: "怪獣8号", f: "MANGA", st: "RELEASING", ch: 120, yr: 2020, sc: 80, g: ["Action", "Sci-Fi"], author: "Naoya Matsumoto", d: "A cleanup-crew worker gains kaiju powers and pursues his dream of joining the Defense Force." },
  { t: "Oshi no Ko", n: "推しの子", f: "MANGA", st: "RELEASING", ch: 160, yr: 2020, sc: 82, g: ["Drama", "Supernatural", "Psychological"], author: "Aka Akasaka", artist: "Mengo Yokoyari", d: "Reincarnated twins navigate the dark side of the entertainment industry." },
  { t: "Frieren: Beyond Journey's End", n: "葬送のフリーレン", f: "MANGA", st: "RELEASING", ch: 140, yr: 2020, sc: 89, g: ["Adventure", "Drama", "Fantasy"], author: "Kanehito Yamada", artist: "Tsukasa Abe", d: "An elf mage outlives her hero party and journeys to understand the humans she travelled with." },
  { t: "Goodbye, Eri", f: "MANGA", st: "FINISHED", ch: 1, yr: 2022, sc: 84, g: ["Drama", "Psychological"], author: "Tatsuki Fujimoto", d: "A boy documents his life after a family tragedy in a one-shot about film and grief." },
  { t: "Look Back", f: "MANGA", st: "FINISHED", ch: 1, yr: 2021, sc: 87, g: ["Drama", "Slice of Life"], author: "Tatsuki Fujimoto", d: "Two girls bonded by drawing face tragedy in this acclaimed one-shot about art and friendship." },
  { t: "Spy Classroom", n: "スパイ教室", f: "MANGA", st: "RELEASING", ch: 90, yr: 2020, sc: 72, g: ["Action", "Comedy"], author: "Takemachi", d: "The world's worst spy academy students tackle impossible espionage missions." },
];

const MBASE = 30000001;
const MALL: Manga[] = MC.map((c, i) => ({
  id: MBASE + i,
  title: c.t,
  nativeTitle: c.n ?? null,
  description: c.d,
  coverImage: null,
  bannerImage: null,
  color: ["#ff2e6e", "#5b8def", "#a855f7", "#22c55e", "#f59e0b", "#06b6d4"][i % 6],
  format: c.f,
  status: c.st,
  chapters: c.ch,
  volumes: c.ch ? Math.ceil(c.ch / 8) : null,
  averageScore: c.sc,
  seasonYear: c.yr,
  genres: c.g,
  authors: [
    { name: c.author, role: c.artist ? "Story" : "Story & Art" },
    ...(c.artist ? [{ name: c.artist, role: "Art" }] : []),
  ],
}));

function mToCard(m: Manga): AnimeCard {
  return {
    id: m.id,
    title: m.title,
    nativeTitle: m.nativeTitle,
    coverImage: m.coverImage,
    bannerImage: m.bannerImage,
    color: m.color,
    format: m.format,
    episodes: m.chapters,
    seasonYear: m.seasonYear,
    status: m.status,
    genres: m.genres,
    averageScore: m.averageScore,
  };
}

function fbMangaSearch(term: string): AnimeCard[] {
  const q = term.toLowerCase();
  return MALL.filter((m) => `${m.title} ${m.nativeTitle ?? ""} ${m.genres.join(" ")} ${m.authors[0]?.name ?? ""}`.toLowerCase().includes(q))
    .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0))
    .map(mToCard);
}
