"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { profile } from "@/lib/stores";

export default function PartyPage() {
  const isPremium = profile.use().isPremium;
  const [code] = useState(() => generateCode());
  const [chat, setChat] = useState<{ from: "me" | "them"; text: string }[]>([
    { from: "them", text: "ready when you are!" },
    { from: "me", text: "starting in 3…2…1 🍿" },
  ]);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setChat([...chat, { from: "me", text }]);
    setText("");
    setTimeout(() => setChat((c) => [...c, { from: "them", text: pickReply() }]), 1200);
  };

  return (
    <AppShell>
      <div className="container">
        <h1 className="section-title mt12 mb12" style={{ fontSize: 22 }}>
          <span className="dot" /> Velnix Party
        </h1>

        {!isPremium ? (
          <div className="premium-card mb16">
            <div className="flex aic gap12 wrap">
              <div style={{ fontSize: 32 }}>🎉</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 800, fontSize: 17 }}>Party is a Premium feature</div>
                <div className="muted tiny">Watch together with synced playback & live chat. Start a 7-day trial to host a party.</div>
              </div>
              <Link className="btn btn-primary btn-sm" href="/premium">Try Premium</Link>
            </div>
          </div>
        ) : null}

        <div className="panel" style={{ padding: 16 }}>
          <div className="flex aic jcb wrap gap8 mb12">
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Bleach: TYBW · Episode 8</div>
              <div className="tiny muted">Synced watch party</div>
            </div>
            <div className="flex aic gap8">
              <span className="chip accent">Code: {code}</span>
              <button className="chip" onClick={() => typeof navigator !== "undefined" && navigator.clipboard?.writeText(code)}>Copy</button>
            </div>
          </div>

          {/* Members */}
          <div className="flex aic gap8 mb12">
            <div className="member" style={{ background: "#ff2e6e", display: "grid", placeItems: "center", fontWeight: 700 }}>Y</div>
            <div className="member" style={{ background: "#5b8def", display: "grid", placeItems: "center", fontWeight: 700 }}>R</div>
            <div className="member" style={{ background: "#a855f7", display: "grid", placeItems: "center", fontWeight: 700 }}>M</div>
            <div className="member add">+</div>
            <span className="tiny muted">3 watching</span>
          </div>

          {/* Player stub */}
          <Link href="/watch/1?episode=8" className="player-wrap" style={{ display: "grid", placeItems: "center", background: "linear-gradient(135deg,#1a1030,#0c0a14)", color: "#fff", textDecoration: "none" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>▶</div>
              <div className="tiny muted mt8">Open synced player →</div>
            </div>
          </Link>

          {/* Sync controls */}
          <div className="flex aic gap8 mt12">
            <button className="btn btn-ghost btn-sm" disabled={!isPremium}>⏮ Sync</button>
            <button className="btn btn-ghost btn-sm" disabled={!isPremium}>⏯ Pause all</button>
            <button className="btn btn-ghost btn-sm" disabled={!isPremium}>⏭ Sync</button>
            <span className="chip good tiny">{isPremium ? "● Live" : "Locked"}</span>
          </div>

          {/* Chat */}
          <div className="dm-messages mt12" style={{ minHeight: 120, background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
            {chat.map((m, i) => (
              <div key={i} className={`dm-msg ${m.from === "me" ? "me" : "them"}`}>{m.text}</div>
            ))}
          </div>
          <div className="dm-input mt8">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={isPremium ? "Say something…" : "Unlock to chat…"} disabled={!isPremium} />
            <button className="btn btn-primary btn-sm" onClick={send} disabled={!isPremium || !text.trim()}>Send</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function generateCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}
function pickReply() {
  const r = ["😂 that part", "wait pause!", "the OP is so good", "hype hype hype", "no spoilers pls"];
  return r[Math.floor(Math.random() * r.length)];
}
