"use client";

import { AppShell } from "@/components/AppShell";
import { gameAccounts, profile, type GameAccount } from "@/lib/stores";

const GAMES = [
  { name: "Anime Defenders", tag: "Tower Defense", emoji: "🛡️", grad: "linear-gradient(135deg,#ff2e6e,#7a1340)", official: "https://www.roblox.com" },
  { name: "Anime Vanguards", tag: "Strategy", emoji: "⚔️", grad: "linear-gradient(135deg,#5b8def,#1d3a6b)", official: "https://www.roblox.com" },
  { name: "Anime Adventures", tag: "Adventure", emoji: "🗺️", grad: "linear-gradient(135deg,#22c55e,#14532d)", official: "https://www.roblox.com" },
  { name: "Sols RNG", tag: "RNG", emoji: "🎲", grad: "linear-gradient(135deg,#a855f7,#3d1d5e)", official: "https://www.roblox.com" },
  { name: "Blade Ball", tag: "Action", emoji: "🔮", grad: "linear-gradient(135deg,#f59e0b,#5c3a06)", official: "https://www.roblox.com" },
  { name: "Anime Roulette", tag: "Gacha", emoji: "🎰", grad: "linear-gradient(135deg,#06b6d4,#0c4a55)", official: "https://www.roblox.com" },
];

export default function GamesPage() {
  const accounts = gameAccounts.use();
  const isPremium = profile.use().isPremium;

  const connect = (name: string) => {
    const existing = accounts.find((a) => a.game === name);
    if (existing) {
      gameAccounts.set(accounts.map((a) => (a.game === name ? { ...a, connected: !a.connected } : a)));
      return;
    }
    const next: GameAccount[] = [...accounts, { game: name, connected: true, username: "player_" + name.split(" ")[0].toLowerCase() }];
    gameAccounts.set(next);
  };

  return (
    <AppShell>
      <div className="container">
        <h1 className="section-title mt12 mb12" style={{ fontSize: 22 }}>
          <span className="dot" /> Games
        </h1>
        <p className="muted tiny mb16">Discover anime games, link your accounts, and track achievements.</p>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {GAMES.map((g) => {
            const acc = accounts.find((a) => a.game === g.name);
            return (
              <div key={g.name} className="panel" style={{ overflow: "hidden" }}>
                <div style={{ height: 96, background: g.grad, display: "grid", placeItems: "center", fontSize: 40 }}>{g.emoji}</div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{g.name}</div>
                  <div className="tiny muted">{g.tag}</div>
                  <div className="flex gap6 mt8 wrap">
                    {acc?.connected ? <span className="chip good tiny">✓ Linked</span> : null}
                    <button className="chip tiny" onClick={() => connect(g.name)}>
                      {acc?.connected ? "Unlink" : "+ Connect"}
                    </button>
                  </div>
                  <a className="chip tiny mt8" href={g.official} target="_blank" rel="noreferrer noopener" style={{ display: "inline-block" }}>
                    Official ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <section className="section">
          <div className="section-head">
            <h2 className="section-title"><span className="dot" /> Connected accounts</h2>
            <span className="chip">{accounts.filter((a) => a.connected).length} linked</span>
          </div>
          {accounts.filter((a) => a.connected).length === 0 ? (
            <p className="muted tiny">Connect a game to sync achievements to your Velnix profile.</p>
          ) : (
            <div className="flex gap12" style={{ flexDirection: "column" }}>
              {accounts.filter((a) => a.connected).map((a) => (
                <div key={a.game} className="list-row">
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--accent-soft)", display: "grid", placeItems: "center", fontSize: 20 }}>🎮</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{a.game}</div>
                    <div className="tiny muted">{a.username} · 12 achievements</div>
                  </div>
                  <span className="chip good tiny">Synced</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {!isPremium && (
          <p className="tiny faint mt16">Premium unlocks cross-game achievement badges on your profile.</p>
        )}
      </div>
    </AppShell>
  );
}
