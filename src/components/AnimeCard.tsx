import Link from "next/link";

import { Img } from "./Img";
import { FORMAT_LABEL } from "@/lib/format";
import type { AnimeCard } from "@/lib/types";

export function AnimeCard({ anime, size = "md" }: { anime: AnimeCard; size?: "sm" | "md" | "lg" }) {
  return (
    <Link href={`/anime/${anime.id}`} className={`poster card-tap ${size}`} aria-label={anime.title}>
      {anime.averageScore ? (
        <span className="badge-score pscore">★ {Math.round(anime.averageScore / 10).toFixed(1)}</span>
      ) : null}
      <Img src={anime.coverImage} alt={anime.title} seed={anime.title} />
      <div className="pinfo">
        <div className="ptitle">{anime.title}</div>
        <div className="pmeta">
          {[anime.seasonYear, FORMAT_LABEL[anime.format ?? ""] ?? anime.format, anime.episodes ? `${anime.episodes} ep` : null]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
    </Link>
  );
}

export function AnimeCardMini({ anime }: { anime: AnimeCard }) {
  return (
    <Link href={`/anime/${anime.id}`} className="list-row card-tap">
      <img className="cv" src={anime.coverImage || ""} alt="" loading="lazy" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="truncate" style={{ fontWeight: 700, fontSize: 14 }}>
          {anime.title}
        </div>
        <div className="tiny faint">
          {[anime.seasonYear, FORMAT_LABEL[anime.format ?? ""] ?? anime.format, anime.episodes ? `${anime.episodes} ep` : null]
            .filter(Boolean)
            .join(" · ")}
        </div>
        {anime.genres.length ? <div className="tiny muted truncate">{anime.genres.slice(0, 3).join(", ")}</div> : null}
      </div>
    </Link>
  );
}
