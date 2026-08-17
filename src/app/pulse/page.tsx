"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Brand } from "@/components/Brand";
import { pulse, togglePulseLike, togglePulseSave, type PulsePost } from "@/lib/stores";
import { relativeTime } from "@/lib/format";

export default function PulsePage() {
  const posts = pulse.use();
  const [feed, setFeed] = useState<"foryou" | "following">("foryou");

  return (
    <AppShell>
      <div className="container">
        <div className="flex aic jcb mt12 mb12">
          <h1 className="section-title" style={{ fontSize: 22 }}>
            <span className="dot" /> Pulse
          </h1>
          <Link href="/studio" className="btn btn-primary btn-sm">
            ✚ Post
          </Link>
        </div>
        <p className="muted tiny mb12">Velnix's anime-only social feed. Edits, art, reactions & episode talk.</p>

        <div className="tabs mb16">
          <button className={`tab ${feed === "foryou" ? "active" : ""}`} onClick={() => setFeed("foryou")}>
            For You
          </button>
          <button className={`tab ${feed === "following" ? "active" : ""}`} onClick={() => setFeed("following")}>
            Following
          </button>
          <button className="tab">Trending</button>
        </div>

        {posts.length === 0 ? (
          <div className="state-box">
            <div className="ic">⚡</div>
            <h3 style={{ fontSize: 15 }}>Your feed is quiet</h3>
            <p className="muted tiny">Follow creators or make your first post from Studio.</p>
            <Link className="btn btn-primary btn-sm mt8" href="/studio">
              Create a post
            </Link>
          </div>
        ) : (
          <div className="flex gap16" style={{ flexDirection: "column" }}>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}

        <footer className="center mt24" style={{ padding: "20px 0", color: "var(--text-faint)" }}>
          <Brand size="sm" href={null} />
        </footer>
      </div>
    </AppShell>
  );
}

function PostCard({ post }: { post: PulsePost }) {
  const [showRecognize, setShowRecognize] = useState(false);
  return (
    <article className="pulse-post fade-in">
      <div className="pulse-head">
        <div style={{ width: 38, height: 38, borderRadius: 999, background: post.author.avatarColor, display: "grid", placeItems: "center", fontWeight: 700 }}>
          {post.author.displayName.slice(0, 1)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex aic gap6">
            <span className="username">{post.author.displayName}</span>
            {post.author.verified ? <span style={{ color: "var(--accent-2)", fontSize: 12 }}>✦</span> : null}
          </div>
          <div className="handle">@{post.author.username} · {relativeTime(post.createdAt)} ago</div>
        </div>
        <button className="iconbtn">⋯</button>
      </div>

      <div className="pulse-body">
        <p style={{ whiteSpace: "pre-wrap" }}>{post.text}</p>

        {/* Branded edit placeholder (not a real anime screenshot) */}
        {post.imageUrl === "edit" && (
          <div
            onClick={() => setShowRecognize((s) => !s)}
            style={{
              marginTop: 10,
              height: 280,
              borderRadius: "var(--radius-sm)",
              background: "linear-gradient(135deg,#ff2e6e33,#5b8def22), repeating-linear-gradient(45deg,#11111480,#11111480 12px,#16161b80 12px,#16161b80 24px)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>🎴</div>
              <div className="tiny muted mt8">Sample edit · tap for Claire recognition</div>
            </div>
          </div>
        )}

        {post.animeId ? (
          <Link href={`/anime/${post.animeId}`} className="pulse-anime-tag">
            ✦ {post.animeTitle} · Open Anime → Watch
          </Link>
        ) : null}

        {showRecognize && (
          <div className="panel-2 mt8" style={{ padding: 12 }}>
            <div className="tiny muted">☘︎ Claire recognized:</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>Jujutsu Kaisen (sample)</div>
            <Link className="btn btn-ghost btn-sm mt8" href="/anime/101922">
              Open Anime → Watch
            </Link>
          </div>
        )}

        <div className="flex wrap gap6 mt8">
          {post.tags.map((t) => (
            <span key={t} className="chip tiny">#{t}</span>
          ))}
        </div>
      </div>

      <div className="pulse-actions">
        <button className={post.liked ? "liked" : ""} onClick={() => togglePulseLike(post.id)}>
          {post.liked ? "♥" : "♡"} {fmtCount(post.likes)}
        </button>
        <Link href={`/anime/${post.animeId ?? 1}#comments`}>💬 {fmtCount(post.comments)}</Link>
        <button
          onClick={() => {
            if (navigator.share) navigator.share({ text: post.text }).catch(() => {});
          }}
        >
          ↗ Share
        </button>
        <button className="sp" onClick={() => togglePulseSave(post.id)}>
          {post.saved ? "🔖 Saved" : "⚑ Save"}
        </button>
      </div>
    </article>
  );
}

function fmtCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
