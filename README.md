# ✦ 𝓥𝓮𝓵𝓷𝓲𝔁

**Velnix** is a premium, mobile-first anime platform — an all-in-one ecosystem
for discovering, watching, reading, and talking about anime.

> AMOLED black · pink/magenta accent · charcoal panels · smooth, compact, and
> built to feel like a native Android app on the web.

## ✨ What's inside

| Area | Status |
|------|--------|
| **Home** — hero, Trending, Top Airing, Continue Watching, Claire, Library, Manga, Games | ✅ Real AniList data |
| **Search** — anime & manga with live results, filters, suggestions | ✅ AniList |
| **Anime Details** — poster/backdrop, facts, seasons, episodes, characters, VAs, **songs**, related, recommendations | ✅ AniList |
| **Watch page** — full player + Velnix Resolver + server/audio selectors + comments | ✅ |
| **Video Player** — HLS, seek ±10s, prev/next, quality, subs, audio, speed, PiP, fullscreen, auto-next, skip intro, cast | ✅ hls.js |
| **Continue Watching** — progress + watched tracking | ✅ localStorage |
| **Pulse** — anime-only social feed, likes, comments, save, anime recognition | ✅ |
| **Claire AI** — chat, anime finder, recommendations, previous chats, free/premium | ✅ taste engine |
| **Studio** — create Pulse posts, tag anime | ✅ |
| **Library** — anime/manga, statuses, favorites | ✅ |
| **Manga** — discovery, details, mobile reader | ✅ AniList |
| **DMs** — Instagram-style messaging, themes | ✅ |
| **Notifications, Party, Games, Profile, Settings, Premium, Admin** | ✅ |

## 🏗️ Architecture

```
Frontend (Next.js App Router)
        ↓  (only talks to the Velnix backend)
Velnix Backend (API routes)
        ↓                         ↓                          ↓
AniList metadata API      Provider Router / Resolver     Application data
                          (normalizes any provider)       (Library, Pulse, DMs, …)
        ↓                         ↓
   Anime / Manga             Playable Source → Velnix Player
```

- **`src/lib/`** — AniList client (`anilist.ts`, `manga.ts`), GraphQL queries,
  shared types, formatting helpers, and reactive localStorage stores.
- **`src/providers/`** — the **Velnix Resolver**: provider interface, normalizer,
  registry, and the **Provider Router** that cascades A → B → C. Add a provider
  by implementing `Provider` and registering it — the Watch page never changes.
- **`src/app/api/`** — all backend endpoints. `resolver/[id]` is the single
  source-resolution endpoint the Watch page calls.
- **`src/components/`** — the reusable UI (player, cards, carousels, nav).
- **`claire/`** — the AI layer (see `claire/README.md`).
- **`database/schema.sql`** — the production relational schema (users, social,
  library, Party, Premium, providers).

### Provider resolver

The Watch page calls `GET /api/resolver/[id]?episode=N&audio=sub|dub&provider=X`
and gets one normalized shape:

```json
{
  "status": "ok",
  "data": {
    "animeId": "123",
    "episode": 1,
    "sources": [{ "url": "https://...", "type": "hls", "quality": "1080p" }],
    "subtitles": [],
    "audio": [],
    "isSample": true
  }
}
```

The included **Demo Provider** returns public test HLS streams (provided by their
owners for playback testing) so the player works end-to-end. To stream real
episodes, fill in `src/providers/authorized-provider.ts` with credentials and a
real authorized API call. **Only providers that permit embedding/streaming are
connected — Velnix never bypasses DRM, auth, CAPTCHAs, or paywalls.** If no
provider is configured, the Watch page shows *"No playable source currently
available."*

## 🚀 Getting started

```bash
npm install
cp .env.example .env.local      # fill in any real credentials (all optional)
npm run dev                     # http://localhost:3000
```

Build & run production:

```bash
npm run build && npm start
```

## 🔐 Environment

Secrets live in `.env.local` (gitignored). AniList needs **no key** for reads.
See `.env.example` for every option, including provider enable flags and the
authorized-provider credential slots.

## 📱 Design

- Mobile-first, optimized for 360 / 390 / 412 / 430 px, scales to tablet & desktop.
- AMOLED black surfaces, pink/magenta accents, charcoal cards, soft borders,
  rounded corners, reduced-motion friendly.
- Lazy-loaded images, dynamic HLS import, small JS bundles.

## ⚖️ Compliance

Velnix only uses (1) AniList's public metadata API and (2) public test video
streams provided for playback testing. No scraping, no DRM circumvention, no
hard-coded fake anime or fake sources. Every adapter that touches real content
is clearly marked with where authorized credentials must be added.

## 📦 Tech

Next.js 14 (App Router) · React 18 · TypeScript · hls.js · CSS design system.
