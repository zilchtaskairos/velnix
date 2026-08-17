"use client";

import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { clearNotifications, markAllNotificationsRead, notifications, type AppNotification } from "@/lib/stores";
import { relativeTime } from "@/lib/format";

const TYPE_META: Record<AppNotification["type"], { icon: string; color: string }> = {
  EPISODE: { icon: "🎬", color: "var(--accent)" },
  FRIEND: { icon: "👤", color: "#5b8def" },
  DM: { icon: "✉️", color: "#a855f7" },
  PULSE: { icon: "⚡", color: "var(--accent-2)" },
  COMMENT: { icon: "💬", color: "#22c55e" },
  PARTY: { icon: "🎉", color: "#f59e0b" },
  CLAIRE: { icon: "☘︎", color: "var(--good)" },
  MANGA: { icon: "📖", color: "#06b6d4" },
  PREMIUM: { icon: "★", color: "var(--accent)" },
};

export default function NotificationsPage() {
  const list = notifications.use();
  const unread = list.filter((n) => !n.read).length;

  return (
    <AppShell>
      <div className="container">
        <div className="flex aic jcb mt12 mb12">
          <h1 className="section-title" style={{ fontSize: 22 }}>
            <span className="dot" /> Notifications {unread ? <span className="chip accent tiny">{unread} new</span> : null}
          </h1>
          <div className="flex gap6">
            <button className="btn btn-ghost btn-sm" onClick={markAllNotificationsRead}>Mark all read</button>
            <button className="btn btn-ghost btn-sm" onClick={clearNotifications}>Clear</button>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="state-box">
            <div className="ic">🔔</div>
            <h3 style={{ fontSize: 15 }}>You're all caught up</h3>
            <p className="muted tiny">New episodes, DMs, and Pulse activity will show here.</p>
          </div>
        ) : (
          <div className="flex gap10" style={{ flexDirection: "column" }}>
            {list.map((n) => {
              const meta = TYPE_META[n.type];
              const content = (
                <div className={`list-row ${n.read ? "" : "card-tap"}`} style={{ borderColor: n.read ? "var(--border)" : "rgba(255,46,110,0.25)" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${meta.color}22`, display: "grid", placeItems: "center", fontSize: 20, flex: "0 0 42px" }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex aic gap6">
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</span>
                      {!n.read ? <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--accent)" }} /> : null}
                    </div>
                    <div className="tiny muted">{n.body}</div>
                    <div className="tiny faint">{relativeTime(n.at)} ago</div>
                  </div>
                </div>
              );
              return n.href ? (
                <Link key={n.id} href={n.href} style={{ display: "block" }}>
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
