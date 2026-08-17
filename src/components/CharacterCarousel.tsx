"use client";

import { Img } from "./Img";
import type { Character } from "@/lib/types";

export function CharacterCarousel({ characters }: { characters: Character[] }) {
  if (!characters.length) return null;
  return (
    <div className="hrow">
      {characters.map((c) => (
        <div key={c.id} className="char">
          <div className="pic">
            <Img src={c.image} alt={c.name} seed={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div className="nm">{c.name}</div>
          <div className="rl">{c.role}</div>
          {c.voiceActors[0] ? (
            <div className="va">
              {c.voiceActors[0].image ? (
                <Img src={c.voiceActors[0].image} alt="" seed={c.voiceActors[0].name} style={{ width: 22, height: 22, borderRadius: 999, objectFit: "cover" }} />
              ) : null}
              <span className="truncate">{c.voiceActors[0].name}</span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
