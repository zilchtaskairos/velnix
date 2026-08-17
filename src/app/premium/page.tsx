"use client";

import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { activatePremium, deactivatePremium, profile } from "@/lib/stores";

const FREE = [
  "No advertisements",
  "Basic anime discovery",
  "Basic Claire AI",
  "Basic library & Continue Watching",
  "Basic Pulse & DMs",
  "Mobile-first streaming",
];

const PREMIUM = [
  "Full Claire AI conversations & image ID",
  "Velnix Party (watch together)",
  "Manga premium features",
  "4K playback where the source supports it",
  "Custom Home & Watch backgrounds",
  "Custom DM themes & chat colors",
  "Advanced recommendations & mood analysis",
  "Premium badge & advanced statistics",
  "Priority new-episode alerts",
];

export default function PremiumPage() {
  const p = profile.use();
  const [plan, setPlan] = useState<"monthly" | "annual">("annual");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const startTrial = () => {
    activatePremium(7);
    setMsg({ ok: true, text: "7-day Premium trial activated! Enjoy ✦" });
  };

  const redeem = () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    // Demo codes — a real system verifies server-side via the subscription layer.
    if (c === "VELNIX7" || c === "FOUNDER" || c === "BIRTHDAY") {
      const days = c === "FOUNDER" ? 365 : c === "BIRTHDAY" ? 30 : 7;
      activatePremium(days);
      setMsg({ ok: true, text: `Code accepted — ${days} days of Premium added!` });
    } else {
      setMsg({ ok: false, text: "That code isn't recognized. Try VELNIX7, FOUNDER, or BIRTHDAY." });
    }
    setCode("");
  };

  const expires = p.premiumUntil ? new Date(p.premiumUntil).toLocaleDateString() : null;

  return (
    <AppShell>
      <div className="container">
        <div className="premium-card mt12 fade-in">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="flex aic gap8">
              <span style={{ fontSize: 28 }}>★</span>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Velnix Premium</h1>
            </div>
            <p className="muted" style={{ marginTop: 4 }}>Unlock the full Velnix ecosystem — Claire, Party, manga & 4K.</p>
            <div className="flex gap8 wrap mt12">
              <span className="chip solid">No ads, ever</span>
              <span className="chip">Cancel anytime</span>
            </div>
          </div>
        </div>

        {p.isPremium ? (
          <div className="song-row mt16" style={{ background: "rgba(45,212,191,0.08)", borderColor: "rgba(45,212,191,0.25)" }}>
            <div className="glyph" style={{ background: "var(--good)", color: "#04201c" }}>✓</div>
            <div className="info">
              <div className="t">You're Premium ★</div>
              <div className="a">{expires ? `Active until ${expires}` : "Active"} · thanks for supporting Velnix!</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={deactivatePremium}>Cancel</button>
          </div>
        ) : null}

        <section className="section">
          <div className="section-head"><h2 className="section-title"><span className="dot" /> Plans</h2></div>

          {/* Plan toggle */}
          <div className="flex gap8 mb12">
            <button className={`tab ${plan === "monthly" ? "active" : ""}`} onClick={() => setPlan("monthly")}>Monthly · $7.99</button>
            <button className={`tab ${plan === "annual" ? "active" : ""}`} onClick={() => setPlan("annual")}>Annual · $59.99 <span className="chip accent tiny" style={{ marginLeft: 6 }}>Save 37%</span></button>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
            <div className="panel" style={{ padding: 16 }}>
              <div className="flex aic jcb mb8">
                <div style={{ fontWeight: 800 }}>Free</div>
                <div className="chip">$0</div>
              </div>
              <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {FREE.map((f) => (
                  <li key={f} className="flex aic gap8 tiny muted"><span style={{ color: "var(--good)" }}>✓</span> {f}</li>
                ))}
              </ul>
            </div>

            <div className="panel" style={{ padding: 16, borderColor: "rgba(255,46,110,0.4)", boxShadow: "0 0 0 1px rgba(255,46,110,0.2)" }}>
              <div className="flex aic jcb mb8">
                <div style={{ fontWeight: 800 }}>Premium ★</div>
                <div className="chip solid">{plan === "monthly" ? "$7.99/mo" : "$59.99/yr"}</div>
              </div>
              <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {PREMIUM.map((f) => (
                  <li key={f} className="flex aic gap8 tiny"><span style={{ color: "var(--accent-2)" }}>★</span> {f}</li>
                ))}
              </ul>
              <button className="btn btn-primary btn-block mt12" onClick={startTrial} disabled={p.isPremium}>
                {p.isPremium ? "Premium Active" : "Start 7-day free trial"}
              </button>
              <p className="tiny faint mt8 center">Payment is handled by Velnix's subscription layer — no card details stored in the client.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head"><h2 className="section-title"><span className="dot" /> Redeem a code</h2></div>
          <div className="flex gap8">
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. VELNIX7" style={{ flex: 1 }} />
            <button className="btn btn-ghost" onClick={redeem}>Redeem</button>
          </div>
          {msg ? (
            <div className={`chip mt8 ${msg.ok ? "good" : ""}`} style={{ background: msg.ok ? "rgba(45,212,191,0.1)" : "rgba(248,113,113,0.1)", color: msg.ok ? "var(--good)" : "var(--bad)" }}>
              {msg.text}
            </div>
          ) : null}
          <p className="tiny faint mt8">Codes support trials, founder promotions & birthday Premium — configurable from the admin panel.</p>
        </section>

        <section className="section">
          <div className="section-head"><h2 className="section-title"><span className="dot" /> How payment works</h2></div>
          <div className="panel" style={{ padding: 16 }}>
            <div className="flex aic gap8 wrap" style={{ justifyContent: "center", fontSize: 12, color: "var(--text-dim)" }}>
              <span className="chip">User</span> →
              <span className="chip">Subscription Service</span> →
              <span className="chip">Payment Provider</span> →
              <span className="chip">Webhook</span> →
              <span className="chip accent">Premium Status</span>
            </div>
            <p className="tiny faint mt12 center">Premium is verified server-side. The client never decides premium status on its own.</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
