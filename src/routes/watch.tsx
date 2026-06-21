import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import ep1 from "@/assets/ep1.mp4.asset.json";
import ep2 from "@/assets/ep2.mp4.asset.json";
import ep3 from "@/assets/ep3.mp4.asset.json";
import ep4 from "@/assets/ep4.mp4.asset.json";
import ep5 from "@/assets/ep5.mp4.asset.json";

export const Route = createFileRoute("/watch")({
  component: WatchPage,
  head: () => ({
    meta: [
      { title: "Heaven Defying Dragonforce — Zone Player" },
      { name: "description", content: "Tonton serial Heaven Defying Dragonforce dengan pemutar Zone." },
    ],
  }),
});

type Episode = { num: number; title: string; src: string };

const EPISODES: Episode[] = [
  { num: 1, title: "Kebangkitan", src: ep1.url },
  { num: 2, title: "Pertarungan Pertama", src: ep2.url },
  { num: 3, title: "Kultivasi Ku Ditekan", src: ep3.url },
  { num: 4, title: "Bentrokan Bayangan", src: ep4.url },
  { num: 5, title: "Jejak Akar Naga", src: ep5.url },
];

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];

const AUTO_DANMAKU: { t: number; text: string }[] = [
  { t: 2, text: "Keren banget animasinya! 🔥" },
  { t: 5, text: "Lei Zhen bangkit!" },
  { t: 9, text: "Naga Awal muncul! 🐉" },
  { t: 13, text: "Gilaaa effectnya wkwk" },
  { t: 18, text: "Animasi Indo makin keren" },
  { t: 24, text: "Auto subscribe ✨" },
  { t: 30, text: "Sound design-nya nampol" },
  { t: 38, text: "Plot twist incoming..." },
  { t: 46, text: "Wuuusssh ⚡" },
  { t: 55, text: "Naga Awal OP!" },
];

type Bullet = { id: number; text: string; row: number; color: string };

const NEON = "#39FF7A";

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function WatchPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef<Set<string>>(new Set());
  const bulletIdRef = useRef(0);

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [input, setInput] = useState("");
  const [comments, setComments] = useState<string[]>([]);

  const current = EPISODES[idx];

  // reset on episode change
  useEffect(() => {
    firedRef.current.clear();
    setTime(0);
    setPlaying(false);
  }, [idx]);

  // apply speed/volume
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = muted;
    }
  }, [volume, muted]);

  const launchBullet = (text: string) => {
    const id = ++bulletIdRef.current;
    const row = Math.floor(Math.random() * 8);
    const palette = [NEON, "#ffffff", "#ffe66d", "#7afcff", "#ff8fb1"];
    const color = palette[Math.floor(Math.random() * palette.length)];
    setBullets((b) => [...b, { id, text, row, color }]);
    window.setTimeout(() => {
      setBullets((b) => b.filter((x) => x.id !== id));
    }, 9000);
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setTime(v.currentTime);
    const sec = Math.floor(v.currentTime);
    AUTO_DANMAKU.forEach((c) => {
      const key = `${idx}-${c.t}`;
      if (sec === c.t && !firedRef.current.has(key)) {
        firedRef.current.add(key);
        launchBullet(c.text);
      }
    });
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !dur) return;
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - r.left) / r.width;
    v.currentTime = ratio * dur;
  };

  const sendComment = (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t) return;
    launchBullet(t);
    setComments((c) => [t, ...c].slice(0, 30));
    setInput("");
  };

  const progress = dur ? (time / dur) * 100 : 0;

  const bulletNodes = useMemo(
    () =>
      bullets.map((b) => (
        <div
          key={b.id}
          className="danmaku-bullet"
          style={{
            top: `${4 + b.row * 11}%`,
            color: b.color,
            textShadow: "0 0 6px rgba(0,0,0,.9), 0 1px 2px rgba(0,0,0,.9)",
          }}
        >
          {b.text}
        </div>
      )),
    [bullets],
  );

  return (
    <div className="min-h-screen bg-[#0a0d0b] text-white">
      <style>{`
        @keyframes danmaku-fly {
          from { transform: translateX(0); }
          to { transform: translateX(-120vw); }
        }
        .danmaku-bullet {
          position: absolute;
          left: 100%;
          white-space: nowrap;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: .2px;
          animation: danmaku-fly 9s linear forwards;
          pointer-events: none;
        }
        @media (min-width: 768px) {
          .danmaku-bullet { font-size: 16px; }
        }
        .neon-glow { box-shadow: 0 0 0 1px rgba(57,255,122,.35), 0 0 24px rgba(57,255,122,.15); }
        .range-neon { accent-color: ${NEON}; }
      `}</style>

      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md font-black text-black"
              style={{ background: NEON }}
            >
              Z
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-black tracking-widest">ZONE</h1>
              <p className="truncate text-[10px] uppercase tracking-[0.2em] text-white/40">
                Heaven Defying Dragonforce
              </p>
            </div>
          </div>
          <span
            className="rounded-full border px-2 py-1 text-[10px] uppercase tracking-widest"
            style={{ borderColor: NEON, color: NEON }}
          >
            Season 1
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_340px]">
        {/* LEFT: Player + comments */}
        <section className="min-w-0">
          {/* Player */}
          <div className="relative overflow-hidden rounded-xl bg-black neon-glow">
            <div className="relative aspect-video w-full">
              <video
                ref={videoRef}
                src={current.src}
                className="absolute inset-0 h-full w-full bg-black"
                onClick={togglePlay}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
                playsInline
              />
              {/* Danmaku overlay */}
              <div
                ref={overlayRef}
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                {bulletNodes}
              </div>

              {/* Center play */}
              {!playing && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 grid place-items-center bg-black/30 transition hover:bg-black/40"
                  aria-label="Play"
                >
                  <span
                    className="grid h-16 w-16 place-items-center rounded-full text-black"
                    style={{ background: NEON, boxShadow: `0 0 30px ${NEON}80` }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="bg-gradient-to-t from-black to-black/70 px-3 pb-3 pt-2">
              {/* Progress */}
              <div
                onClick={seek}
                className="group relative h-2 cursor-pointer rounded-full bg-white/10"
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-[width]"
                  style={{ width: `${progress}%`, background: NEON, boxShadow: `0 0 8px ${NEON}` }}
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={togglePlay}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/10 hover:bg-white/20"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <span className="tabular-nums text-white/70">
                  {fmt(time)} <span className="text-white/30">/</span> {fmt(dur)}
                </span>

                <div className="ml-auto flex items-center gap-2">
                  {/* Volume */}
                  <button
                    onClick={() => setMuted((m) => !m)}
                    className="grid h-8 w-8 place-items-center rounded-md bg-white/10 hover:bg-white/20"
                    aria-label="Mute"
                  >
                    {muted || volume === 0 ? "🔇" : volume < 0.5 ? "🔈" : "🔊"}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(Number(e.target.value));
                      setMuted(false);
                    }}
                    className="range-neon hidden w-20 sm:block"
                  />

                  {/* Speed */}
                  <div className="relative">
                    <button
                      onClick={() => setSpeedOpen((o) => !o)}
                      className="rounded-md bg-white/10 px-2 py-1.5 text-xs font-semibold hover:bg-white/20"
                    >
                      {speed}x
                    </button>
                    {speedOpen && (
                      <div className="absolute bottom-full right-0 mb-2 w-24 overflow-hidden rounded-md border border-white/10 bg-black/95 shadow-lg">
                        {SPEEDS.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setSpeed(s);
                              setSpeedOpen(false);
                            }}
                            className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-white/10 ${
                              s === speed ? "font-bold" : ""
                            }`}
                            style={s === speed ? { color: NEON } : undefined}
                          >
                            {s === 1 ? "1.0x (Normal)" : `${s}x`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Episode title */}
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              Sedang Tayang
            </p>
            <h2 className="mt-1 text-xl font-black sm:text-2xl">
              Episode {current.num} —{" "}
              <span style={{ color: NEON }}>{current.title}</span>
            </h2>
          </div>

          {/* Comment input */}
          <form
            onSubmit={sendComment}
            className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Kirim komentar melayang..."
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm placeholder:text-white/30 focus:outline-none"
              maxLength={80}
            />
            <button
              type="submit"
              className="shrink-0 rounded-md px-4 py-2 text-sm font-bold text-black transition hover:brightness-110"
              style={{ background: NEON }}
            >
              Kirim
            </button>
          </form>

          {/* Comment list (mobile shows beneath; desktop too) */}
          <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
              Riwayat Komentar
            </p>
            {comments.length === 0 ? (
              <p className="text-xs text-white/30">Belum ada komentar. Jadilah yang pertama!</p>
            ) : (
              <ul className="space-y-1.5">
                {comments.map((c, i) => (
                  <li
                    key={i}
                    className="rounded-md bg-white/5 px-3 py-1.5 text-sm text-white/80"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* RIGHT: Episode list */}
        <aside className="min-w-0">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest">
                Daftar Episode
              </h3>
              <span className="text-[10px] uppercase tracking-widest text-white/40">
                Season 1
              </span>
            </div>

            {/* Number grid */}
            <div className="mb-4 grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-5">
              {EPISODES.map((e, i) => {
                const active = i === idx;
                return (
                  <button
                    key={e.num}
                    onClick={() => setIdx(i)}
                    className={`aspect-square rounded-md border text-sm font-bold transition ${
                      active
                        ? "text-black"
                        : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                    }`}
                    style={
                      active
                        ? { background: NEON, borderColor: NEON, boxShadow: `0 0 12px ${NEON}80` }
                        : undefined
                    }
                  >
                    {e.num}
                  </button>
                );
              })}
            </div>

            {/* Detailed list */}
            <ul className="space-y-2">
              {EPISODES.map((e, i) => {
                const active = i === idx;
                return (
                  <li key={e.num}>
                    <button
                      onClick={() => setIdx(i)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition ${
                        active
                          ? "border-transparent"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                      }`}
                      style={
                        active
                          ? { background: "rgba(57,255,122,0.08)", borderColor: NEON }
                          : undefined
                      }
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-sm font-black"
                        style={
                          active
                            ? { background: NEON, color: "#000" }
                            : { background: "rgba(255,255,255,0.06)", color: "#fff" }
                        }
                      >
                        {e.num.toString().padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {e.title}
                        </span>
                        <span className="block text-[10px] uppercase tracking-widest text-white/40">
                          Episode {e.num}
                        </span>
                      </span>
                      {active && (
                        <span
                          className="shrink-0 text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: NEON }}
                        >
                          ▶ On
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="mt-3 px-1 text-center text-[10px] uppercase tracking-[0.25em] text-white/30">
            © Zone Studio
          </p>
        </aside>
      </main>
    </div>
  );
}
