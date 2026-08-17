"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { AnimeCard } from "@/components/AnimeCard";
import { EmptyBox } from "@/components/StateBox";
import { continueWatching, library, pulse, profile, setProfile, watchedEpisodes } from "@/lib/stores";

const COLORS = ["#ff2e6e", "#5b8def", "#a855f7", "#22c55e", "#f59e0b", "#06b6d4", "#f87171"];

export default function ProfilePage() {
  const p = profile.use();
  const lib = library.use();
  const cw = continueWatching.use();
  const watched = watchedEpisodes.use();
  const posts = pulse.use();

  const animeEntries = Object.values(lib).filter((e) => e.kind === "anime");
  const mangaEntries = Object.values(lib).filter((e) => e.kind === "manga");
  const myPosts = posts.filter((x) => x.author.id === "me");
  const totalWatched = Object.values(watched).reduce((s, arr) => s + arr.length, 0);
  const watchMinutes = (p.watchMinutesOverride ?? 0) + totalWatched * 24 + cw.reduce((s, e) => s + Math.floor(e.position / 60), 0);
  const favs = animeEntries.filter((e) => e.favorite);

  const [editing, setEditing] = useState(false);

  return (
    <AppShell>
      <div className="container">
        {/* Background */}
        <div className="profile-bg" style={{ background: p.backgroundUrl ? `url(${p.backgroundUrl}) center/cover` : `linear-gradient(135deg, ${p.avatarColor}, #0c0a14)` }}>
          <div className="scrim" />
        </div>

        <div style={{ marginTop: -54, position: "relative", zIndex: 2 }}>
          <div className="flex aic gap12">
            <div style={{ width: 86, height: 86, borderRadius: 999, background: p.avatarColor, border: "4px solid var(--bg)", display: "grid", placeItems: "center", fontSize: 32, fontWeight: 800, boxShadow: "0 6px 20px rgba(0,0,0,0.5)" }}>
              {p.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="flex aic gap8">
                <h1 style={{ fontSize: 20, fontWeight: 800 }}>{p.displayName}</h1>
                {p.isPremium ? <span className="chip solid tiny">★ Premium</span> : null}
              </div>
              <div className="muted">@{p.username}</div>
              <div className="flex gap12 mt8">
                <Stat label="Followers" value="1.2k" />
                <Stat label="Following" value="318" />
                <Stat label="Posts" value={String(myPosts.length)} />
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing((e) => !e)}>
              {editing ? "Done" : "✎ Edit"}
            </button>
          </div>

          <p className="muted mt12" style={{ fontSize: 14 }}>{p.bio}</p>

          {editing ? (
            <div className="panel mt12" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Display name</label>
                <input className="input" value={p.displayName} onChange={(e) => setProfile({ displayName: e.target.value })} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Username</label>
                <input className="input" value={p.username} onChange={(e) => setProfile({ username: e.target.value.replace(/\s/g, "") })} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Bio</label>
                <textarea className="textarea" value={p.bio} onChange={(e) => setProfile({ bio: e.target.value })} />
              </div>
              <div>
                <label className="tiny muted">Avatar color</label>
                <div className="flex gap8 mt8">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setProfile({ avatarColor: c })} style={{ width: 28, height: 28, borderRadius: 999, background: c, border: c === p.avatarColor ? "2px solid #fff" : "2px solid transparent" }} />
                  ))}
                </div>
              </div>
              <div className="flex gap8">
                <button className={`chip ${p.privacy === "PUBLIC" ? "accent" : ""}`} onClick={() => setProfile({ privacy: "PUBLIC" })}>Public</button>
                <button className={`chip ${p.privacy === "PRIVATE" ? "accent" : ""}`} onClick={() => setProfile({ privacy: "PRIVATE" })}>Private</button>
              </div>
            </div>
          ) : null}

          {/* Badges */}
          <div className="flex wrap gap8 mt16">
            <span className="chip accent">✦ Velnix Member</span>
            {p.isPremium ? <span className="chip solid">★ Premium</span> : null}
            {totalWatched > 0 ? <span className="chip">🎬 {totalWatched} eps</span> : null}
            {myPosts.length > 0 ? <span className="chip">⚡ Creator</span> : null}
            <span className="chip">{p.privacy === "PRIVATE" ? "🔒 Private" : "🌍 Public"}</span>
          </div>

          {/* Stats */}
          <div className="fact-grid mt16">
            <div className="fact"><div className="l">Watch minutes</div><div className="v">{watchMinutes.toLocaleString()}</div></div>
            <div className="fact"><div className="l">Anime</div><div className="v">{animeEntries.length}</div></div>
            <div className="fact"><div className="l">Manga</div><div className="v">{mangaEntries.length}</div></div>
            <div className="fact"><div className="l">Episodes watched</div><div className="v">{totalWatched}</div></div>
          </div>

          {/* Favorites */}
          <section className="section">
            <div className="section-head">
              <h2 className="section-title"><span className="dot" /> Favorite Anime</h2>
              <Link className="section-link" href="/library">Library →</Link>
            </div>
            {favs.length === 0 ? (
              <p className="muted tiny">Tap ♥ on any anime to favorite it.</p>
            ) : (
              <div className="hrow">
                {favs.slice(0, 12).map((e) => (
                  <AnimeCard key={e.id} anime={{ id: e.id, title: e.title, coverImage: e.coverImage, bannerImage: e.bannerImage, color: e.color, format: null, episodes: e.totalEpisodes ?? null, seasonYear: null, status: null, genres: [], averageScore: null }} size="sm" />
                ))}
              </div>
            )}
          </section>

          {/* Continue */}
          {cw.length > 0 ? (
            <section className="section">
              <div className="section-head"><h2 className="section-title"><span className="dot" /> Continue Watching</h2></div>
              <div className="hrow">
                {cw.slice(0, 6).map((e) => (
                  <Link key={e.animeId} href={`/watch/${e.animeId}?episode=${e.episode}`} className="cw-card card-tap" style={{ width: 200, flex: "0 0 200px" }}>
                    <div className="bg" style={e.bannerImage ? { backgroundImage: `url(${e.bannerImage})` } : { background: e.color ?? undefined }}>
                      <div className="scrim" />
                      <div className="info"><div className="t">{e.animeTitle}</div><div className="e">EP {e.episode}</div></div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* My posts */}
          <section className="section">
            <div className="section-head"><h2 className="section-title"><span className="dot" /> My Pulse Posts</h2></div>
            {myPosts.length === 0 ? (
              <EmptyBox title="No posts yet" message="Share something from Studio." action={<Link className="btn btn-primary btn-sm" href="/studio">Open Studio</Link>} />
            ) : (
              <div className="flex gap12" style={{ flexDirection: "column" }}>
                {myPosts.map((post) => (
                  <div key={post.id} className="list-row"><div style={{ flex: 1, minWidth: 0 }}><div className="clamp2" style={{ fontSize: 13 }}>{post.text}</div><div className="tiny muted mt8">♥ {post.likes} · 💬 {post.comments}</div></div></div>
                ))}
              </div>
            )}
          </section>

          {!p.isPremium && (
            <Link href="/premium" className="premium-card mt24" style={{ display: "block" }}>
              <div className="flex aic gap12 wrap">
                <div style={{ fontSize: 28 }}>★</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Go Premium</div>
                  <div className="muted tiny">Unlock 4K, Party, full Claire & custom themes.</div>
                </div>
                <span className="chip solid">Try free →</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontWeight: 800, fontSize: 14 }}>{value}</span> <span className="tiny faint">{label}</span>
    </div>
  );
}
