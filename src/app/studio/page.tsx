"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { addPulsePost, pulse, profile } from "@/lib/stores";

export default function StudioPage() {
  const profile_ = profile.use();
  const [text, setText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [withImage, setWithImage] = useState(false);
  const [animeSearch, setAnimeSearch] = useState("");
  const [animeHit, setAnimeHit] = useState<{ id: number; title: string } | null>(null);
  const [posted, setPosted] = useState(false);

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const searchAnime = async () => {
    if (!animeSearch.trim()) return;
    try {
      const j = await fetch(`/api/search?q=${encodeURIComponent(animeSearch)}`).then((r) => r.json());
      const first = j.items?.[0];
      if (first) setAnimeHit({ id: first.id, title: first.title });
    } catch {
      /* ignore */
    }
  };

  const publish = () => {
    if (!text.trim() && !withImage) return;
    addPulsePost({
      id: `p${Date.now()}`,
      author: {
        id: "me",
        username: profile_.username,
        displayName: profile_.displayName,
        avatarColor: profile_.avatarColor,
      },
      text: text.trim() || "New post",
      imageUrl: withImage ? "edit" : undefined,
      animeId: animeHit?.id,
      animeTitle: animeHit?.title,
      tags,
      createdAt: Date.now(),
      likes: 0,
      comments: 0,
    });
    setText("");
    setTags([]);
    setWithImage(false);
    setAnimeHit(null);
    setAnimeSearch("");
    setPosted(true);
    setTimeout(() => setPosted(false), 2500);
  };

  return (
    <AppShell>
      <div className="container">
        <h1 className="section-title mt12 mb12" style={{ fontSize: 22 }}>
          <span className="dot" /> Studio
        </h1>
        <p className="muted tiny mb16">Create Pulse posts, anime edits, collections & lists.</p>

        <div className="grid mb16" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <ModeChip active>📝 Post</ModeChip>
          <ModeChip>🎴 Edit</ModeChip>
          <ModeChip>📚 List</ModeChip>
        </div>

        <div className="panel" style={{ padding: 16 }}>
          <div className="field">
            <label>Caption</label>
            <textarea
              className="textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share an anime moment, hot take, or recommendation…"
            />
          </div>

          <div className="field">
            <label>Media</label>
            <button className={`btn btn-sm ${withImage ? "btn-primary" : "btn-ghost"}`} onClick={() => setWithImage((w) => !w)}>
              {withImage ? "✓ Image attached (sample)" : "+ Add image"}
            </button>
          </div>

          <div className="field">
            <label>Tag an anime</label>
            <div className="flex gap8">
              <input
                className="input"
                value={animeSearch}
                onChange={(e) => setAnimeSearch(e.target.value)}
                placeholder="Search anime to tag…"
              />
              <button className="btn btn-ghost btn-sm" onClick={searchAnime}>
                Find
              </button>
            </div>
            {animeHit ? (
              <span className="chip accent mt8" style={{ alignSelf: "flex-start" }}>
                ✦ {animeHit.title}
                <button onClick={() => setAnimeHit(null)} style={{ marginLeft: 6 }}>✕</button>
              </span>
            ) : null}
          </div>

          <div className="field">
            <label>Tags</label>
            <div className="flex gap8">
              <input
                className="input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add a tag…"
              />
              <button className="btn btn-ghost btn-sm" onClick={addTag}>
                +
              </button>
            </div>
            <div className="flex wrap gap6 mt8">
              {tags.map((t) => (
                <span key={t} className="chip">
                  #{t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} style={{ marginLeft: 6 }}>✕</button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex aic gap8 mt8">
            <button className="btn btn-primary" onClick={publish} disabled={!text.trim() && !withImage}>
              Publish to Pulse
            </button>
            {posted ? <span className="chip good tiny">✓ Posted!</span> : null}
          </div>
        </div>

        <section className="section">
          <div className="section-head">
            <h2 className="section-title"><span className="dot" /> Your posts</h2>
            <Link className="section-link" href="/pulse">View Pulse →</Link>
          </div>
          {pulse.use().filter((p) => p.author.id === "me").length === 0 ? (
            <p className="muted tiny">Posts you create appear here and on Pulse.</p>
          ) : (
            <div className="flex gap12" style={{ flexDirection: "column" }}>
              {pulse
                .use()
                .filter((p) => p.author.id === "me")
                .map((p) => (
                  <div key={p.id} className="list-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="clamp2" style={{ fontSize: 13 }}>{p.text}</div>
                      <div className="tiny muted mt8">♥ {p.likes} · 💬 {p.comments}</div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ModeChip({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button className={`panel-2 ${active ? "" : ""}`} style={{ padding: "12px 8px", textAlign: "center", fontSize: 13, fontWeight: 600, borderColor: active ? "var(--accent)" : "var(--border)", color: active ? "var(--accent-3)" : "var(--text-dim)" }}>
      {children}
    </button>
  );
}
