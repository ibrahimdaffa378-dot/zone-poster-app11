import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import ep1 from "@/assets/ep1.mp4.asset.json";
import ep2 from "@/assets/ep2.mp4.asset.json";
import ep3 from "@/assets/ep3.mp4.asset.json";
import ep4 from "@/assets/ep4.mp4.asset.json";
import ep5 from "@/assets/ep5.mp4.asset.json";
import poster from "@/assets/hdd-poster.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zone — Heaven Defying Dragonforce" },
      { name: "description", content: "Tonton serial Heaven Defying Dragonforce di Zone." },
    ],
  }),
  component: Index,
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

type UserComment = {
  id: number;
  user: string;
  avatarColor: string;
  text: string;
  time: number; // epoch ms
  likes: number;
  liked: boolean;
};

const SEED_COMMENTS: Omit<UserComment, "id" | "time">[] = [
  { user: "RyuFan88", avatarColor: "#39FF7A", text: "Animasinya gokil sih, fight scene episode ini juara! 🔥", likes: 124, liked: false },
  { user: "Cultivator_Lei", avatarColor: "#7afcff", text: "Lei Zhen vibes-nya dapet banget, gak sabar ep berikutnya.", likes: 87, liked: false },
  { user: "AnimeIndo", avatarColor: "#ffe66d", text: "Bangga animasi lokal kualitasnya makin naik 👏", likes: 56, liked: false },
  { user: "NagaAwal", avatarColor: "#ff8fb1", text: "Sound design-nya nampol, headphone wajib!", likes: 33, liked: false },
];

const NEON = "#39FF7A";

function timeAgo(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s} dtk lalu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function Index() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const commentIdRef = useRef(1000);

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [input, setInput] = useState("");
  const [comments, setComments] = useState<UserComment[]>(() =>
    SEED_COMMENTS.map((c, i) => ({
      ...c,
      id: i,
      time: Date.now() - (i + 1) * 1000 * 60 * (15 + i * 30),
    })),
  );
  const [, setTick] = useState(0);

  const current = EPISODES[idx];

  // refresh "time ago" labels every minute
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setTime(0);
    setPlaying(false);
  }, [idx]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = muted;
    }
  }, [volume, muted]);

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setTime(v.currentTime);
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
    const newC: UserComment = {
      id: ++commentIdRef.current,
      user: "Kamu",
      avatarColor: NEON,
      text: t,
      time: Date.now(),
      likes: 0,
      liked: false,
    };
    setComments((c) => [newC, ...c]);
    setInput("");
  };

  const toggleLike = (id: number) => {
    setComments((cs) =>
      cs.map((c) =>
        c.id === id
          ? { ...c, liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) }
          : c,
      ),
    );
  };

  const progress = dur ? (time / dur) * 100 : 0;


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
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
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

      <main className="mx-auto max-w-3xl px-4 py-5 space-y-4">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10">
          <div className="relative aspect-[3/4] sm:aspect-[16/9] w-full">
            <img
              src={poster.url}
              alt="Heaven Defying Dragonforce poster"
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
            <div
              className="pointer-events-none absolute -inset-px rounded-2xl"
              style={{ boxShadow: `inset 0 0 60px ${NEON}22` }}
            />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 space-y-3">
              <span
                className="inline-block rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest"
                style={{ borderColor: NEON, color: NEON }}
              >
                Eksklusif • Season 1
              </span>
              <h2 className="text-2xl sm:text-4xl font-black leading-tight drop-shadow-lg">
                Heaven Defying <span style={{ color: NEON }}>Dragonforce</span>
              </h2>
              <p className="max-w-lg text-xs sm:text-sm text-white/75 line-clamp-3">
                Di tanah yang dikuasai kultivator kejam, Lei Zhen bangkit dengan
                kekuatan Naga Awal untuk melawan takdir. Petualangan epik penuh
                pertarungan dahsyat dan rahasia kuno menanti.
              </p>
              <button
                onClick={() => {
                  playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  setTimeout(() => videoRef.current?.play().catch(() => {}), 600);
                }}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-black transition hover:brightness-110"
                style={{ background: NEON, boxShadow: `0 0 24px ${NEON}80` }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Tonton Sekarang
              </button>
            </div>
          </div>
        </section>

        {/* Player */}
        <div ref={playerRef} className="relative overflow-hidden rounded-xl bg-black neon-glow scroll-mt-4">
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

        {/* Active episode title */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
            Sedang Tayang
          </p>
          <h2 className="mt-1 text-lg font-black sm:text-xl">
            Episode {current.num} — <span style={{ color: NEON }}>{current.title}</span>
          </h2>
        </div>

        {/* UserComment input */}
        <form
          onSubmit={sendComment}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2"
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

        {/* UserComment history */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
            Riwayat Komentar
          </p>
          {comments.length === 0 ? (
            <p className="text-xs text-white/30">Belum ada komentar. Jadilah yang pertama!</p>
          ) : (
            <ul className="space-y-1.5">
              {comments.map((c, i) => (
                <li key={i} className="rounded-md bg-white/5 px-3 py-1.5 text-sm text-white/80">
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Episode number grid */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest">Daftar Episode</h3>
            <span className="text-[10px] uppercase tracking-widest text-white/40">Season 1</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
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
        </div>
      </main>
    </div>
  );
}
