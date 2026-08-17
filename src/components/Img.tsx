"use client";

import { useState } from "react";

/**
 * Image with a graceful branded fallback. Uses native lazy-loading for
 * performance on mid-range Android. Falls back to a gradient + initials when
 * the source fails (e.g. AniList image 404).
 */
export function Img({
  src,
  alt,
  className,
  seed,
  style,
  loading = "lazy",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  seed?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    const c1 = colorFor(seed || alt || "v", 0);
    const c2 = colorFor(seed || alt || "v", 1);
    return (
      <div
        className={className}
        style={{
          background: `linear-gradient(135deg, ${c1}, ${c2})`,
          display: "grid",
          placeItems: "center",
          color: "rgba(255,255,255,0.55)",
          fontWeight: 700,
          ...style,
        }}
        aria-label={alt}
      >
        <span style={{ opacity: 0.5 }}>✦</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

const PALETTE = [
  ["#ff2e6e", "#7a1340"],
  ["#5b8def", "#1d3a6b"],
  ["#a855f7", "#3d1d5e"],
  ["#22c55e", "#14532d"],
  ["#f59e0b", "#5c3a06"],
  ["#06b6d4", "#0c4a55"],
];

function colorFor(seed: string, idx: 0 | 1): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length][idx];
}
