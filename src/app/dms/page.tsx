"use client";

import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { dms, sendDM, setDMColor, type DMConversation } from "@/lib/stores";
import { relativeTime } from "@/lib/format";

const COLORS = ["#ff2e6e", "#5b8def", "#a855f7", "#22c55e", "#f59e0b", "#06b6d4"];

export default function DMsPage() {
  const convos = dms.use();
  const [activeId, setActiveId] = useState<string>(convos[0]?.contact.id ?? "");
  const [text, setText] = useState("");
  const [picker, setPicker] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const active = convos.find((c) => c.contact.id === activeId) ?? convos[0];

  useEffect(() => {
    if (!activeId && convos[0]) setActiveId(convos[0].contact.id);
  }, [convos, activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView();
  }, [active?.messages.length]);

  const send = (kind: "text" | "sticker", content: string) => {
    if (!active) return;
    if (kind === "text" && !content.trim()) return;
    sendDM(active.contact.id, {
      id: `m${Date.now()}`,
      from: "me",
      text: content,
      kind,
      at: Date.now(),
    });
    setText("");
    // Simulate a reply for liveness.
    setTimeout(() => {
      sendDM(active.contact.id, {
        id: `m${Date.now() + 1}`,
        from: "them",
        text: pickReply(),
        at: Date.now(),
      });
    }, 1400);
  };

  return (
    <AppShell>
      <div className="container">
        <h1 className="section-title mt12 mb12" style={{ fontSize: 22 }}>
          <span className="dot" /> Direct Messages
        </h1>

        <div className="dm-shell">
          {/* Conversation list */}
          <div className="dm-list">
            <div className="flex gap8 wrap" style={{ padding: 10, borderBottom: "1px solid var(--border-soft)" }}>
              {["reina", "kaito.codes", "miyu"].map((u) => (
                <div key={u} className="flex aic gap6" style={{ flexDirection: "column", width: 56 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 999, background: COLORS[hash(u) % COLORS.length], border: "2px solid var(--accent)", display: "grid", placeItems: "center", fontWeight: 700 }}>
                    {u.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="tiny truncate" style={{ maxWidth: 56 }}>{u}</span>
                </div>
              ))}
            </div>
            {convos.map((c) => (
              <DMItem key={c.contact.id} convo={c} active={c.contact.id === active?.contact.id} onClick={() => setActiveId(c.contact.id)} />
            ))}
          </div>

          {/* Thread */}
          {active ? (
            <div className="dm-thread" style={{ display: "flex", flexDirection: "column" }}>
              <div className="dm-thread-head">
                <div style={{ width: 36, height: 36, borderRadius: 999, background: active.color, display: "grid", placeItems: "center", fontWeight: 700 }}>
                  {active.contact.displayName.slice(0, 1)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{active.contact.displayName}</div>
                  <div className="tiny" style={{ color: active.contact.online ? "var(--good)" : "var(--text-faint)" }}>
                    {active.contact.online ? "Active now" : `@${active.contact.username}`}
                  </div>
                </div>
                <button className="iconbtn" onClick={() => setPicker((p) => !p)} aria-label="Theme">🎨</button>
              </div>

              {picker ? (
                <div className="flex gap8 wrap" style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-soft)" }}>
                  <span className="tiny muted">Chat color:</span>
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setDMColor(active.contact.id, c);
                        setPicker(false);
                      }}
                      style={{ width: 24, height: 24, borderRadius: 999, background: c, border: c === active.color ? "2px solid #fff" : "2px solid transparent" }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              ) : null}

              <div className="dm-messages" style={{ background: `radial-gradient(circle at top, ${active.color}14, transparent 60%)` }}>
                {active.messages.map((m) => (
                  <div key={m.id} className={`dm-msg ${m.from === "me" ? "me" : "them"}`}>
                    {m.text}
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <div className="flex wrap gap6" style={{ padding: "0 10px" }}>
                {["🎴", "🔥", "😭", "💜"].map((e) => (
                  <button key={e} className="chip" onClick={() => send("sticker", e)}>
                    {e}
                  </button>
                ))}
                <button className="chip">📎 Share anime</button>
              </div>

              <div className="dm-input">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send("text", text)}
                  placeholder={`Message ${active.contact.displayName}…`}
                />
                <button className="btn btn-primary btn-sm" onClick={() => send("text", text)} disabled={!text.trim()}>
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="dm-thread" style={{ display: "grid", placeItems: "center", color: "var(--text-faint)" }}>
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function DMItem({ convo, active, onClick }: { convo: DMConversation; active: boolean; onClick: () => void }) {
  const last = convo.messages[convo.messages.length - 1];
  return (
    <div className={`dm-item ${active ? "active" : ""}`} onClick={onClick}>
      <div style={{ width: 44, height: 44, borderRadius: 999, background: convo.color, display: "grid", placeItems: "center", fontWeight: 700, flex: "0 0 44px" }}>
        {convo.contact.displayName.slice(0, 1)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex aic jcb">
          <span style={{ fontWeight: 700, fontSize: 14 }} className="truncate">{convo.contact.displayName}</span>
          {last ? <span className="tiny faint">{relativeTime(last.at)}</span> : null}
        </div>
        <div className="tiny muted truncate">{last ? `${last.from === "me" ? "You: " : ""}${last.text}` : "Say hi 👋"}</div>
      </div>
    </div>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pickReply(): string {
  const replies = [
    "haha for real 😭",
    "no way you saw that coming",
    "okay you HAVE to watch the next one",
    "agreed 100%",
    "send me the clip 🙏",
    "party later?",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}
