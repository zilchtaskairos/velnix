"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { library } from "@/lib/stores";
import type { Manga } from "@/lib/manga";

export default function MangaReaderPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const search = useSearchParams();
  const chapter = Number(search.get("chapter")) || 1;
  const [manga, setManga] = useState<Manga | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetch(`/api/manga/${id}`)
      .then((r) => r.json())
      .then((j) => j.status === "ok" && setManga(j.manga))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(1, scrolled / max) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapter]);

  const total = manga?.chapters ?? null;
  const prev = chapter > 1 ? `/manga/${id}/read?chapter=${chapter - 1}` : null;
  const next = !total || chapter < total ? `/manga/${id}/read?chapter=${chapter + 1}` : null;

  return (
    <AppShell>
      <div className="reader-bar">
        <Link href={`/manga/${id}`} className="iconbtn" aria-label="Back">
          ‹
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="truncate" style={{ fontWeight: 700, fontSize: 14 }}>
            {manga?.title ?? "Manga"}
          </div>
          <div className="tiny muted">Chapter {chapter}{total ? ` of ${total}` : ""}</div>
        </div>
        <div style={{ position: "relative", width: 38, height: 38 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 999, border: "2px solid var(--border-strong)" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: "conic-gradient(var(--accent) " + progress * 360 + "deg, transparent 0)" }} />
          <div style={{ position: "absolute", inset: 4, borderRadius: 999, background: "var(--bg)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700 }}>
            {Math.round(progress * 100)}%
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 12, maxWidth: 720 }}>
        {/* Reader content. AniList does not provide page images, so each "page"
            is a clean branded placeholder. A licensed manga provider fills these
            via the same provider-adapter pattern as the video resolver. */}
        {Array.from({ length: 8 }, (_, i) => i + 1).map((p) => (
          <div
            key={p}
            className="reader-page"
            style={{
              aspectRatio: "3 / 4",
              marginBottom: 2,
              background: `linear-gradient(${160 + p * 8}deg, #14141a, #0c0c10)`,
              display: "grid",
              placeItems: "center",
              color: "var(--text-faint)",
              borderBottom: "1px solid var(--border-soft)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-dim)" }}>— {p} —</div>
              <div className="tiny" style={{ marginTop: 6, maxWidth: 260 }}>
                Page {p} · Chapter {chapter}
              </div>
            </div>
          </div>
        ))}

        <div className="state-box mt16">
          <div className="ic">📖</div>
          <h3 style={{ fontSize: 15 }}>Licensed manga pages</h3>
          <p className="tiny muted">
            AniList provides manga metadata but not page images. Connect a licensed manga provider in the providers layer to render real pages. All chapter navigation, progress tracking & bookmarks work today.
          </p>
        </div>

        <div className="flex gap8 mt16 mb24">
          {prev ? (
            <Link className="btn btn-ghost btn-block" href={prev}>
              ⏮ Prev Chapter
            </Link>
          ) : (
            <button className="btn btn-ghost btn-block" disabled>
              First Chapter
            </button>
          )}
          {next ? (
            <Link className="btn btn-primary btn-block" href={next}>
              Next Chapter ⏭
            </Link>
          ) : (
            <button className="btn btn-ghost btn-block" disabled>
              Last Chapter
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

void library;
