"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";

interface ProviderInfo {
  id: string;
  label: string;
  enabled: boolean;
  capabilities: string[];
}

export default function AdminPage() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    fetch("/api/providers")
      .then((r) => r.json())
      .then((j) => j.status === "ok" && setProviders(j.providers))
      .catch(() => {});
  }, []);

  return (
    <AppShell>
      <div className="container">
        <div className="premium-card mt12">
          <div className="flex aic gap12 wrap">
            <div style={{ fontSize: 26 }}>🛡</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Velnix Admin</div>
              <div className="muted tiny">Architecture & operations console. Protected routes require server-side auth in production.</div>
            </div>
            <span className="chip warn tiny">Prototype — no auth enforced</span>
          </div>
        </div>

        <div className="tabs mt12 mb12">
          {[
            ["overview", "Overview"],
            ["providers", "Providers"],
            ["premium", "Premium"],
            ["content", "Content"],
            ["moderation", "Moderation"],
          ].map(([k, l]) => (
            <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card title="Users" value="12,480" sub="+312 this week" />
            <Card title="Premium" value="1,204" sub="9.6% conversion" />
            <Card title="Watch hours (24h)" value="8,920" sub="↑ 12%" />
            <Card title="Pulse posts (24h)" value="1,338" sub="48 reported" />
            <Card title="Providers enabled" value={String(providers.filter((p) => p.enabled).length)} sub={`${providers.length} registered`} />
            <Card title="Uptime" value="99.98%" sub="last 30 days" />
          </div>
        )}

        {tab === "providers" && (
          <div className="panel" style={{ padding: 16 }}>
            <p className="muted tiny mb12">
              The Provider Router tries enabled providers in priority order. Enable/disable via environment flags (VELNIX_PROVIDER_*).
            </p>
            <div className="flex gap12" style={{ flexDirection: "column" }}>
              {providers.map((p) => (
                <div key={p.id} className="list-row">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: p.enabled ? "var(--accent-soft)" : "var(--panel-3)", display: "grid", placeItems: "center" }}>⚡</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.label}</div>
                    <div className="flex gap6 mt8">
                      {p.capabilities.map((c) => (
                        <span key={c} className="chip tiny">{c}</span>
                      ))}
                    </div>
                  </div>
                  <span className={`chip tiny ${p.enabled ? "good" : ""}`}>{p.enabled ? "Enabled" : "Disabled"}</span>
                </div>
              ))}
            </div>
            <Link className="btn btn-ghost btn-sm mt12" href="/premium">Provider config lives in src/providers/registry.ts</Link>
          </div>
        )}

        {tab === "premium" && (
          <div className="panel" style={{ padding: 16 }}>
            <h3 className="section-title mb12"><span className="dot" /> Trial & promo configuration</h3>
            <div className="fact-grid">
              <div className="fact"><div className="l">Default trial</div><div className="v">7 days</div></div>
              <div className="fact"><div className="l">Founder promo</div><div className="v">365 days</div></div>
              <div className="fact"><div className="l">Birthday</div><div className="v">30 days</div></div>
              <div className="fact"><div className="l">Verification</div><div className="v">Server-side</div></div>
            </div>
            <p className="tiny faint mt12">Codes are validated against the subscription layer; the client never grants Premium on its own.</p>
          </div>
        )}

        {tab === "content" && (
          <div className="panel" style={{ padding: 16 }}>
            <h3 className="section-title mb12"><span className="dot" /> Featured & banners</h3>
            <div className="field"><label>Featured anime (AniList ID or title)</label><input className="input" defaultValue="Bleach: Thousand-Year Blood War" /></div>
            <div className="field"><label>Home banner headline</label><input className="input" defaultValue="Stream the season's biggest anime" /></div>
            <button className="btn btn-primary btn-sm">Save (demo)</button>
            <p className="tiny faint mt12">Controls the Home hero and Pulse featured rotation.</p>
          </div>
        )}

        {tab === "moderation" && (
          <div className="panel" style={{ padding: 16 }}>
            <h3 className="section-title mb12"><span className="dot" /> Reports queue</h3>
            <div className="flex gap12" style={{ flexDirection: "column" }}>
              {[
                { t: "Pulse post — spoiler", s: "open" },
                { t: "Comment — spam", s: "open" },
                { t: "DM report — harassment", s: "reviewing" },
              ].map((r, i) => (
                <div key={i} className="list-row">
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{r.t}</div>
                  <span className={`chip tiny ${r.s === "open" ? "warn" : "accent"}`}>{r.s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <section className="section">
          <div className="section-head"><h2 className="section-title"><span className="dot" /> Architecture</h2></div>
          <div className="panel" style={{ padding: 16 }}>
            <pre style={{ fontSize: 11, lineHeight: 1.6, overflowX: "auto", color: "var(--text-dim)" }}>{`Frontend  →  Velnix Backend  →  Metadata API (AniList)
                          →  Provider Router  →  Provider Adapter  →  Playable Source
                          →  Application DB (users, social, library, premium)
                          →  Claire AI layer`}</pre>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Card({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="panel" style={{ padding: 16 }}>
      <div className="tiny faint">{title}</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{value}</div>
      {sub ? <div className="tiny muted">{sub}</div> : null}
    </div>
  );
}
