"use client";

import { useState } from "react";

import { addComment, comments, toggleCommentLike } from "@/lib/stores";
import { relativeTime } from "@/lib/format";

export function CommentsSection({ animeId, episode }: { animeId: number; episode: number }) {
  const all = comments.use();
  const key = `${animeId}:${episode}`;
  const list = all[key] ?? [];
  const [text, setText] = useState("");

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    addComment(animeId, episode, t);
    setText("");
  };

  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">
          <span className="dot" /> Comments · EP {episode}
        </h2>
        <span className="chip">{list.length} comments</span>
      </div>

      <div className="field">
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Tap to join the discussion…"
        />
        <div className="flex gap8">
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={!text.trim()}>
            Post
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="state-box" style={{ padding: "28px 18px" }}>
          <div className="ic">💬</div>
          <h3 style={{ fontSize: 14 }}>No comments yet</h3>
          <p className="tiny muted">Be the first to discuss this episode.</p>
        </div>
      ) : (
        <div className="flex gap12" style={{ flexDirection: "column" }}>
          {list.map((c) => (
            <div key={c.id} className="flex gap10" style={{ alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: 999, background: c.authorColor, flex: "0 0 34px", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>
                {c.authorName.slice(0, 1).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex aic gap8">
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{c.authorName}</span>
                  <span className="tiny faint">{relativeTime(c.at)} ago</span>
                </div>
                <div style={{ fontSize: 14, marginTop: 2 }}>{c.text}</div>
                <button className="tiny muted mt8" style={{ fontWeight: 600 }} onClick={() => toggleCommentLike(animeId, episode, c.id)}>
                  {c.liked ? "♥" : "♡"} {c.likes > 0 ? c.likes : ""} · Reply · Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
