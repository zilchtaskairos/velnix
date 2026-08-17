import type { Song } from "@/lib/types";

/** Songs section — openings & endings. REQUIRED on the details/watch pages. */
export function SongsSection({ songs }: { songs: Song[] }) {
  const openings = songs.filter((s) => s.type === "OPENING");
  const endings = songs.filter((s) => s.type === "ENDING");
  const hasAny = openings.length || endings.length;

  if (!hasAny) {
    return (
      <div className="song-row" style={{ opacity: 0.7 }}>
        <div className="glyph">♪</div>
        <div className="info">
          <div className="t">No theme-song data</div>
          <div className="a">
            Theme credits aren't published for this title. Connect a music metadata provider to fill openings & endings.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {openings.map((s, i) => (
        <div className="song-row" key={`op${i}`}>
          <div className="glyph">♪</div>
          <div className="info">
            <div className="t">{s.title}</div>
            <div className="a">{s.artist}</div>
          </div>
          <span className="chip accent">OP</span>
        </div>
      ))}
      {endings.map((s, i) => (
        <div className="song-row" key={`ed${i}`}>
          <div className="glyph ed">♪</div>
          <div className="info">
            <div className="t">{s.title}</div>
            <div className="a">{s.artist}</div>
          </div>
          <span className="chip">ED</span>
        </div>
      ))}
    </div>
  );
}
