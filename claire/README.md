# Claire — Velnix's AI Layer

Claire is the intelligent layer that connects the Velnix ecosystem. In this
repository Claire ships as a **deterministic recommendation engine** that runs
over live AniList metadata — no fake results, no hallucinated anime. It is fully
functional today and is structured so a real LLM can be dropped in without
changing the contract.

## What works today

- **Text intent parsing** — `src/app/api/claire/recommend/route.ts` extracts
  genres and a search term from free text ("find me a romance anime", "something
  like Solo Leveling").
- **Live metadata matching** — runs parallel AniList searches, dedupes and
  scores results by genre overlap + score, returns ranked cards.
- **Taste input** — the client sends the user's preferred genres (from Library /
  Continue Watching) so recommendations personalize.
- **Persistent chats** — conversations are stored and resumable
  (`src/lib/stores.ts` → `claireChats`).
- **Free vs Premium gating** — image identification & deep analysis are Premium.

## Plugging in a real LLM

The request/response contract stays identical, so you can replace the engine:

```ts
// src/app/api/claire/recommend/route.ts  (illustrative)
const completion = await llm.chat({
  messages: [
    { role: "system", content: CLAIRE_SYSTEM_PROMPT },
    { role: "user", content: text },
  ],
  tools: [searchAnimeTool], // function-calling into AniList
});
```

Recommended providers (set via env, never in the client):

- OpenAI / Anthropic / Google — general chat + tool calling.
- A vector store over anime embeddings for semantic "find me something like X".

Put credentials in `.env.local`:

```
# CLAURE_MODEL_PROVIDER="openai"
# CLAIRE_API_KEY=""
```

## Image anime identification

Free-text finder works today. **Image identification** is gated to Premium in the
UI. To enable it, connect a reverse-image / anime-recognition service behind a
new provider adapter (same pattern as the video providers in `src/providers/`),
then flip the gate in `src/app/claire/page.tsx`.

## Safety

Claire never invents metadata — every card returned is a real AniList title. If
an LLM backend is added, constrain it with tool-calling so it can only surface
results that resolve to real AniList IDs.
