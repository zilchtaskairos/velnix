"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Img } from "@/components/Img";
import { AnimeCard } from "@/components/AnimeCard";
import {
  appendClaireMessage,
  claireChats,
  createClaireChat,
  library,
  profile,
  type ClaireChat,
  type ClaireMessage,
} from "@/lib/stores";
import type { AnimeCard as T } from "@/lib/types";

type View = "home" | "chat";

export default function ClairePage() {
  const [view, setView] = useState<View>("home");
  const [activeChat, setActiveChat] = useState<ClaireChat | null>(null);
  const isPremium = profile.use().isPremium;
  const chats = claireChats.use();

  const openChat = (title: string) => {
    const c = createClaireChat(title);
    setActiveChat(c);
    setView("chat");
  };

  return (
    <AppShell>
      <div className="container">
        {view === "home" ? (
          <ClaireHome isPremium={isPremium} chats={chats} onOpen={openChat} onPickChat={(c) => { setActiveChat(c); setView("chat"); }} />
        ) : (
          <ClaireChatView chat={activeChat} isPremium={isPremium} onBack={() => setView("home")} onUpdate={(c) => setActiveChat(c)} />
        )}
      </div>
    </AppShell>
  );
}

function ClaireHome({
  isPremium,
  chats,
  onOpen,
  onPickChat,
}: {
  isPremium: boolean;
  chats: ClaireChat[];
  onOpen: (t: string) => void;
  onPickChat: (c: ClaireChat) => void;
}) {
  return (
    <>
      <div className="claire-banner mt12 fade-in">
        <div className="flex aic gap12 wrap">
          <div style={{ fontSize: 40 }}>☘︎</div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 800, fontSize: 20 }}>Claire</div>
            <div className="muted tiny">Your anime assistant. Discover, plan, and identify — all in one place.</div>
          </div>
          <div className={`chip ${isPremium ? "solid" : "accent"}`}>{isPremium ? "★ Premium" : "Free plan"}</div>
        </div>
      </div>

      <div className="grid mt16" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <QuickCard emoji="💬" title="Chat with Claire" sub="Ask anything anime" onClick={() => onOpen("New chat")} />
        <QuickCard emoji="🔍" title="Anime Finder" sub="Describe & find it" onClick={() => onOpen("Anime Finder")} />
        <QuickCard emoji="✨" title="Recommendations" sub="Picks for your taste" onClick={() => onOpen("Recommendations")} />
        <QuickCard emoji="🌙" title="Mood" sub="Match your vibe" onClick={() => onOpen("Mood match")} />
        <QuickCard emoji="🖼️" title="Image ID" sub="Identify from screenshot" onClick={() => onOpen("Image identification")} premium={!isPremium} />
        <QuickCard emoji="📚" title="Library Analysis" sub="What you'd love next" onClick={() => onOpen("Library analysis")} premium={!isPremium} />
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title"><span className="dot" /> Previous Chats</h2>
        </div>
        {chats.length === 0 ? (
          <p className="muted tiny">No conversations yet. Your chats with Claire will appear here.</p>
        ) : (
          <div className="flex gap12" style={{ flexDirection: "column" }}>
            {chats.map((c) => (
              <button key={c.id} className="list-row card-tap" style={{ width: "100%", textAlign: "left" }} onClick={() => onPickChat(c)}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--accent-soft)", display: "grid", placeItems: "center", fontSize: 20 }}>☘︎</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }} className="truncate">{c.title}</div>
                  <div className="tiny muted">
                    {new Date(c.updatedAt).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                    {" · "}{c.messages.length} messages
                  </div>
                </div>
                <span style={{ color: "var(--text-faint)" }}>›</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title"><span className="dot" /> Free vs Premium</h2>
        </div>
        <div className="fact-grid">
          <div className="fact"><div className="l">Free</div><div className="v" style={{ fontSize: 12.5, fontWeight: 500 }}>Basic recs · simple finder · discovery · help</div></div>
          <div className="fact"><div className="l">Premium</div><div className="v" style={{ fontSize: 12.5, fontWeight: 500 }}>Full conversations · mood analysis · image ID · watch planning · history</div></div>
        </div>
        {!isPremium && (
          <Link className="btn btn-primary btn-sm mt12" href="/premium">Unlock Premium Claire →</Link>
        )}
      </section>
    </>
  );
}

function QuickCard({ emoji, title, sub, onClick, premium }: { emoji: string; title: string; sub: string; onClick: () => void; premium?: boolean }) {
  return (
    <button className="panel card-tap" style={{ padding: 14, textAlign: "left", position: "relative" }} onClick={onClick}>
      {premium ? <span className="chip accent tiny" style={{ position: "absolute", top: 8, right: 8 }}>★</span> : null}
      <div style={{ fontSize: 24 }}>{emoji}</div>
      <div style={{ fontWeight: 700, fontSize: 14, marginTop: 6 }}>{title}</div>
      <div className="tiny muted">{sub}</div>
    </button>
  );
}

function ClaireChatView({
  chat,
  isPremium,
  onBack,
  onUpdate,
}: {
  chat: ClaireChat | null;
  isPremium: boolean;
  onBack: () => void;
  onUpdate: (c: ClaireChat) => void;
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ClaireMessage[]>(chat?.messages ?? []);
  const [imageMode, setImageMode] = useState(chat?.title.toLowerCase().includes("image"));
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(chat?.messages ?? []);
  }, [chat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const taste = Object.values(library.use())
    .filter((e) => e.kind === "anime")
    .flatMap((e) => []);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    if (!chat) return;

    const userMsg: ClaireMessage = { id: `u${Date.now()}`, role: "user", text, at: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    appendClaireMessage(chat.id, userMsg);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/claire/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, taste, limit: 6 }),
      });
      const j = await res.json();
      const results: T[] = j.results ?? [];
      const reply: ClaireMessage = {
        id: `c${Date.now()}`,
        role: "claire",
        text: j.message || "Here's what I found.",
        cards: results.map((r) => ({ id: r.id, title: r.title, image: r.coverImage })),
        at: Date.now(),
      };
      const updated = [...next, reply];
      setMessages(updated);
      appendClaireMessage(chat.id, reply);
      const fresh = { ...chat, messages: updated };
      onUpdate(fresh);
    } catch {
      const reply: ClaireMessage = {
        id: `c${Date.now()}`,
        role: "claire",
        text: "I couldn't reach the catalog just now. Please try again.",
        at: Date.now(),
      };
      setMessages((m) => [...m, reply]);
      appendClaireMessage(chat.id, reply);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex aic gap8 mt12 mb12">
        <button className="iconbtn" onClick={onBack} aria-label="Back">
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>☘︎ Claire</div>
          <div className="tiny muted">{chat?.title}</div>
        </div>
        <button className={`chip tiny ${imageMode ? "accent" : ""}`} onClick={() => setImageMode((m) => !m)}>
          {imageMode ? "🖼️ Image" : "💬 Text"}
        </button>
      </div>

      <div className="panel" style={{ minHeight: "55vh", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 ? (
          <div className="state-box" style={{ border: "none", background: "transparent" }}>
            <div className="ic">☘︎</div>
            <h3 style={{ fontSize: 15 }}>Ask Claire</h3>
            <p className="muted tiny">“What should I watch?” · “Find me a romance anime” · “Something like Solo Leveling”</p>
          </div>
        ) : null}

        {messages.map((m) => (
          <div key={m.id} className={`dm-msg ${m.role === "user" ? "me" : "them"}`}>
            {m.text}
            {m.cards && m.cards.length > 0 ? (
              <div className="hrow mt8" style={{ marginInline: 0, paddingInline: 0 }}>
                {m.cards.slice(0, 6).map((c) => (
                  <AnimeCard key={c.id} anime={{ id: c.id, title: c.title, coverImage: c.image ?? null, bannerImage: null, color: null, format: null, episodes: null, seasonYear: null, status: null, genres: [], averageScore: null }} size="sm" />
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {busy ? (
          <div className="dm-msg them">
            <span className="flex gap6">
              <span className="skel" style={{ width: 6, height: 6, borderRadius: 999, display: "inline-block" }} />
              <span className="skel" style={{ width: 6, height: 6, borderRadius: 999, display: "inline-block" }} />
              <span className="skel" style={{ width: 6, height: 6, borderRadius: 999, display: "inline-block" }} />
            </span>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      {imageMode && !isPremium ? (
        <div className="song-row mt12" style={{ background: "var(--accent-soft)", borderColor: "rgba(255,46,110,0.25)" }}>
          <div className="glyph">★</div>
          <div className="info">
            <div className="t" style={{ fontSize: 13 }}>Image identification is a Premium Claire feature</div>
            <div className="a">
              <Link href="/premium" className="section-link">Unlock Premium →</Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="dm-input mt12" style={{ marginBottom: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder={imageMode ? "Describe the anime in the screenshot…" : "Message Claire…"}
        />
        <button className="btn btn-primary btn-sm" onClick={() => send(input)} disabled={busy || !input.trim()}>
          Send
        </button>
      </div>
    </>
  );
}
