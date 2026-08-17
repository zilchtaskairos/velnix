"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PlayableSource, SubtitleTrack } from "@/lib/types";
import { fmtTime } from "@/lib/format";

type Sub = { id: string; label: string; srclang: string; url: string; off?: boolean };

export interface VideoPlayerProps {
  sources: PlayableSource[];
  subtitles: SubtitleTrack[];
  poster?: string | null;
  title: string;
  subtitle?: string;
  prevHref?: string | null;
  nextHref?: string | null;
  startAt?: number;
  autoNextDefault?: boolean;
  onProgress?: (pos: number, dur: number) => void;
  onNearEnd?: () => void;
  onEnded?: () => void;
  onQualityChange?: (q: string) => void;
  note?: string | null;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SKIP_INTRO_SECONDS = 85;

export function VideoPlayer(props: VideoPlayerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nearEndFired = useRef(false);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fs, setFs] = useState(false);
  const [pip, setPip] = useState(false);
  const [rate, setRate] = useState(1);
  const [autoNext, setAutoNext] = useState(props.autoNextDefault ?? true);
  const [showControls, setShowControls] = useState(true);
  const [menu, setMenu] = useState<null | "quality" | "subtitles" | "speed" | "audio">(null);
  const [quality, setQuality] = useState(props.sources[0]?.quality ?? "Auto");
  const [activeSub, setActiveSub] = useState<string>("off");
  const [showSkipIntro, setShowSkipIntro] = useState(false);

  // Build subtitle list (always include "Off")
  const subList: Sub[] = [
    { id: "off", label: "Off", srclang: "off", url: "", off: true },
    ...props.subtitles.map((s, i) => ({ id: `sub-${i}`, label: s.label, srclang: s.srclang, url: s.url })),
  ];

  // ── Load source (HLS via hls.js, native HLS on Safari, plain otherwise) ──
  const loadSource = useCallback((src: PlayableSource, resumeAt?: number) => {
    const video = videoRef.current;
    if (!video) return;
    // Cleanup previous HLS instance.
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setReady(false);
    setWaiting(true);

    const onLoaded = () => {
      setDuration(video.duration || 0);
      if (resumeAt && video.duration && resumeAt < video.duration - 5) {
        try {
          video.currentTime = resumeAt;
        } catch {
          /* ignore */
        }
      }
      setReady(true);
      setWaiting(false);
    };

    if (src.type === "hls") {
      const canNative = video.canPlayType("application/vnd.apple.mpegurl");
      if (canNative) {
        video.src = src.url;
      } else {
        // Dynamic import keeps hls.js out of the initial bundle.
        import("hls.js")
          .then(({ default: Hls }) => {
            if (Hls.isSupported()) {
              const hls = new Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 60 });
              hlsRef.current = hls;
              hls.loadSource(src.url);
              hls.attachMedia(video);
              hls.on(Hls.Events.MANIFEST_PARSED, () => onLoaded());
              hls.on(Hls.Events.ERROR, (_e, data) => {
                if (data.fatal) setWaiting(false);
              });
            } else {
              video.src = src.url;
            }
          })
          .catch(() => {
            video.src = src.url;
          });
      }
    } else {
      video.src = src.url;
    }

    video.addEventListener("loadedmetadata", onLoaded, { once: true });
  }, []);

  // Load first source on mount / when sources change.
  useEffect(() => {
    const first = props.sources[0];
    if (!first) return;
    nearEndFired.current = false;
    loadSource(first, props.startAt);
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.sources[0]?.url]);

  // ── Video element events ──
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setTime(v.currentTime);
      if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
      // Skip-intro button shows during the first chunk.
      setShowSkipIntro(v.currentTime < SKIP_INTRO_SECONDS && v.currentTime > 3);
      props.onProgress?.(v.currentTime, v.duration || 0);
      if (v.duration && v.currentTime > v.duration - 12 && !nearEndFired.current) {
        nearEndFired.current = true;
        props.onNearEnd?.();
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setWaiting(true);
    const onPlaying = () => setWaiting(false);
    const onCanPlay = () => setWaiting(false);
    const onEnded = () => {
      setPlaying(false);
      props.onEnded?.();
      if (autoNext && props.nextHref) window.location.href = props.nextHref;
    };
    const onDur = () => setDuration(v.duration || 0);
    const onVol = () => {
      setVolume(v.volume);
      setMuted(v.muted);
    };
    const onEnterPip = () => setPip(true);
    const onLeavePip = () => setPip(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("ended", onEnded);
    v.addEventListener("durationchange", onDur);
    v.addEventListener("volumechange", onVol);
    v.addEventListener("enterpictureinpicture", onEnterPip);
    v.addEventListener("leavepictureinpicture", onLeavePip);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("durationchange", onDur);
      v.removeEventListener("volumechange", onVol);
      v.removeEventListener("enterpictureinpicture", onEnterPip);
      v.removeEventListener("leavepictureinpicture", onLeavePip);
    };
  }, [props, autoNext]);

  // Fullscreen tracking
  useEffect(() => {
    const onFs = () => setFs(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // ── Actions ──
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
    ping();
  }, []);

  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
    ping();
  }, []);

  const seekTo = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
  }, []);

  const setVol = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  }, []);

  const toggleFs = useCallback(async () => {
    const el = wrapRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      /* unsupported */
    }
    ping();
  }, []);

  const togglePip = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (document.pictureInPictureEnabled) await v.requestPictureInPicture();
    } catch {
      /* unsupported */
    }
    ping();
  }, []);

  const cast = useCallback(async () => {
    const v = videoRef.current as HTMLVideoElement & { webkitShowPlaybackTargetPicker?: () => void };
    // Only available where the platform allows it (e.g. Safari AirPlay).
    if (v?.webkitShowPlaybackTargetPicker) v.webkitShowPlaybackTargetPicker();
  }, []);

  const changeRate = useCallback((r: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = r;
    setRate(r);
    setMenu(null);
  }, []);

  const changeQuality = useCallback(
    (q: string) => {
      const v = videoRef.current;
      const pos = v?.currentTime ?? 0;
      const src = props.sources.find((s) => s.quality === q) ?? props.sources[0];
      setQuality(q);
      setMenu(null);
      props.onQualityChange?.(q);
      if (src) loadSource(src, pos);
    },
    [props.sources, loadSource, props],
  );

  const changeSub = useCallback(
    (id: string) => {
      const v = videoRef.current;
      if (!v) return;
      const tracks = v.textTracks;
      for (let i = 0; i < tracks.length; i++) tracks[i].mode = "hidden";
      const sub = subList.find((s) => s.id === id);
      if (sub && !sub.off) {
        // Try to find a matching track already attached via <track>
        const idx = subList.filter((s) => !s.off).indexOf(sub);
        if (tracks[idx]) tracks[idx].mode = "showing";
      }
      setActiveSub(id);
      setMenu(null);
    },
    [subList],
  );

  const skipIntro = useCallback(() => {
    seekTo(SKIP_INTRO_SECONDS);
    ping();
  }, [seekTo]);

  // ── Controls auto-hide ──
  const ping = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.code === "Space" || e.code === "KeyK") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") seekBy(-10);
      else if (e.code === "ArrowRight") seekBy(10);
      else if (e.code === "KeyF") toggleFs();
      else if (e.code === "KeyM") toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, seekBy, toggleFs, toggleMute]);

  // Apply subtitles as <track> elements so the player can show them.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // remove old
    v.querySelectorAll("track").forEach((t) => t.remove());
    props.subtitles.forEach((s) => {
      const t = document.createElement("track");
      t.kind = "subtitles";
      t.label = s.label;
      t.srclang = s.srclang;
      t.src = s.url;
      t.default = false;
      v.appendChild(t);
    });
    // ensure correct mode after attach
    const id = setTimeout(() => changeSub(activeSub), 200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.subtitles]);

  const pct = duration ? (time / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;
  const qualities = Array.from(new Set(props.sources.map((s) => s.quality)));

  return (
    <div
      className={`player-wrap ${showControls ? "show-controls" : ""}`}
      ref={wrapRef}
      onMouseMove={ping}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".player-controls") || (e.target as HTMLElement).closest(".pc-menu")) return;
        togglePlay();
      }}
    >
      <video
        ref={videoRef}
        playsInline
        poster={props.poster || undefined}
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      />

      {/* Loading */}
      {waiting && ready ? (
        <div className="player-loading">
          <div className="spinner" />
        </div>
      ) : null}

      {/* Center play overlay before first play */}
      {!playing && ready ? (
        <div className="player-center-btn">
          <button className="pp" onClick={togglePlay} aria-label="Play">
            ▶
          </button>
        </div>
      ) : null}

      {/* Skip intro */}
      {showSkipIntro && playing ? (
        <button
          className="btn btn-primary btn-sm"
          style={{ position: "absolute", right: 14, bottom: 86, zIndex: 5 }}
          onClick={skipIntro}
        >
          Skip Intro ⏭
        </button>
      ) : null}

      {/* Controls */}
      <div className="player-controls" onClick={(e) => e.stopPropagation()}>
        <div className="pc-top">
          <span className="ttl">{props.title}</span>
          {props.subtitle ? <span className="muted tiny" style={{ marginLeft: 6 }}>{props.subtitle}</span> : null}
        </div>

        <div className="pc-mid">
          {props.prevHref ? (
            <a className="c" href={props.prevHref} title="Previous episode" onClick={(e) => e.stopPropagation()}>
              ⏮
            </a>
          ) : null}
          <button className="c" onClick={() => seekBy(-10)} title="-10s">
            ⟲
          </button>
          <button className="c" onClick={togglePlay} style={{ fontSize: 40 }} title="Play/Pause">
            {playing ? "❚❚" : "▶"}
          </button>
          <button className="c" onClick={() => seekBy(10)} title="+10s">
            ⟳
          </button>
          {props.nextHref ? (
            <a className="c" href={props.nextHref} title="Next episode" onClick={(e) => e.stopPropagation()}>
              ⏭
            </a>
          ) : null}
        </div>

        <div className="pc-bottom">
          <ProgressBar pct={pct} bufPct={bufPct} duration={duration} onSeek={seekTo} onPing={ping} />

          <div className="pc-row">
            <div className="left">
              <button className="pbtn" onClick={togglePlay} title="Play/Pause">
                {playing ? "❚❚" : "▶"}
              </button>
              {props.prevHref ? (
                <a className="pbtn" href={props.prevHref} onClick={(e) => e.stopPropagation()} title="Previous">
                  ⏮
                </a>
              ) : null}
              {props.nextHref ? (
                <a className="pbtn" href={props.nextHref} onClick={(e) => e.stopPropagation()} title="Next">
                  ⏭
                </a>
              ) : null}
              <button className="pbtn" onClick={toggleMute} title="Mute">
                {muted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
              </button>
              <div className="vol">
                <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(e) => setVol(Number(e.target.value))} aria-label="Volume" />
              </div>
              <span className="pc-time">{fmtTime(time)} / {fmtTime(duration)}</span>
            </div>

            <div className="right">
              {props.subtitles.length > 0 ? (
                <button className={`pbtn ${activeSub !== "off" ? "on" : ""}`} onClick={() => setMenu(menu === "subtitles" ? null : "subtitles")} title="Subtitles">
                  CC
                </button>
              ) : null}
              <button className={`pbtn ${rate !== 1 ? "on" : ""}`} onClick={() => setMenu(menu === "speed" ? null : "speed")} title="Speed">
                {rate}×
              </button>
              {qualities.length > 1 ? (
                <button className="pbtn" onClick={() => setMenu(menu === "quality" ? null : "quality")} title="Quality">
                  ⚙
                </button>
              ) : (
                <span className="pc-time">{quality}</span>
              )}
              <button className="pbtn" onClick={cast} title="Cast">
                ⧉
              </button>
              <button className={`pbtn ${pip ? "on" : ""}`} onClick={togglePip} title="Picture-in-picture">
                ⧉
              </button>
              <button className={`pbtn ${autoNext ? "on" : ""}`} onClick={() => setAutoNext((a) => !a)} title="Auto-next">
                ↻
              </button>
              <button className="pbtn" onClick={toggleFs} title="Fullscreen">
                {fs ? "⤢" : "⛶"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings menu */}
      {menu ? (
        <div className="pc-menu" onClick={(e) => e.stopPropagation()}>
          {menu === "quality" && (
            <>
              <div className="group">Quality</div>
              {qualities.map((q) => (
                <button key={q} className={`opt ${q === quality ? "sel" : ""}`} onClick={() => changeQuality(q)}>
                  <span>{q}</span>
                  {q === quality ? <span>✓</span> : null}
                </button>
              ))}
            </>
          )}
          {menu === "subtitles" && (
            <>
              <div className="group">Subtitles</div>
              {subList.map((s) => (
                <button key={s.id} className={`opt ${s.id === activeSub ? "sel" : ""}`} onClick={() => changeSub(s.id)}>
                  <span>{s.label}</span>
                  {s.id === activeSub ? <span>✓</span> : null}
                </button>
              ))}
            </>
          )}
          {menu === "speed" && (
            <>
              <div className="group">Playback speed</div>
              {SPEEDS.map((s) => (
                <button key={s} className={`opt ${s === rate ? "sel" : ""}`} onClick={() => changeRate(s)}>
                  <span>{s}× {s === 1 ? "(Normal)" : ""}</span>
                  {s === rate ? <span>✓</span> : null}
                </button>
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ProgressBar({
  pct,
  bufPct,
  duration,
  onSeek,
  onPing,
}: {
  pct: number;
  bufPct: number;
  duration: number;
  onSeek: (t: number) => void;
  onPing: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const posFromEvent = (clientX: number) => {
    const el = ref.current;
    if (!el || !duration) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * duration;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setActive(true);
    onSeek(posFromEvent(e.clientX));
    onPing();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!active) return;
    onSeek(posFromEvent(e.clientX));
  };
  const onPointerUp = () => setActive(false);

  return (
    <div
      className={`progress ${active ? "active" : ""}`}
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div className="track">
        <div className="buf" style={{ width: `${bufPct}%` }} />
        <div className="fill" style={{ width: `${pct}%` }} />
        <div className="knob" style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
}
