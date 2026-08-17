"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Img } from "@/components/Img";
import { EmptyBox, ErrorBox, Loading } from "@/components/StateBox";
import { STATUS_LABEL } from "@/lib/format";
import { library, removeLibraryEntry, setLibraryEntry } from "@/lib/stores";
import type { Manga } from "@/lib/manga";

export default function MangaDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [manga, setManga] = useState<Manga | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const j = await fetch(`/api/manga/${id}`).then((r) => r.json());
      if (j.status === "ok") setManga(j.manga);
      else if (j.status === "empty") setManga(null);
      else throw new Error(j.message);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load manga.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const lib = library.use();
  const entry = lib[`manga:${id}`];

  return (
    <AppShell>
      <div className="container">
        <Link href="/manga" className="detail-back" style={{ position: "static", display: "inline-grid", width: 40, height: 40, margin: "8px 0" }} aria-label="Back">
          ‹
        </Link>

        {loading ? (
          <Loading label="Loading manga" />
        ) : err ? (
          <ErrorBox message={err} onRetry={load} />
        ) : !manga ? (
          <EmptyBox title="Manga not found" message="This title may have been removed." action={<Link className="btn btn-ghost btn-sm" href="/manga">Back to Manga</Link>} />
        ) : (
          <>
            <div className="detail-hero" style={{ height: 240 }}>
              <Img src={manga.bannerImage || manga.coverImage} alt="" seed={manga.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div className="scrim" />
            </div>

            <div className="detail-body">
              <div className="detail-head">
                <div className="detail-poster">
                  <Img src={manga.coverImage} alt={manga.title} seed={manga.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div className="detail-title" style={{ paddingBottom: 8 }}>
                  <h1>{manga.title}</h1>
                  {manga.nativeTitle ? <div className="native">{manga.nativeTitle}</div> : null}
                  <div className="flex aic gap8 wrap mt8">
                    {manga.averageScore ? <span className="chip good">★ {(manga.averageScore / 10).toFixed(1)}</span> : null}
                    {manga.format ? <span className="chip">{manga.format}</span> : null}
                    {manga.status ? <span className="chip">{STATUS_LABEL[manga.status] ?? manga.status}</span> : null}
                    {manga.chapters ? <span className="chip">{manga.chapters} ch</span> : null}
                  </div>
                </div>
              </div>

              <div className="flex gap8 wrap mt16">
                <Link className="btn btn-primary" href={`/manga/${id}/read?chapter=1`}>
                  📖 Read Chapter 1
                </Link>
                <button
                  className={`btn btn-sm ${entry ? "btn-outline" : "btn-ghost"}`}
                  onClick={() =>
                    entry
                      ? removeLibraryEntry(id, "manga")
                      : setLibraryEntry({
                          id,
                          kind: "manga",
                          title: manga.title,
                          coverImage: manga.coverImage ?? null,
                          bannerImage: manga.bannerImage ?? null,
                          color: manga.color ?? null,
                          status: "PLANNED",
                          chaptersRead: 0,
                          updatedAt: Date.now(),
                        })
                  }
                >
                  {entry ? "✓ In Library" : "+ Add to Library"}
                </button>
              </div>

              {manga.description ? <p className="muted mt16" style={{ lineHeight: 1.6 }}>{manga.description}</p> : null}

              {manga.genres.length ? (
                <div className="genres mt16">
                  {manga.genres.map((g) => (
                    <span key={g} className="chip">{g}</span>
                  ))}
                </div>
              ) : null}

              <div className="fact-grid">
                <div className="fact"><div className="l">Author</div><div className="v">{manga.authors.find((a) => /story|original|author/i.test(a.role))?.name ?? manga.authors[0]?.name ?? "—"}</div></div>
                <div className="fact"><div className="l">Artist</div><div className="v">{manga.authors.find((a) => /art/i.test(a.role))?.name ?? manga.authors[0]?.name ?? "—"}</div></div>
                <div className="fact"><div className="l">Chapters</div><div className="v">{manga.chapters ?? "Ongoing"}</div></div>
                <div className="fact"><div className="l">Volumes</div><div className="v">{manga.volumes ?? "—"}</div></div>
              </div>

              {/* Chapter list */}
              <section className="section">
                <div className="section-head">
                  <h2 className="section-title"><span className="dot" /> Chapters</h2>
                  <span className="chip">{manga.chapters ?? "Ongoing"}</span>
                </div>
                <div className="flex gap8" style={{ flexDirection: "column" }}>
                  {Array.from({ length: Math.min(manga.chapters ?? 24, 24) }, (_, i) => i + 1).map((ch) => (
                    <Link key={ch} href={`/manga/${id}/read?chapter=${ch}`} className="list-row card-tap">
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--panel-3)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12 }}>Ch {ch}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>Chapter {ch}</div>
                        <div className="tiny muted">Tap to read</div>
                      </div>
                      <span style={{ color: "var(--text-faint)" }}>›</span>
                    </Link>
                  ))}
                </div>
                {(!manga.chapters || manga.chapters > 24) && (
                  <p className="tiny faint mt8">Showing first chapters. The reader loads any chapter by number.</p>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
