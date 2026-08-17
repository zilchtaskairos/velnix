"use client";

import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { clearContinueWatching, profile, settings, setProfile } from "@/lib/stores";

export default function SettingsPage() {
  const s = settings.use();
  const p = profile.use();

  const set = (patch: Partial<typeof s>) => settings.set((prev) => ({ ...prev, ...patch }));

  return (
    <AppShell>
      <div className="container">
        <h1 className="section-title mt12 mb12" style={{ fontSize: 22 }}>
          <span className="dot" /> Settings
        </h1>

        <section className="section">
          <div className="section-head"><h2 className="section-title">Playback</h2></div>
          <div className="panel" style={{ overflow: "hidden" }}>
            <Toggle label="Autoplay" desc="Start playback automatically" value={s.autoplay} onChange={(v) => set({ autoplay: v })} />
            <Toggle label="Auto Next" desc="Play the next episode automatically" value={s.autoNext} onChange={(v) => set({ autoNext: v })} />
            <Toggle label="Data Saver" desc="Prefer lower quality on mobile data" value={s.reduceData} onChange={(v) => set({ reduceData: v })} />
            <Row label="Preferred audio">
              <div className="flex gap6">
                <button className={`chip ${s.preferredAudio === "sub" ? "accent" : ""}`} onClick={() => set({ preferredAudio: "sub" })}>SUB</button>
                <button className={`chip ${s.preferredAudio === "dub" ? "accent" : ""}`} onClick={() => set({ preferredAudio: "dub" })}>DUB</button>
              </div>
            </Row>
            <Row label="Default quality">
              <select className="input" style={{ width: "auto" }} value={s.defaultQuality} onChange={(e) => set({ defaultQuality: e.target.value })}>
                {["Auto", "1080p", "720p", "480p"].map((q) => (<option key={q} value={q}>{q}</option>))}
              </select>
            </Row>
          </div>
        </section>

        <section className="section">
          <div className="section-head"><h2 className="section-title">Appearance</h2></div>
          <div className="panel" style={{ overflow: "hidden" }}>
            <Row label="Theme">
              <div className="flex gap6">
                <button className={`chip ${s.theme === "amoled" ? "accent" : ""}`} onClick={() => set({ theme: "amoled" })}>AMOLED</button>
                <button className={`chip ${s.theme === "charcoal" ? "accent" : ""}`} onClick={() => set({ theme: "charcoal" })}>Charcoal</button>
              </div>
            </Row>
            <Row label="Profile visibility">
              <div className="flex gap6">
                <button className={`chip ${p.privacy === "PUBLIC" ? "accent" : ""}`} onClick={() => setProfile({ privacy: "PUBLIC" })}>Public</button>
                <button className={`chip ${p.privacy === "PRIVATE" ? "accent" : ""}`} onClick={() => setProfile({ privacy: "PRIVATE" })}>Private</button>
              </div>
            </Row>
          </div>
        </section>

        <section className="section">
          <div className="section-head"><h2 className="section-title">Data</h2></div>
          <div className="panel" style={{ overflow: "hidden" }}>
            <button className="opt" style={{ display: "block", width: "100%", textAlign: "left", padding: "14px 16px" }} onClick={() => clearContinueWatching()}>
              <div style={{ fontWeight: 600 }}>Clear Continue Watching</div>
              <div className="tiny muted">Removes saved playback positions</div>
            </button>
            <button className="opt" style={{ display: "block", width: "100%", textAlign: "left", padding: "14px 16px" }} onClick={() => { if (confirm("Clear all local Velnix data?")) { Object.keys(localStorage).filter((k) => k.startsWith("velnix:")).forEach((k) => localStorage.removeItem(k)); location.reload(); } }}>
              <div style={{ fontWeight: 600, color: "var(--bad)" }}>Reset all local data</div>
              <div className="tiny muted">Library, history, DMs, Pulse & settings</div>
            </button>
          </div>
        </section>

        <section className="section">
          <div className="section-head"><h2 className="section-title">About</h2></div>
          <div className="fact-grid">
            <div className="fact"><div className="l">App</div><div className="v">Velnix</div></div>
            <div className="fact"><div className="l">Metadata</div><div className="v">AniList</div></div>
            <div className="fact"><div className="l">Status</div><div className="v">{p.isPremium ? "Premium" : "Free"}</div></div>
            <div className="fact"><div className="l">Joined</div><div className="v">{new Date(p.joinedAt).toLocaleDateString()}</div></div>
          </div>
          <Link href="/premium" className="btn btn-primary btn-sm mt12">Manage Premium</Link>
        </section>
      </div>
    </AppShell>
  );
}

function Toggle({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex aic jcb" style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-soft)" }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
        {desc ? <div className="tiny muted">{desc}</div> : null}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{ width: 46, height: 26, borderRadius: 999, background: value ? "var(--accent)" : "var(--panel-3)", position: "relative", transition: "background 0.2s", flex: "0 0 46px" }}
        aria-pressed={value}
      >
        <span style={{ position: "absolute", top: 3, left: value ? 23 : 3, width: 20, height: 20, borderRadius: 999, background: "#fff", transition: "left 0.2s" }} />
      </button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex aic jcb gap8" style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-soft)" }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
      {children}
    </div>
  );
}
