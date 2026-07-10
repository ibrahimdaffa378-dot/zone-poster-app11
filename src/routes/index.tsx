import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import ep1 from "@/assets/ep1.mp4.asset.json";
import ep2 from "@/assets/ep2.mp4.asset.json";
import ep3 from "@/assets/ep3.mp4.asset.json";
import ep4 from "@/assets/ep4.mp4.asset.json";
import ep5 from "@/assets/ep5.mp4.asset.json";
import poster from "@/assets/hdd-poster.asset.json";
import ep6Poster from "@/assets/ep6-akar-terlarang.jpg.asset.json";
import taichuVideo from "@/assets/taichu-leizhen.mp4.asset.json";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import type { Session } from "@supabase/supabase-js";

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
const NEON = "#39FF7A";

// ---------------- RANK SYSTEM (Beta) ----------------
const WATCHED_KEY = "hdd_watched_eps_v1";
const MAX_LEVEL = 19;

type RankInfo = {
  level: number;
  tierName: "Coklat" | "Silver" | "Gold [Beta]";
  color: string;
  glow: string;
  nextLevelAt: number | null; // watched-count needed to reach next level
  progressPct: number; // 0-100 progress within current rank tier
};

function computeRank(watchedCount: number, total: number): RankInfo {
  const clamped = Math.max(0, Math.min(watchedCount, total));
  const level = total > 0
    ? Math.max(1, Math.min(MAX_LEVEL, Math.round(1 + (clamped * (MAX_LEVEL - 1)) / total)))
    : 1;
  let tierName: RankInfo["tierName"];
  let color: string;
  let glow: string;
  let tierStart: number;
  let tierEnd: number;
  if (level <= 9) {
    tierName = "Coklat";
    color = "#a97142";
    glow = "rgba(169,113,66,0.5)";
    tierStart = 1; tierEnd = 9;
  } else if (level <= 17) {
    tierName = "Silver";
    color = "#c9d1d9";
    glow = "rgba(201,209,217,0.55)";
    tierStart = 10; tierEnd = 17;
  } else {
    tierName = "Gold [Beta]";
    color = "#ffd257";
    glow = "rgba(255,210,87,0.6)";
    tierStart = 18; tierEnd = 19;
  }
  const span = tierEnd - tierStart;
  const progressPct = span === 0
    ? (level >= tierEnd ? 100 : 0)
    : Math.round(((level - tierStart) / span) * 100);
  const nextLevelAt = level >= MAX_LEVEL ? null : Math.ceil(((level) * total) / (MAX_LEVEL - 1));
  return { level, tierName, color, glow, nextLevelAt, progressPct };
}

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_color: string;
};

type ChatMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile | null;
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}d`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j`;
  return `${Math.floor(h / 24)}h`;
}

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

// ---------------- LOGIN GATE ----------------
const TIER_KEY = "zone_tier";
const ALIAS_KEY = "zone_alias";

type Tier = "dev" | "standard" | "pro";

const QUIZ: { q: string; opts: string[]; a: number }[] = [
  { q: "Siapa rival Lei Zhen yang akhirnya menjadi teman baiknya?", opts: ["Xhuan Xen", "Xhunanye", "Hong Shou"], a: 0 },
  { q: "Siapa ayah Lei Zhen?", opts: ["Lei Wuji", "Lei Tian", "Lei Kun"], a: 1 },
  { q: "Kenapa Tai Chu memilih Lei Zhen sebagai murid?", opts: ["Karena keluarganya kaya", "Karena sudah dewa", "Karena darah Naga Awal mengalir di tubuhnya"], a: 2 },
  { q: "Apa kekuatan inti Lei Zhen?", opts: ["Naga Awal", "Api Phoenix", "Es Abadi"], a: 0 },
  { q: "Bagaimana kondisi kultivasi Lei Zhen di awal cerita?", opts: ["Sudah master", "Ditekan / dianggap lemah", "Sudah jadi dewa"], a: 1 },
  { q: "Siapa guru spiritual utama Lei Zhen?", opts: ["Hong Shou", "Xhuan Xen", "Tai Chu"], a: 2 },
  { q: "Apa wujud transformasi khas Lei Zhen?", opts: ["Wujud Harimau Putih", "Wujud Naga", "Wujud Burung Phoenix"], a: 1 },
  { q: "Salah satu musuh besar di awal kebangkitan Lei Zhen berasal dari klan?", opts: ["Klan Hong", "Klan Lei", "Klan Tai"], a: 0 },
  { q: "Tema utama Heaven Defying Dragonforce?", opts: ["Komedi sekolah", "Melawan takdir & langit", "Roman kerajaan"], a: 1 },
  { q: "Apa yang Lei Zhen kejar di sepanjang perjalanannya?", opts: ["Harta karun dunia", "Kekuatan untuk balas dendam & melindungi", "Jabatan kaisar"], a: 1 },
];

function QuizModal({ onPass, onClose }: { onPass: () => void; onClose: () => void }) {
  const [answers, setAnswers] = useState<number[]>(Array(QUIZ.length).fill(-1));
  const [result, setResult] = useState<null | { ok: boolean; wrong: number[] }>(null);

  const submit = () => {
    const wrong: number[] = [];
    QUIZ.forEach((q, i) => { if (answers[i] !== q.a) wrong.push(i); });
    setResult({ ok: wrong.length === 0, wrong });
    if (wrong.length === 0) setTimeout(onPass, 700);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0d0f0d] p-5 sm:rounded-2xl animate-fade-in">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest">Kuis Verifikasi • HDD</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>
        <p className="text-xs text-white/60">
          10 pertanyaan seputar <span style={{ color: NEON }}>Heaven Defying Dragonforce</span>. Semua harus benar untuk lanjut.
        </p>

        <ol className="mt-4 space-y-4">
          {QUIZ.map((q, i) => (
            <li key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="text-xs font-bold text-white/90">{i + 1}. {q.q}</div>
              <div className="mt-2 space-y-1.5">
                {q.opts.map((opt, oi) => {
                  const picked = answers[i] === oi;
                  const isWrong = result && !result.ok && result.wrong.includes(i) && picked;
                  return (
                    <label
                      key={oi}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition ${picked ? "bg-white/10" : "hover:bg-white/5"}`}
                      style={{ borderColor: isWrong ? "#ff6b6b" : picked ? NEON : "rgba(255,255,255,0.08)" }}
                    >
                      <input
                        type="radio"
                        name={`q-${i}`}
                        checked={picked}
                        onChange={() => {
                          const next = [...answers];
                          next[i] = oi;
                          setAnswers(next);
                          setResult(null);
                        }}
                        style={{ accentColor: NEON }}
                      />
                      <span>{String.fromCharCode(65 + oi)}. {opt}</span>
                    </label>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>

        {result && !result.ok && (
          <div className="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold"
            style={{ borderColor: "#ff4d4d55", background: "#ff4d4d12", color: "#ff6b6b" }}>
            Ada {result.wrong.length} jawaban salah. Perbaiki dulu — semua harus benar.
          </div>
        )}
        {result && result.ok && (
          <div className="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold"
            style={{ borderColor: `${NEON}55`, background: `${NEON}15`, color: NEON }}>
            Semua benar! Mengarahkan kamu masuk...
          </div>
        )}

        <button
          onClick={submit}
          disabled={answers.includes(-1)}
          className="mt-4 w-full rounded-full px-5 py-2.5 text-sm font-black text-black transition hover:brightness-110 disabled:opacity-50"
          style={{ background: NEON, boxShadow: `0 0 24px ${NEON}80` }}
        >
          Submit Jawaban
        </button>
      </div>
    </div>
  );
}

function CaptchaModal({ onPass, onClose }: { onPass: () => void; onClose: () => void }) {
  const [checked, setChecked] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const onCheck = () => {
    if (checked || verifying) return;
    setVerifying(true);
    setTimeout(() => {
      setChecked(true);
      setVerifying(false);
      setTimeout(onPass, 600);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0f0d] p-5 animate-scale-in">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: "#FFD27A" }}>Verifikasi VIP</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>
        <p className="text-xs text-white/60">Apakah anda robot atau bukan?</p>

        <div className="mt-4 rounded-xl border border-white/15 bg-white/[0.03] p-4">
          <label className="flex cursor-pointer items-center gap-3" onClick={onCheck}>
            <span className="relative grid h-7 w-7 place-items-center rounded border-2 border-white/30 bg-black">
              {verifying && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />}
              {checked && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#39FF7A" strokeWidth="3">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </span>
            <span className="text-sm font-semibold">Saya bukan robot</span>
          </label>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-white/40">
            <span>reCAPTCHA</span>
            <span>Privasi · Syarat</span>
          </div>
        </div>

        {checked && (
          <div className="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold"
            style={{ borderColor: "#FFD27A55", background: "#FFD27A12", color: "#FFD27A" }}>
            Verifikasi berhasil. Membuka Akun PRO...
          </div>
        )}
      </div>
    </div>
  );
}

function DevNameModal({ onSubmit, onClose }: { onSubmit: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0f0d] p-5 animate-scale-in">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest">Masuk dengan Google</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>
        <p className="text-xs text-white/60">Masukkan username kamu untuk melanjutkan.</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="username"
          className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[color:var(--n)]"
          style={{ ["--n" as never]: NEON }}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSubmit(name.trim()); }}
        />
        <button
          onClick={() => name.trim() && onSubmit(name.trim())}
          disabled={!name.trim()}
          className="mt-4 w-full rounded-full px-5 py-2.5 text-sm font-black text-black transition hover:brightness-110 disabled:opacity-50"
          style={{ background: NEON }}
        >
          Lanjut
        </button>
        <p className="mt-3 text-center text-[10px] text-white/30">Developer? Pakai username asli kamu.</p>
      </div>
    </div>
  );
}

function LoginGate({ onSignedIn }: { onSignedIn: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<null | "google" | "x" | "fb">(null);
  const [showDevName, setShowDevName] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingAlias, setPendingAlias] = useState<string>("");

  const startOAuth = async (tier: Tier, alias: string) => {
    try {
      localStorage.setItem(TIER_KEY, tier);
      localStorage.setItem(ALIAS_KEY, alias);
    } catch { /* ignore */ }
    setLoading("google");
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError("Gagal masuk. Coba lagi.");
        setLoading(null);
        return;
      }
      if (!result.redirected) onSignedIn();
    } catch {
      setLoading(null);
    }
  };

  const clickGoogle = () => { setError(null); setShowDevName(true); };
  const handleDevName = (name: string) => {
    setShowDevName(false);
    setPendingAlias(name);
    if (name === "Sion_dfkit") startOAuth("dev", "Sion_dfkit");
    else setShowQuiz(true);
  };
  const clickX = async () => {
    setError(null);
    setLoading("x");
    await new Promise((r) => setTimeout(r, 1400));
    await startOAuth("standard", "user");
  };
  const clickFb = () => { setError(null); setShowCaptcha(true); };

  return (
    <div className="min-h-screen bg-[#070907] text-white animate-fade-in">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-10">
        <div className="mb-6 flex flex-col items-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl text-2xl font-black text-black"
            style={{ background: NEON, boxShadow: `0 0 36px ${NEON}80` }}>Z</div>
          <h1 className="mt-4 text-2xl font-black tracking-widest">ZONE</h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-white/40">Heaven Defying Dragonforce</p>
        </div>

        <div className="w-full rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="text-base font-black">Masuk dulu untuk lanjut</h2>
          <p className="mt-1 text-xs text-white/60">Pilih cara login. Ini bantu komunitas tetap aman dan ngebantu wawasan kamu makin luas.</p>

          <div className="mt-5 space-y-3">
            <button onClick={clickGoogle} disabled={loading !== null}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10 disabled:opacity-60">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white">
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.1z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.6 5.1C9.6 39.6 16.2 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.3 5.2C41 35.8 44 30.4 44 24c0-1.3-.1-2.4-.4-3.5z"/>
                  </svg>
                </span>
                <div>
                  <div className="text-sm font-bold">Lanjut dengan Google</div>
                  <div className="text-[11px] text-white/50">Layanan Standar • Bisa nonton trailer & episode</div>
                </div>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-black"
                style={{ background: NEON }}>Aktif</span>
            </button>

            <button onClick={clickX} disabled={loading !== null}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10 disabled:opacity-60">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-black text-white">
                  {loading === "x" ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.96l-5.45-7.13L3.7 22H.44l8.04-9.19L.5 2h7.13l4.92 6.51L18.244 2zm-2.44 18h1.93L7.27 4H5.23l10.575 16z"/>
                    </svg>
                  )}
                </span>
                <div>
                  <div className="text-sm font-bold">Lanjut dengan X</div>
                  <div className="text-[11px] text-white/50">{loading === "x" ? "Memproses..." : "Layanan Pro • Akses penuh"}</div>
                </div>
              </div>
              <span className="rounded-full border border-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/70">Pro</span>
            </button>

            <button onClick={clickFb} disabled={loading !== null}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10 disabled:opacity-60">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#1877F2] text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/>
                  </svg>
                </span>
                <div>
                  <div className="text-sm font-bold">Lanjut dengan Facebook</div>
                  <div className="text-[11px] text-white/50">Layanan VIP • Beta</div>
                </div>
              </div>
              <span className="rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"
                style={{ borderColor: "#FFD27A", color: "#FFD27A" }}>VIP</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border px-3 py-2 text-xs font-semibold"
              style={{ borderColor: "#ff4d4d55", background: "#ff4d4d12", color: "#ff6b6b" }}>{error}</div>
          )}

          <p className="mt-5 text-center text-[10px] text-white/30">Dengan masuk kamu setuju ikut menjaga obrolan tetap sopan.</p>
        </div>
      </div>

      {showDevName && <DevNameModal onClose={() => setShowDevName(false)} onSubmit={handleDevName} />}
      {showQuiz && (
        <QuizModal onClose={() => setShowQuiz(false)}
          onPass={() => { setShowQuiz(false); startOAuth("standard", pendingAlias || "user"); }} />
      )}
      {showCaptcha && (
        <CaptchaModal onClose={() => setShowCaptcha(false)}
          onPass={() => { setShowCaptcha(false); startOAuth("pro", "vip_member"); }} />
      )}
    </div>
  );
}

// ---------------- BADGES ----------------
// TikTok/X-style verified checkmark — scalloped blue badge with white check
function VerifiedCheck({ size = 16, title = "Verified" }: { size?: number; title?: string }) {
  return (
    <span
      title={title}
      aria-label={title}
      className="inline-grid shrink-0 place-items-center align-middle"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path
          fill="#1d9bf0"
          d="M12 1.5l2.36 1.86 3-.27.92 2.86 2.86.92-.27 3L22.5 12l-1.86 2.36.27 3-2.86.92-.92 2.86-3-.27L12 22.5l-2.36-1.86-3 .27-.92-2.86-2.86-.92.27-3L1.5 12l1.86-2.36-.27-3 2.86-.92.92-2.86 3 .27L12 1.5z"
        />
        <path
          d="M7.5 12.2l3 3 6-6"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function DevPurpleCheck({ size = 14, title = "Developer" }: { size?: number; title?: string }) {
  return (
    <span
      title={title}
      aria-label={title}
      className="inline-grid shrink-0 place-items-center align-middle"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="#8B5CF6" />
        <path
          d="M7 12l3 3 7-7"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function TierBadges({ tier }: { tier: Tier }) {
  if (tier === "dev") {
    // Quiz survivors / developers get the official blue verified check
    return <VerifiedCheck title="Verified" />;
  }
  if (tier === "pro") {
    return (
      <span className="rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-black"
        style={{ background: "linear-gradient(135deg,#FFE27A,#FFB347,#FFD27A)", boxShadow: "0 0 10px rgba(255,210,122,0.55)" }}>
        PRO
      </span>
    );
  }
  return null;
}

// ---------------- PROFILE EDITOR ----------------
function ProfileSheet({
  profile,
  tier,
  isOwner,
  watchedCount,
  totalEpisodes,
  onClose,
  onSaved,
  onSignOut,
}: {
  profile: Profile;
  tier: Tier;
  isOwner: boolean;
  watchedCount: number;
  totalEpisodes: number;
  onClose: () => void;
  onSaved: (p: Profile) => void;
  onSignOut: () => void;
}) {
  const verified = tier === "dev";
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [color, setColor] = useState(profile.avatar_color);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setErr(null);
    setSaving(true);
    const uname = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (uname.length < 3) {
      setErr("Username minimal 3 karakter (huruf/angka/_).");
      setSaving(false);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .update({
        username: uname,
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_color: color,
      })
      .eq("id", profile.id)
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      setErr(error.message.includes("duplicate") ? "Username sudah dipakai." : error.message);
      return;
    }
    onSaved(data as Profile);
    onClose();
  };

  const palette = ["#39FF7A", "#7afcff", "#ffe66d", "#ff8fb1", "#c4a8ff", "#ffb86b", "#8affc1"];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl border border-white/10 bg-[#0d0f0d] p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest">Profil Kamu</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div
            className="grid h-14 w-14 place-items-center rounded-full text-xl font-black text-black"
            style={{ background: color }}
          >
            {(displayName || username || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {palette.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full ring-2 ${c === color ? "ring-white" : "ring-transparent"}`}
                style={{ background: c }}
                aria-label={`Warna ${c}`}
              />
            ))}
          </div>
        </div>

        {isOwner && (
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-1 text-sm font-bold">
              <span>{displayName || username || "Sion_dfkit"}</span>
              <DevPurpleCheck size={16} title="Developer / Owner" />
            </div>
            <div className="flex items-center gap-1 text-xs text-white/50">
              <span>@{username}</span>
              <DevPurpleCheck size={14} title="Developer / Owner" />
            </div>
          </div>
        )}

        {/* Rank / Pangkat (Beta) */}
        {(() => {
          const rank = computeRank(watchedCount, totalEpisodes);
          return (
            <div
              className="mb-4 rounded-xl border p-3"
              style={{ borderColor: `${rank.color}55`, background: `${rank.color}10` }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full text-xs font-black text-black"
                    style={{ background: rank.color, boxShadow: `0 0 12px ${rank.glow}` }}
                  >
                    {rank.level}
                  </span>
                  <div className="leading-tight">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Pangkat Saat Ini</div>
                    <div className="text-sm font-black" style={{ color: rank.color }}>
                      Level {rank.level} — {rank.tierName}
                    </div>
                  </div>
                </div>
                <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ borderColor: `${rank.color}80`, color: rank.color }}>
                  Beta
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{ width: `${rank.progressPct}%`, background: rank.color, boxShadow: `0 0 8px ${rank.glow}` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-white/50">
                <span>{watchedCount}/{totalEpisodes} episode selesai ditonton</span>
                <span>
                  {rank.level >= MAX_LEVEL
                    ? "Rank maksimal versi beta"
                    : `Progress ke rank berikutnya: ${rank.progressPct}%`}
                </span>
              </div>
            </div>
          );
        })()}


        <label className="block text-[10px] uppercase tracking-widest text-white/40">Nama tampilan</label>
        <div className="relative mt-1">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
            className={`w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-3 text-sm outline-none focus:border-[color:var(--n)] ${verified ? "pr-9" : "pr-3"}`}
            style={{ ["--n" as never]: NEON }}
          />
          {verified && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2">
              <VerifiedCheck size={18} />
            </span>
          )}
        </div>

        <label className="mt-3 block text-[10px] uppercase tracking-widest text-white/40">Username</label>
        <div className="mt-1 flex items-center rounded-lg border border-white/10 bg-black/40">
          <span className="px-2 text-sm text-white/40">@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={24}
            className="flex-1 bg-transparent py-2 pr-2 text-sm outline-none"
          />
          {verified && (
            <span className="pr-2">
              <VerifiedCheck size={18} />
            </span>
          )}
        </div>


        <label className="mt-3 block text-[10px] uppercase tracking-widest text-white/40">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
          placeholder="Ceritain sedikit tentang kamu..."
        />
        <div className="mt-1 text-right text-[10px] text-white/30">{bio.length}/160</div>

        {err && <div className="mt-2 text-xs text-red-400">{err}</div>}

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={onSignOut}
            className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/5"
          >
            Keluar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full px-5 py-2 text-xs font-black text-black disabled:opacity-60"
            style={{ background: NEON }}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- MAIN ----------------
// ---------------- COMMUNITY (X ZONE) ----------------
type BotReply = {
  id: string;
  name: string;
  handle: string;
  color: string;
  avatar: string;
  text: string;
  ago: string;
  isUser?: boolean;
  verified?: boolean;
  typing?: boolean;
};
type BotComment = {
  id: string;
  name: string;
  handle: string;
  color: string;
  avatar: string;
  text: string;
  ago: string;
  replies: BotReply[];
};
type CommunityPost = {
  id: string;
  author: string;
  handle: string;
  color: string;
  avatar?: string;
  verified?: boolean;
  caption: string;
  hashtags: string[];
  mentions: string[];
  image: string;
  createdAt: number;
  likes: number;
  reposts: number;
  views: number;
  comments: BotComment[];
  liked?: boolean;
  reposted?: boolean;
  isMine?: boolean;
};

function botAvatar(handle: string, style = "adventurer") {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(handle)}&backgroundType=gradientLinear`;
}

const BOT_POOL: { name: string; handle: string; color: string; avatar: string }[] = [
  { name: "Riko Wibu", handle: "rikowbu", color: "#ff6b9d", avatar: botAvatar("rikowbu", "adventurer") },
  { name: "Sesepuh DC2", handle: "dc2_legend", color: "#39FF7A", avatar: botAvatar("dc2_legend", "lorelei") },
  { name: "Nadia_98", handle: "nadia98x", color: "#f5c518", avatar: botAvatar("nadia98x", "avataaars") },
  { name: "GamerBocil", handle: "boxfruit_main", color: "#00b3ff", avatar: botAvatar("boxfruit_main", "bottts") },
  { name: "Fahmi Anim", handle: "fahmi.anims", color: "#ff8c42", avatar: botAvatar("fahmi.anims", "adventurer") },
  { name: "Yura", handle: "yuraaa_", color: "#c084fc", avatar: botAvatar("yuraaa_", "lorelei") },
  { name: "AnimeLord", handle: "lord.anime", color: "#ef4444", avatar: botAvatar("lord.anime", "personas") },
  { name: "Bocah FYP", handle: "fyp.bocah", color: "#22d3ee", avatar: botAvatar("fyp.bocah", "avataaars") },
  { name: "Kentang", handle: "kentang.crispy", color: "#facc15", avatar: botAvatar("kentang.crispy", "bottts") },
  { name: "Vira", handle: "vira.ntt", color: "#ec4899", avatar: botAvatar("vira.ntt", "lorelei") },
  { name: "Rangga", handle: "rangga.op", color: "#84cc16", avatar: botAvatar("rangga.op", "adventurer") },
  { name: "Miko", handle: "miko_donghua", color: "#3b82f6", avatar: botAvatar("miko_donghua", "personas") },
  { name: "Elsa", handle: "elsa.riil", color: "#fb7185", avatar: botAvatar("elsa.riil", "lorelei") },
  { name: "Bang Jul", handle: "juli.gasken", color: "#a3e635", avatar: botAvatar("juli.gasken", "adventurer") },
  { name: "Dinda", handle: "dindaaa_x", color: "#e879f9", avatar: botAvatar("dindaaa_x", "avataaars") },
  { name: "Reza", handle: "rezaa.op", color: "#fbbf24", avatar: botAvatar("rezaa.op", "personas") },
  { name: "Tio", handle: "tio.gg", color: "#38bdf8", avatar: botAvatar("tio.gg", "bottts") },
  { name: "Sinta", handle: "sinta.wibu", color: "#f472b6", avatar: botAvatar("sinta.wibu", "lorelei") },
  { name: "Rian DC2", handle: "Rian_DC2", color: "#22c55e", avatar: botAvatar("Rian_DC2", "adventurer") },
  { name: "Siti Donghua", handle: "Siti_Donghua", color: "#f43f5e", avatar: botAvatar("Siti_Donghua", "lorelei") },
  { name: "Gamer Sepuh", handle: "GamerSepuh", color: "#eab308", avatar: botAvatar("GamerSepuh", "bottts") },
  { name: "Boy Anims", handle: "boy.anims99", color: "#06b6d4", avatar: botAvatar("boy.anims99", "personas") },
  { name: "Chikita", handle: "chikita.ntt", color: "#d946ef", avatar: botAvatar("chikita.ntt", "avataaars") },
  { name: "MieAyamLovers", handle: "saya_sukamieayam89", color: "#fbbf24", avatar: botAvatar("saya_sukamieayam89", "adventurer") },
];

// ---- Bot Profile (deterministic per handle so it never re-shuffles) ----
type BotProfileInfo = {
  name: string;
  handle: string;
  color: string;
  avatar: string;
  verified?: boolean;
  bio: string;
  joined: string;
  birth: string;
  followers: number;
  following: number;
};

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
const BOT_BIOS = [
  "Hanya anak DC2 biasa 🌱",
  "Gacha adalah jalan ninjaku 🎰",
  "Menunggu eps 6 dengan sabar 🔥",
  "Sesepuh timeline sejak 2019 🗿",
  "Wibu terselubung, jangan bilang siapa-siapa 🤫",
  "Menyala abangkuh, menyala 🔥🔥",
  "Fans garis keras bang Sion 👑",
  "Katanya sih anak FYP, katanya doang 😹",
  "Hobinya war di kolom komen 📢",
  "Blox Fruits sea 3 grinder 🦖",
  "Cita-cita jadi animator kayak bang Sion ✍️",
  "Rewatch Akar Terlarang tiap malem minggu 🌙",
];
const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
function botProfileFor(b: { name: string; handle: string; color: string; avatar: string; verified?: boolean }): BotProfileInfo {
  const seed = hashStr(b.handle);
  const bio = BOT_BIOS[seed % BOT_BIOS.length];
  const jMonth = BULAN[(seed >> 3) % 12];
  const jYear = 2019 + ((seed >> 7) % 6); // 2019-2024
  const bDay = 1 + ((seed >> 11) % 28);
  const bMonth = BULAN[(seed >> 13) % 12];
  const bYear = 1998 + ((seed >> 17) % 12); // 1998-2009
  const followers = 800 + ((seed >> 5) % 48000);
  const following = 120 + ((seed >> 9) % 1800);
  return {
    name: b.name,
    handle: b.handle,
    color: b.color,
    avatar: b.avatar,
    verified: b.verified,
    bio,
    joined: `Bergabung ${jMonth} ${jYear}`,
    birth: `Lahir ${bDay} ${bMonth} ${bYear}`,
    followers,
    following,
  };
}

// Keyword-based bot reply pools
const REPLY_POOLS: { keys: RegExp; lines: string[] }[] = [
  // Pujian / scene keren
  {
    keys: /(bagus|keren|smooth|animasi|animation|epic|mantap|gokil|sick|kece|aesthetic|klimaks|scene|masterpiece|goat|top ?tier|kelas)/i,
    lines: [
      "Bisa aja lu bang, tapi emang sih scene itu klimaks banget! 😭",
      "Emang boleh se-smooth itu animasinya? Kelazzz abangkuh! 🔥",
      "Riil cuy, gua tonton berulang-ulang tetep merinding 😭",
      "Frame by frame-nya juara sih, respect buat animatornya 👑",
      "Fix ini kualitas donghua lokal udh naik kelas 🗿",
      "Njir lu tau aja bagian ter-epic-nya, satu selera kita bang 🤝",
    ],
  },
  // Tanya update / kapan / eps 6
  {
    keys: /(update|kapan|rilis|release|next|lanjut|eps? ?6|episode ?6|kelanjutan|nunggu|tunggu)/i,
    lines: [
      "Tunggu tanggal mainnya cuy, pantengin terus notif biar gak ketinggalan eps 6.",
      "Sabar bang, kabarnya sih eps 6 lagi finishing, siap-siap notif ON! 🔔",
      "Katanya bang Sion lagi polish frame-nya biar makin epic 🎬 tenang aja pasti rilis kok.",
      "Info paling update sih pantengin story bang Sion aja, biasanya bocor duluan di situ 👀",
    ],
  },
  // Bercanda / ngajak main
  {
    keys: /(wkwk|haha|hehe|lol|lmao|ngakak|becanda|bercanda|guyon|mabar|main|game|blox|fruit|ff|free ?fire|ml|mobile ?legend|valo|pubg|nge-?trol|troll)/i,
    lines: [
      "Wkwk bisa aja lu, btw mabar gas? 🎮",
      "Bjirrr ngakak gua, gas mabar Blox Fruits bang, drop nick lu sini 🦖",
      "Wkwkwk lu emang paling receh se-timeline, sini mabar nunggu eps 6 😹",
      "Room mabar gua kosong nih, gaskeun sambil war di komen 😤",
    ],
  },
  // Pertanyaan generic (siapa/kok/kenapa/gimana/dimana)
  {
    keys: /\?|siapa|kok |kenapa|gimana|dimana|apakah/i,
    lines: [
      "Wah kalau itu cuma bang Sion yang tahu plot twist-nya, kita tungguin aja eps 6 rilis ☝️😭",
      "Bentar bentar itu masih rahasia sih, spoiler alert 🤫",
      "Gua juga penasaran anjay, mari kita war di komen sampe dijawab 📢",
    ],
  },
  // Salam
  {
    keys: /^\s*(halo|hai|p|assalam|hello|hi|bro|bang|cuy)\s*!?\s*$/i,
    lines: [
      "Halooo juga cuy, salken dari fandom Akar Terlarang 👋",
      "Wih ada orang baru, welcome to Zone Community 🔥",
      "Yo bang, gas ngobrol di sini rame-rame 🤙",
    ],
  },
  // Setuju
  {
    keys: /(setuju|bener|betul|riil|real|fakta|fix|sepakat|agree)/i,
    lines: [
      "FIX! Sepemikiran kita bang, riil no fek 🤝",
      "Bener banget, gua satu suara sama lu cok 🗿",
      "Setuju banget, ini opini paling waras di kolom komen 👑",
    ],
  },
  // Negatif
  {
    keys: /(jelek|hate|garbage|sampah|bosen|buruk|ngga suka|gak suka)/i,
    lines: [
      "Yah sabar bang, kalau gak suka ya scroll aja jangan war 😹",
      "Selera orang beda-beda sih, tapi menurut gua sih worth ditonton 🙏",
    ],
  },
];

// Seed feed with standalone bot posts so timeline never feels empty
function makeSeedPosts(): CommunityPost[] {
  const now = Date.now();
  const mkComments = (arr: { h: string; t: string }[]): BotComment[] =>
    arr.map((c, i) => {
      const bot = BOT_POOL.find((b) => b.handle === c.h) ?? BOT_POOL[i % BOT_POOL.length];
      return {
        id: `sc_${c.h}_${i}_${now}`,
        name: bot.name,
        handle: bot.handle,
        color: bot.color,
        avatar: bot.avatar,
        text: c.t,
        ago: `${i + 1}m`,
        replies: [],
      };
    });
  return [
    {
      id: `seed_1_${now}`,
      author: "Fahmi Anim",
      handle: "fahmi.anims",
      color: "#ff8c42",
      avatar: botAvatar("fahmi.anims", "adventurer"),
      caption:
        "Gak sabar banget nungguin Episode 6 Akar Terlarang rilis riil! Teaser-nya bang Sion udah kerasa kuadrat epic-nya 🔥",
      hashtags: ["HeavenDefyingDragonforce", "ZoneCommunity"],
      mentions: ["Sion_dfkit"],
      image: "",
      createdAt: now - 2 * 60 * 60 * 1000,
      likes: 1284,
      reposts: 217,
      views: 15420,
      comments: mkComments([
        { h: "rikowbu", t: "Fix bang, teaser doang udah bikin merinding 😭🔥" },
        { h: "dc2_legend", t: "Sepuh emang gak pernah bohong, siap-siap notif ON 🔔" },
      ]),
    },
    {
      id: `seed_2_${now}`,
      author: "GamerBocil",
      handle: "boxfruit_main",
      color: "#00b3ff",
      avatar: botAvatar("boxfruit_main", "bottts"),
      caption:
        "Sambil nunggu eps 6 premier, info mabar Blox Fruits sea 2 atau sea 3 dong cuy, sepi banget nih wkwk 🦖",
      hashtags: ["BloxFruits", "Mabar"],
      mentions: [],
      image: "",
      createdAt: now - 5 * 60 * 60 * 1000,
      likes: 462,
      reposts: 58,
      views: 6120,
      comments: mkComments([
        { h: "tio.gg", t: "Room gua kosong bang, drop nick sini gasss 🎮" },
        { h: "rangga.op", t: "Sea 3 lah bang, farming buah mythical 🗿" },
      ]),
    },
    {
      id: `seed_3_${now}`,
      author: "Sesepuh DC2",
      handle: "dc2_legend",
      color: "#39FF7A",
      avatar: botAvatar("dc2_legend", "lorelei"),
      caption:
        "Definisi animator lokal paling sepuh di DC2 ya cuman di ZONE. Gak ada obat smooth-nya, kelas abangkuh! 👑",
      hashtags: ["ZONE", "DC2"],
      mentions: ["Sion_dfkit"],
      image: "",
      createdAt: now - 26 * 60 * 60 * 1000,
      likes: 3821,
      reposts: 640,
      views: 42130,
      comments: mkComments([
        { h: "lord.anime", t: "Riil sepuh, frame-nya butter smooth cuy 🧈" },
        { h: "yuraaa_", t: "Kelas abangkuh emang beda 👑✨" },
        { h: "miko_donghua", t: "Lokal tapi rasa donghua top tier 🔥" },
      ]),
    },
    {
      id: `seed_4_${now}`,
      author: "Nadia_98",
      handle: "nadia98x",
      color: "#f5c518",
      avatar: botAvatar("nadia98x", "avataaars"),
      caption:
        "Rewatch eps 5 lagi ternyata banyak detail kecil yang ke-skip, bang Sion emang detail freak parah 😭✨",
      hashtags: ["Rewatch", "AkarTerlarang"],
      mentions: [],
      image: "",
      createdAt: now - 9 * 60 * 60 * 1000,
      likes: 927,
      reposts: 132,
      views: 10480,
      comments: mkComments([
        { h: "dindaaa_x", t: "Setuju bang, ada easter egg di background juga 👀" },
        { h: "elsa.riil", t: "Gua rewatch 3x masih nemu detail baru anjir 🤯" },
      ]),
    },
    {
      id: `seed_mabar_${now}`,
      author: "MieAyamLovers",
      handle: "saya_sukamieayam89",
      color: "#fbbf24",
      avatar: botAvatar("saya_sukamieayam89", "adventurer"),
      caption: "Info mabar Roblox dong cuy, bosen nih sendiri mulu wkwk 🦖",
      hashtags: ["RobloxIndonesia", "Mabar"],
      mentions: [],
      image: "",
      createdAt: now - 45 * 60 * 1000,
      likes: 2148,
      reposts: 384,
      views: 21870,
      comments: mkComments([
        { h: "tio.gg", t: "Gasss bang, gua lagi grinding Blox Fruits juga wkwk 🦖" },
        { h: "boxfruit_main", t: "Room gua kosong, drop nick lu sini cuy 🎮" },
        { h: "rangga.op", t: "Mabar Doors atau BedWars nih? Gua ikut 🗿" },
        { h: "fyp.bocah", t: "Bjirr sepi juga ya, gas bareng aja 😹" },
      ]),
    },
  ];
}



const DEFAULT_REPLIES = [
  "Wkwkwk bener juga sih bang 🗿",
  "Setuju cuy, mari kita ramein terus komunitasnya 🔥",
  "Anjay komennya relate parah 😹",
  "Gasss keep it up, satu suara sama abangku 🤝",
  "Menyala komunitas Zone-nya menyala 🔥🔥",
  "Njir lu ngomong gitu bikin gua ngakak parah wkwk",
];

const SHORT_REPLIES = [
  "Gas lah! 🔥",
  "Setuju banget.",
  "Ngegasss 🤝",
  "Fix cuy 🗿",
  "Sat set bang!",
  "Mantul 🔥",
];

function isShortOrEmoji(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length <= 4) return true;
  // Mostly emoji / non-word chars
  const wordChars = trimmed.replace(/[\s\p{Emoji_Presentation}\p{Extended_Pictographic}\p{P}\p{S}]/gu, "");
  return wordChars.length <= 3;
}

function pickBotReplyText(userText: string): string {
  if (isShortOrEmoji(userText)) {
    return SHORT_REPLIES[Math.floor(Math.random() * SHORT_REPLIES.length)];
  }
  for (const pool of REPLY_POOLS) {
    if (pool.keys.test(userText)) return pool.lines[Math.floor(Math.random() * pool.lines.length)];
  }
  return DEFAULT_REPLIES[Math.floor(Math.random() * DEFAULT_REPLIES.length)];
}

// ---- Debate / on-topic contextual brain ----
const DEBATE_RE = /(gak setuju|ga setuju|nggak setuju|salah|ngaco|ngasal|cupu|jelek|gaje|gak masuk akal|nggak masuk akal|debat|protes|menurut gua beda|beda pendapat|halu|kok bisa|kok gitu|masa sih|masa iya|kagak|nggak lah|gak lah|bantah)/i;
const AGREE_RE = /(iya sih|bener sih|setuju|fix|sepakat|riil|real|fakta|masuk akal|w setuju)/i;

const DEBATE_ANIMASI = [
  "Lah kok gitu? Coba lu liat framerate-nya di detik ke-30, itu smooth parah riil no fek. Lu bisa bikin yang lebih oke kah? Wkwk canda bang 😹",
  "Bang santai, animator lokal udh usaha maksimal. Coba tunjuk part mana yang lu bilang cupu, gua counter satu-satu 🗿",
  "Ngaco bang, in-between framenya rapi banget. Lu bandingin sama karya sebelah aja dulu deh, baru komen 🤝",
  "Kalau lu bilang jelek berarti kita beda mata sih. Coba pause di scene tebasan, itu weight-nya kerasa banget cuy.",
  "Wkwk debat kusir nih, tapi gapapa. Lu ngomong smooth-nya kurang, tapi gua liat sih udah level pro riil.",
];
const DEBATE_PLOT = [
  "Gak bisa gitu cuy, justru kerudung hitam di belakang itu yang bikin plot twist-nya makin gila. Taruhan yuk pas eps 6 rilis! 🤝",
  "Lu belum liat foreshadowing di eps 3 kayaknya bang, akar naga itu simbol dendam. Balik dulu rewatch, baru debat 😤",
  "Bantah nih, alurnya justru rapih banget. Setiap scene ada payoff-nya di eps depan. Sabar tunggu eps 6 aja.",
  "Ngaco bang, karakter utamanya justru berkembang tiap eps. Coba lu perhatiin dialognya, bukan cuma fight scene.",
  "Kalau menurut lu alurnya lambat, berarti lu ketinggalan detail penting. Rewatch dulu eps 4, baru kita lanjut argumen wkwk.",
];
const DEBATE_GENERIC = [
  "Lah masa sih? Gua ada argumen lain nih, tapi lu duluan deh jelasin kenapa lu mikir gitu 🤔",
  "Boleh beda pendapat, tapi coba kasih alasan yang bikin gua yakin. Jangan cuma bilang nggak setuju doang cuy.",
  "Sat set banget lu ngebantah wkwk, tapi ok gua tampung. Coba elaborasi biar diskusinya sehat 🗿",
  "Wkwk gaya lu debat kayak sultan komen, tapi gua tunggu bukti konkret dulu ya bang.",
  "Ok fine, kita agree to disagree. Tapi menurut gua sih lu bakal berubah pikiran pas eps 6 rilis 😹",
];
const CONTINUE_ANIMASI = [
  "Nah itu maksud gua, animasinya emang niat parah. Frame ilangnya juga minim banget 🔥",
  "Riil bang, coba lu liat efek partikel pas jurus, itu detail dewa sih menurut gua.",
  "Emang seharusnya karya lokal gini yang di-hype, bukan yang jelek malah rame 🙏",
  "Fix satu suara, animator lokal Zone ini deserve lebih banyak spotlight sih.",
];
const CONTINUE_PLOT = [
  "Iya cuy, dan menurut gua kerudung hitam itu bakal reveal di eps 6 atau 7 max. Mark my words 🗿",
  "Bener, tiap eps selalu ada clue kecil. Bang Sion emang jago naro foreshadowing wkwk.",
  "Nah ini yang gua suka, penonton nyambung. Coba tebak siapa antagonis utamanya menurut lu 🤔",
  "Sepakat, plot-nya makin dalem tiap eps. Semoga eps 6 gak nge-rush endingnya 🙏",
];
const CONTINUE_GENERIC = [
  "Nyambung banget lu bang, lanjut ngobrol lah 🤝",
  "Wkwk kita satu frekuensi ternyata, gas lanjut war di komen 😹",
  "Iya sih, mikir gua sama persis. Lanjut, mau bahas apa lagi cuy?",
  "Fix lu paham banget vibes komunitas Zone, respect 🔥",
];

type ThreadTurn = { text: string; isUser: boolean };
function detectTopic(text: string): "animasi" | "plot" | "game" | "eps6" | "generic" {
  if (/(animasi|animation|frame|smooth|render|efek|animator|epic|scene)/i.test(text)) return "animasi";
  if (/(plot|alur|cerita|karakter|twist|reveal|ending|kerudung|akar|naga|antagonis)/i.test(text)) return "plot";
  if (/(mabar|game|blox|fruit|main bareng|ml|ff|valo)/i.test(text)) return "game";
  if (/(eps ?6|episode ?6|rilis|update|kapan|nunggu|tunggu|kelanjutan)/i.test(text)) return "eps6";
  return "generic";
}
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function pickBotReplyContextual(
  originalComment: string,
  thread: ThreadTurn[],
  userText: string,
): string {
  if (isShortOrEmoji(userText)) return pick(SHORT_REPLIES);
  // Topic from the original comment (thread anchor), fallback to user text
  const topic = detectTopic(originalComment) === "generic" ? detectTopic(userText) : detectTopic(originalComment);
  const userTurns = thread.filter((t) => t.isUser).length;
  const isDebate = DEBATE_RE.test(userText);
  const isAgree = AGREE_RE.test(userText);

  if (isDebate) {
    if (topic === "animasi") return pick(DEBATE_ANIMASI);
    if (topic === "plot") return pick(DEBATE_PLOT);
    return pick(DEBATE_GENERIC);
  }

  // After 2+ user turns, prefer contextual continuation
  if (userTurns >= 2 && !isAgree) {
    if (topic === "animasi") return pick(CONTINUE_ANIMASI);
    if (topic === "plot") return pick(CONTINUE_PLOT);
    if (topic === "generic") return pick(CONTINUE_GENERIC);
  }

  // Otherwise fall back to keyword pools (existing behavior)
  for (const pool of REPLY_POOLS) {
    if (pool.keys.test(userText)) return pick(pool.lines);
  }
  // Topic-based fallback so it stays on topic even without keyword hit
  if (topic === "animasi") return pick(CONTINUE_ANIMASI);
  if (topic === "plot") return pick(CONTINUE_PLOT);
  if (topic === "game") return pick(REPLY_POOLS[2].lines);
  if (topic === "eps6") return pick(REPLY_POOLS[1].lines);
  return pick(DEFAULT_REPLIES);
}


const COMMENT_POOL: string[] = [
  "Menyala abangkuh! 🔥 Gak sabar nunggu eps 6 rilis!",
  "Gokil parah, lewat FYP gua langsung tak tekan loh, stickman ijonya op banget 😭",
  "Riil no fek, ini baru masterpiece animator lokal. Kelas bang Sion!",
  "Info mabar Blox Fruits sekalian nungguin Akar Terlarang rilis wkwk",
  "Definisi sesepuh DC2 mah bebas, animasinya smooth parah serasa nonton anime jepang 👑",
  "Plot twist-nya di eps 6 pasti gila sih ini, gasss min jangan lama-lama rilisnya!",
  "Gua save dulu, dapet rekomendasi tontonan keren dari IG Reels nih",
  "GGWP! Kerudung hitam di belakang itu siapa lagi dah bikin penasaran aja",
  "Anjay posternya aesthetic bgt cok, wallpaper hp gua nih 🔥🔥",
  "Bang Sion emang gak ada obat, karya lokal rasa internasional 🗿",
  "Bentar bentar itu akar naganya bakalan ngelilit siapa cuy 😭😭",
  "Sumpah ini tuh masuk banget di FYP tiktok gw, langsung follow!",
  "Gaskeun bang, komunitas siap war di kolom komen kalo eps 6 telat 🗿🗿",
  "W nonton dari eps 1 sampe sekarang gak pernah skip iklan, respect!",
  "Ini animasi bikinnya berapa bulan sih bang, detail parah asli",
  "Bapak² gabut mampir, anak gw suka banget serial ini 👍",
  "Gua yg dari luar fandom auto ngerti sih, story tellingnya rapih",
  "Sepi banget yg komen? oh ternyata belom rilis wkwkw",
  "DC2 fam mana suaranyaaaa 📢📢",
  "Gg bang, ini tuh worth banget buat di rewatch berkali kali",
  "Kok gua ngerasa Lei Zhen makin ganteng ya makin banyak eps 😳",
  "Auto notif on buat eps 6 nya gass!",
  "Ngab bagi link donasi buat animatornya dong biar makin semangat 🙏",
  "Kok bisa sih detail sekecil ini kena semua, mantul lah",
  "Yg dislike pasti fans sinetron 😹",
  "Real talk ini kualitas donghua lokal udh bisa saingin bilibili",
  "Ampun bang gua nunggu eps 6 sampe rambut gua tumbuh panjang 💀",
  "Aku suka bagian pas naga akarnya muncul, sereeeem tapi keren 😭",
  "Njir baru ngeh ini karya anak bangsa, bangga cok!",
  "Gua share ke grup wa, sekelas gua auto nonton 🔥",
  "Nunggu eps 6 sambil grinding di free fire wkwk",
  "Kualitas 4K, ceritanya 8K, mantap bang keep it up!",
];

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomId() { return Math.random().toString(36).slice(2, 10); }

function timeAgoShort(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}d`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j`;
  return `${Math.floor(h / 24)}h`;
}

function CreatePostModal({
  onClose, onPost, author, handle, color, verified,
}: {
  onClose: () => void;
  onPost: (p: { caption: string; hashtags: string[]; mentions: string[]; image: string }) => void;
  author: string; handle: string; color: string; verified?: boolean;
}) {
  const [caption, setCaption] = useState("Sneak peek Episode 6 — AKAR TERLARANG 🔥 siap-siap ya cuy!");
  const [hashtags, setHashtags] = useState("HeavenDefyingDragonforce AkarTerlarang DonghuaLokal");
  const [mentions, setMentions] = useState("Sion_dfkit ZoneApp");
  const [image, setImage] = useState<string | null>(poster.url);
  const [imageName, setImageName] = useState<string>("hdd-poster.jpg");
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = () => fileRef.current?.click();
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(String(reader.result));
      setImageName(f.name);
    };
    reader.readAsDataURL(f);
  };
  const clearImage = () => { setImage(null); setImageName(""); };

  const submit = () => {
    if (!caption.trim()) return;
    onPost({
      caption: caption.trim(),
      hashtags: hashtags.split(/[\s,]+/).map((s) => s.replace(/^#/, "").trim()).filter(Boolean),
      mentions: mentions.split(/[\s,]+/).map((s) => s.replace(/^@/, "").trim()).filter(Boolean),
      image: image ?? "",
    });
  };


  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0d0f0d] p-4 sm:rounded-2xl animate-fade-in">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={onClose} className="text-xs text-white/60 hover:text-white">Batal</button>
          <h3 className="text-sm font-black uppercase tracking-widest">Postingan Baru</h3>
          <button onClick={submit} className="rounded-full px-3 py-1 text-xs font-black text-black" style={{ background: NEON }}>
            Posting
          </button>
        </div>

        <div className="flex items-start gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black text-black" style={{ background: color }}>
            {(author || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold">{author}</span>
              {verified && <VerifiedCheck size={12} />}
              <span className="text-white/40">@{handle}</span>
            </div>

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Apa yang lagi terjadi?"
              rows={3}
              className="mt-2 w-full resize-none bg-transparent text-sm placeholder:text-white/30 focus:outline-none"
              maxLength={280}
            />

            <div className="mt-2 space-y-2 text-xs">
              <label className="block">
                <span className="text-white/50">Hashtag</span>
                <input value={hashtags} onChange={(e) => setHashtags(e.target.value)}
                  placeholder="AkarTerlarang HDD"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 focus:border-[color:var(--n)] focus:outline-none"
                  style={{ ["--n" as never]: NEON }} />
              </label>
              <label className="block">
                <span className="text-white/50">Mention</span>
                <input value={mentions} onChange={(e) => setMentions(e.target.value)}
                  placeholder="Sion_dfkit"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 focus:border-[color:var(--n)] focus:outline-none"
                  style={{ ["--n" as never]: NEON }} />
              </label>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            {image ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                <div className="relative">
                  <img src={image} alt="Lampiran postingan" className="w-full object-cover" loading="lazy" />
                  <button
                    type="button"
                    onClick={clearImage}
                    aria-label="Hapus foto"
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-sm font-bold text-white hover:bg-black"
                  >
                    ✕

                  </button>
                  <button
                    type="button"
                    onClick={pickFile}
                    className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-black"
                  >
                    Ganti Foto
                  </button>
                </div>
                <button
                  type="button"
                  onClick={pickFile}
                  className="flex w-full items-center justify-between bg-black/60 px-3 py-2 text-[10px] text-white/60 hover:bg-black/80"
                >
                  <span className="truncate">📎 {imageName || "gambar.jpg"}</span>
                  <span style={{ color: NEON }}>Terpilih • klik untuk ganti</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={pickFile}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/30 px-3 py-6 text-xs text-white/60 hover:border-white/40 hover:text-white"
              >
                <span>🖼️</span>
                <span>Tambah / Pilih Foto dari Galeri</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

type VideoBotComment = {
  id: string;
  name: string;
  handle: string;
  color: string;
  avatar: string;
  text: string;
  ago: string;
  isUser?: boolean;
};

const TAICHU_BGM = "https://cdn.pixabay.com/download/audio/2022/03/15/audio_2c02b4e8f0.mp3?filename=cinematic-epic-trailer-116691.mp3";

const TAICHU_SEED_COMMENTS: { h: string; t: string }[] = [
  { h: "dc2_legend", t: "Bjirr cinematic-nya dapet banget! Sepuh emang gak pernah bohong 🔥" },
  { h: "lord.anime", t: "Gokil sepuh editannya! Frame by frame juara 👑" },
  { h: "yuraaa_", t: "Detik-detik Tai Chu keluar tuh part paling merinding riil 😭" },
  { h: "miko_donghua", t: "Editnya level pro cok, backsound-nya nendang parah ☄️" },
  { h: "rikowbu", t: "Rewatch 3x tetep merinding, kelas abangkuh! 🗿" },
];

function BotVideoPost({
  bot,
  onOpenBotProfile,
  meName,
  meHandle,
  meColor,
  meAvatar,
  meVerified,
}: {
  bot: { name: string; handle: string; color: string; avatar: string; verified?: boolean };
  onOpenBotProfile: (b: { name: string; handle: string; color: string; avatar: string; verified?: boolean }) => void;
  meName: string;
  meHandle: string;
  meColor: string;
  meAvatar?: string;
  meVerified?: boolean;
}) {
  const vRef = useRef<HTMLVideoElement>(null);
  const bgmRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [bgmOn, setBgmOn] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(4821);
  const [shares, setShares] = useState(612);
  const [comments, setComments] = useState<VideoBotComment[]>(() => {
    const base = Date.now();
    return TAICHU_SEED_COMMENTS.map((c, i) => {
      const b = BOT_POOL.find((x) => x.handle === c.h) ?? BOT_POOL[i % BOT_POOL.length];
      return {
        id: `tc_${b.handle}_${i}_${base}`,
        name: b.name,
        handle: b.handle,
        color: b.color,
        avatar: b.avatar,
        text: c.t,
        ago: `${i + 2}m`,
      };
    });
  });
  const [text, setText] = useState("");

  // Dynamic counter drift while playing
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setLikes((n) => n + Math.floor(Math.random() * 3));
      setShares((n) => n + (Math.random() < 0.3 ? 1 : 0));
    }, 2500);
    return () => window.clearInterval(id);
  }, [playing]);

  const toggle = () => {
    const v = vRef.current;
    if (!v) return;
    if (v.paused) {
      v.muted = muted;
      v.play().then(() => setPlaying(true)).catch(() => {
        // fallback: autoplay policy — start muted
        v.muted = true;
        setMuted(true);
        v.play().then(() => setPlaying(true)).catch(() => { /* ignore */ });
      });
      if (bgmOn && bgmRef.current) bgmRef.current.play().catch(() => { /* ignore */ });
    } else {
      v.pause();
      setPlaying(false);
      if (bgmRef.current) bgmRef.current.pause();
    }
  };

  const toggleMute = () => {
    const v = vRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleBgm = () => {
    const a = bgmRef.current;
    if (!a) return;
    if (a.paused) {
      a.volume = 0.35;
      a.play().then(() => setBgmOn(true)).catch(() => { /* ignore */ });
    } else {
      a.pause();
      setBgmOn(false);
    }
  };

  const like = () => {
    setLiked((v) => !v);
    setLikes((n) => n + (liked ? -1 : 1));
  };

  const share = () => setShares((n) => n + 1);

  const sendComment = () => {
    const t = text.trim();
    if (!t) return;
    const c: VideoBotComment = {
      id: `tc_me_${Date.now()}`,
      name: meName,
      handle: meHandle,
      color: meColor,
      avatar: meAvatar ?? botAvatar(meHandle),
      text: t,
      ago: "now",
      isUser: true,
    };
    setComments((cs) => [c, ...cs]);
    setText("");
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-start gap-2">
        <img src={bot.avatar} alt={bot.name} className="h-9 w-9 rounded-full object-cover" style={{ background: bot.color }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-xs">
            <span className="font-bold text-white/95">{bot.name}</span>
            {bot.verified && <VerifiedCheck size={12} />}
            <span className="text-white/40">@{bot.handle} · 3j</span>
          </div>
          <p className="mt-1 text-sm text-white/90">
            Detik-detik Tai Chu keluar dari Lei Zhen, gila sih ini editannya merinding parah! 🔥☄️{" "}
            <span className="text-sky-400">#HeavenDefyingDragonforce </span>
            <span className="text-sky-400">#TaiChu </span>
            <span className="text-sky-400">#LeiZhen</span>
          </p>

          <div className="relative mt-2 overflow-hidden rounded-xl border border-white/10 bg-black">
            <video
              ref={vRef}
              src={taichuVideo.url}
              className="block w-full"
              playsInline
              preload="metadata"
              onClick={toggle}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
            <audio ref={bgmRef} src={TAICHU_BGM} loop preload="none" />
            {!playing && (
              <button
                type="button"
                onClick={toggle}
                aria-label="Putar video"
                className="absolute inset-0 grid place-items-center bg-black/30"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full text-2xl font-black text-black" style={{ background: NEON, boxShadow: `0 0 24px ${NEON}80` }}>
                  ▶
                </span>
              </button>
            )}
            <div className="absolute bottom-2 right-2 flex gap-1">
              <button
                type="button"
                onClick={toggleMute}
                className="rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white/90"
                aria-label={muted ? "Bunyikan" : "Bisukan"}
              >
                {muted ? "🔇" : "🔊"}
              </button>
              <button
                type="button"
                onClick={toggleBgm}
                className="rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white/90"
                aria-label="Toggle backsound"
              >
                {bgmOn ? "🎵 BGM ON" : "🎵 BGM"}
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-4 text-[11px] text-white/60">
            <button onClick={like} className={`flex items-center gap-1 hover:text-pink-400 ${liked ? "text-pink-400" : ""}`}>
              <span>{liked ? "❤️" : "🤍"}</span>
              <span className="tabular-nums">{likes.toLocaleString("id-ID")}</span>
            </button>
            <span className="flex items-center gap-1">
              <span>💬</span>
              <span className="tabular-nums">{comments.length.toLocaleString("id-ID")}</span>
            </span>
            <button onClick={share} className="flex items-center gap-1 hover:text-sky-400">
              <span>🔗</span>
              <span className="tabular-nums">{shares.toLocaleString("id-ID")}</span>
            </button>
          </div>

          {/* comment composer */}
          <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
            {meAvatar ? (
              <img src={meAvatar} alt={meName} className="h-7 w-7 rounded-full object-cover" style={{ background: meColor }} />
            ) : (
              <div className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-black text-black" style={{ background: meColor }}>
                {meName.charAt(0).toUpperCase()}
              </div>
            )}
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendComment(); }}
              placeholder="Tulis komentar untuk @saya_sukamieayam89..."
              className="flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs placeholder:text-white/30 focus:border-[color:var(--n)] focus:outline-none"
              style={{ ["--n" as never]: NEON }}
              maxLength={240}
            />
            <button
              type="button"
              onClick={sendComment}
              className="rounded-md px-2 py-1.5 text-[10px] font-black text-black"
              style={{ background: NEON }}
            >
              Kirim
            </button>
          </div>

          <ul className="mt-3 space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="flex items-start gap-2 animate-fade-in">
                {c.isUser ? (
                  <img src={c.avatar} alt={c.name} className="h-7 w-7 shrink-0 rounded-full object-cover" style={{ background: c.color }} />
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenBotProfile({ name: c.name, handle: c.handle, color: c.color, avatar: c.avatar })}
                    className="shrink-0 rounded-full transition hover:opacity-80"
                    aria-label={`Buka profil ${c.name}`}
                  >
                    <img src={c.avatar} alt={c.name} className="h-7 w-7 rounded-full object-cover" style={{ background: c.color }} />
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1 text-[11px]">
                    {c.isUser ? (
                      <span className="font-bold text-white/90">{c.name}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenBotProfile({ name: c.name, handle: c.handle, color: c.color, avatar: c.avatar })}
                        className="font-bold text-white/90 hover:underline"
                      >
                        {c.name}
                      </button>
                    )}
                    {c.isUser && meVerified && <VerifiedCheck size={10} />}
                    <span className="text-white/40">@{c.handle} · {c.ago}</span>
                    {c.isUser && <span className="rounded-sm bg-white/10 px-1 text-[8px] uppercase tracking-widest text-white/60">kamu</span>}
                  </div>
                  <p className="break-words text-xs text-white/80">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function BotProfileModal({
  bot, onClose, onOpenBotProfile, meName, meHandle, meColor, meAvatar, meVerified,
}: {
  bot: { name: string; handle: string; color: string; avatar: string; verified?: boolean };
  onClose: () => void;
  onOpenBotProfile: (b: { name: string; handle: string; color: string; avatar: string; verified?: boolean }) => void;
  meName: string;
  meHandle: string;
  meColor: string;
  meAvatar?: string;
  meVerified?: boolean;
}) {
  const info = botProfileFor(bot);
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : n.toString();
  const hasVideoTab = bot.handle === "saya_sukamieayam89";
  const [tab, setTab] = useState<"profil" | "video">("profil");
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="my-6 w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#0a0d0b] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-20" style={{ background: `linear-gradient(120deg, ${info.color}80, #000)` }}>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-xs text-white/80 hover:bg-black/80"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>
        <div className="-mt-8 px-4 pb-4">
          <img
            src={info.avatar}
            alt={info.name}
            className="h-16 w-16 rounded-full border-4 border-[#0a0d0b] object-cover"
            style={{ background: info.color }}
          />
          <div className="mt-2 flex items-center gap-1">
            <h3 className="text-base font-black text-white">{info.name}</h3>
            {info.verified && <VerifiedCheck size={14} />}
          </div>
          <p className="text-xs text-white/50">@{info.handle}</p>
          <p className="mt-3 text-sm text-white/85">{info.bio}</p>
          <div className="mt-3 space-y-1 text-[11px] text-white/50">
            <p>📅 {info.joined}</p>
            <p>🎂 {info.birth}</p>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span><span className="font-black text-white">{fmt(info.following)}</span> <span className="text-white/50">Following</span></span>
            <span><span className="font-black text-white">{fmt(info.followers)}</span> <span className="text-white/50">Followers</span></span>
          </div>

          {hasVideoTab && (
            <div className="mt-4 flex gap-1 rounded-lg border border-white/10 bg-black/40 p-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setTab("profil")}
                className={`flex-1 rounded-md py-1.5 transition ${tab === "profil" ? "text-black" : "text-white/60"}`}
                style={tab === "profil" ? { background: NEON } : undefined}
              >
                Profil
              </button>
              <button
                type="button"
                onClick={() => setTab("video")}
                className={`flex-1 rounded-md py-1.5 transition ${tab === "video" ? "text-black" : "text-white/60"}`}
                style={tab === "video" ? { background: NEON } : undefined}
              >
                Postingan Video
              </button>
            </div>
          )}

          {hasVideoTab && tab === "video" ? (
            <div className="mt-4">
              <BotVideoPost
                bot={bot}
                onOpenBotProfile={onOpenBotProfile}
                meName={meName}
                meHandle={meHandle}
                meColor={meColor}
                meAvatar={meAvatar}
                meVerified={meVerified}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-full py-2 text-xs font-black text-black"
              style={{ background: NEON }}
            >
              Tutup Profil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


function CommentItem({
  postId, comment, onReply, onDeleteReply, onOpenBotProfile, meName, meHandle, meColor, meAvatar, meVerified,
}: {
  postId: string;
  comment: BotComment;
  onReply: (postId: string, commentId: string, text: string) => void;
  onDeleteReply: (postId: string, commentId: string, replyId: string) => void;
  onOpenBotProfile: (bot: { name: string; handle: string; color: string; avatar: string; verified?: boolean }) => void;
  meName: string;
  meHandle: string;
  meColor: string;
  meAvatar?: string;
  meVerified?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const send = () => {
    const t = text.trim();
    if (!t) return;
    onReply(postId, comment.id, t);
    setText("");
    setOpen(false);
  };
  return (
    <li className="flex items-start gap-2 animate-fade-in">
      <button
        type="button"
        onClick={() => onOpenBotProfile({ name: comment.name, handle: comment.handle, color: comment.color, avatar: comment.avatar })}
        className="shrink-0 rounded-full transition hover:opacity-80"
        aria-label={`Buka profil ${comment.name}`}
      >
        <img
          src={comment.avatar}
          alt={comment.name}
          loading="lazy"
          className="h-8 w-8 rounded-full border border-white/10 bg-white/5 object-cover"
          style={{ background: comment.color }}
        />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => onOpenBotProfile({ name: comment.name, handle: comment.handle, color: comment.color, avatar: comment.avatar })}
            className="font-bold text-white/90 hover:underline"
          >
            {comment.name}
          </button>
          <span className="text-white/40">@{comment.handle} · {comment.ago}</span>
        </div>

        <p className="break-words text-xs text-white/80">{comment.text}</p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-1 text-[10px] uppercase tracking-widest text-white/40 hover:text-[color:var(--n)]"
          style={{ ["--n" as never]: NEON }}
        >
          💬 Balas
        </button>

        {open && (
          <div className="mt-1 flex items-center gap-2">
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder={`Balas @${comment.handle}...`}
              className="flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs placeholder:text-white/30 focus:border-[color:var(--n)] focus:outline-none"
              style={{ ["--n" as never]: NEON }}
              maxLength={220}
            />
            <button
              type="button"
              onClick={send}
              className="rounded-md px-2 py-1 text-[10px] font-black text-black"
              style={{ background: NEON }}
            >
              Kirim
            </button>
          </div>
        )}

        {comment.replies.length > 0 && (
          <ul className="mt-2 space-y-2 border-l border-white/10 pl-3">
            {comment.replies.map((r) => (
              <li key={r.id} className="flex items-start gap-2 animate-fade-in">
                {r.isUser || r.typing ? (
                  r.avatar ? (
                    <img
                      src={r.avatar}
                      alt={r.name}
                      loading="lazy"
                      className="h-6 w-6 shrink-0 rounded-full border border-white/10 object-cover"
                      style={{ background: r.color }}
                    />
                  ) : (
                    <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] font-black text-black" style={{ background: r.color }}>
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenBotProfile({ name: r.name, handle: r.handle, color: r.color, avatar: r.avatar, verified: r.verified })}
                    className="shrink-0 rounded-full transition hover:opacity-80"
                    aria-label={`Buka profil ${r.name}`}
                  >
                    <img
                      src={r.avatar}
                      alt={r.name}
                      loading="lazy"
                      className="h-6 w-6 rounded-full border border-white/10 object-cover"
                      style={{ background: r.color }}
                    />
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1 text-[10px]">
                    {r.isUser || r.typing ? (
                      <span className="font-bold text-white/90">{r.name}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenBotProfile({ name: r.name, handle: r.handle, color: r.color, avatar: r.avatar, verified: r.verified })}
                        className="font-bold text-white/90 hover:underline"
                      >
                        {r.name}
                      </button>
                    )}
                    {r.verified && <VerifiedCheck size={10} />}
                    <span className="text-white/40">@{r.handle} · {r.ago}</span>
                    {r.isUser && <span className="rounded-sm bg-white/10 px-1 text-[8px] uppercase tracking-widest text-white/60">kamu</span>}
                  </div>

                  <p className={`break-words text-[11px] ${r.typing ? "italic text-white/40" : "text-white/80"}`}>
                    {r.typing ? (
                      <span className="inline-flex items-center gap-1">
                        {r.text}
                        <span className="inline-flex gap-0.5">
                          <span className="h-1 w-1 animate-bounce rounded-full bg-white/50" style={{ animationDelay: "0ms" }} />
                          <span className="h-1 w-1 animate-bounce rounded-full bg-white/50" style={{ animationDelay: "120ms" }} />
                          <span className="h-1 w-1 animate-bounce rounded-full bg-white/50" style={{ animationDelay: "240ms" }} />
                        </span>
                      </span>
                    ) : r.text}
                  </p>
                  {r.isUser && !r.typing && (
                    <button
                      type="button"
                      onClick={() => onDeleteReply(postId, comment.id, r.id)}
                      className="mt-0.5 text-[9px] uppercase tracking-widest text-white/40 hover:text-red-400"
                      aria-label="Hapus balasan"
                    >
                      🗑 Hapus
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {/* silence unused vars in this component */}
        <span className="hidden">{meName}{meHandle}{meColor}{meAvatar}{meVerified ? "1" : ""}</span>
      </div>
    </li>
  );
}

function CommunityFeed({
  posts, onLike, onRepost, onCreate, onReply, onDeletePost, onDeleteReply, onOpenBotProfile, meName, meHandle, meColor, meAvatar, meVerified,
}: {
  posts: CommunityPost[];
  onLike: (id: string) => void;
  onRepost: (id: string) => void;
  onCreate: () => void;
  onReply: (postId: string, commentId: string, text: string) => void;
  onDeletePost: (id: string) => void;
  onDeleteReply: (postId: string, commentId: string, replyId: string) => void;
  onOpenBotProfile: (bot: { name: string; handle: string; color: string; avatar: string; verified?: boolean }) => void;
  meName: string;
  meHandle: string;
  meColor: string;
  meAvatar?: string;
  meVerified?: boolean;
}) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((t) => t + 1), 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 mb-3 border-b border-white/10 bg-[#0a0d0b]/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">Zone Community</p>
            <h2 className="text-lg font-black">X Zone <span style={{ color: NEON }}>Feed</span></h2>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/40">{posts.length} post</span>
        </div>
      </div>

      {posts.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-white/50">
          Belum ada postingan. Tekan tombol <span style={{ color: NEON }}>+</span> di pojok kanan bawah untuk membuat postingan pertama.
        </div>
      )}

      <ul className="space-y-3">
        {posts.map((p) => (
          <li key={p.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-start gap-2">
              {p.isMine ? (
                p.avatar ? (
                  <img src={p.avatar} alt={p.author} className="h-10 w-10 shrink-0 rounded-full object-cover" style={{ background: p.color }} loading="lazy" />
                ) : (
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black text-black" style={{ background: p.color }}>
                    {p.author.charAt(0).toUpperCase()}
                  </div>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenBotProfile({ name: p.author, handle: p.handle, color: p.color, avatar: p.avatar ?? botAvatar(p.handle), verified: p.verified })}
                  className="shrink-0 rounded-full transition hover:opacity-80"
                  aria-label={`Buka profil ${p.author}`}
                >
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.author} className="h-10 w-10 rounded-full object-cover" style={{ background: p.color }} loading="lazy" />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-full text-sm font-black text-black" style={{ background: p.color }}>
                      {p.author.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  {p.isMine ? (
                    <span className="font-bold text-white/95">{p.author}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenBotProfile({ name: p.author, handle: p.handle, color: p.color, avatar: p.avatar ?? botAvatar(p.handle), verified: p.verified })}
                      className="font-bold text-white/95 hover:underline"
                    >
                      {p.author}
                    </button>
                  )}
                  {p.verified && <VerifiedCheck size={12} />}
                  <span className="text-white/40">@{p.handle}</span>
                  <span className="text-white/40">· {timeAgoShort(p.createdAt)}</span>
                  {p.isMine && (
                    <button
                      type="button"
                      onClick={() => onDeletePost(p.id)}
                      className="ml-auto text-[10px] text-white/40 hover:text-red-400"
                      aria-label="Hapus postingan"
                      title="Hapus postingan"
                    >
                      🗑
                    </button>
                  )}
                </div>

                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-white/90">
                  {p.caption}{" "}
                  {p.mentions.map((m) => (
                    <span key={m} style={{ color: NEON }}>@{m} </span>
                  ))}
                  {p.hashtags.map((h) => (
                    <span key={h} className="text-sky-400">#{h} </span>
                  ))}
                </p>

                {p.image && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-white/10">
                    <img src={p.image} alt="post" className="w-full object-cover" loading="lazy" />
                  </div>
                )}

                <div className="mt-2 flex items-center gap-4 text-[11px] text-white/60">
                  <button onClick={() => onLike(p.id)} className={`flex items-center gap-1 hover:text-pink-400 ${p.liked ? "text-pink-400" : ""}`}>
                    <span>{p.liked ? "❤️" : "🤍"}</span>
                    <span className="tabular-nums">{p.likes.toLocaleString("id-ID")}</span>
                  </button>
                  <button onClick={() => onRepost(p.id)} className={`flex items-center gap-1 hover:text-emerald-400 ${p.reposted ? "text-emerald-400" : ""}`}>
                    <span>🔁</span>
                    <span className="tabular-nums">{p.reposts.toLocaleString("id-ID")}</span>
                  </button>
                  <span className="flex items-center gap-1">
                    <span>💬</span>
                    <span className="tabular-nums">{p.comments.length.toLocaleString("id-ID")}</span>
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    <span>👁</span>
                    <span className="tabular-nums">{p.views.toLocaleString("id-ID")}</span>
                  </span>
                </div>

                {p.comments.length > 0 && (
                  <ul className="mt-3 space-y-3 border-t border-white/5 pt-3">
                    {p.comments.slice(0, 30).map((c) => (
                      <CommentItem
                        key={c.id}
                        postId={p.id}
                        comment={c}
                        onReply={onReply}
                        onDeleteReply={onDeleteReply}
                        onOpenBotProfile={onOpenBotProfile}
                        meName={meName}
                        meHandle={meHandle}
                        meColor={meColor}
                        meAvatar={meAvatar}
                        meVerified={meVerified}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={onCreate}
        aria-label="Buat postingan"
        className="fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full text-3xl font-black text-black transition hover:scale-105"
        style={{ background: NEON, boxShadow: `0 0 24px ${NEON}80` }}
      >
        +
      </button>
    </>
  );
}


function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!authReady) {
    return <div className="grid min-h-screen place-items-center bg-[#070907] text-white/50 text-sm">Memuat...</div>;
  }

  if (!session) {
    return <LoginGate onSignedIn={() => { /* state updates via listener */ }} />;
  }

  return <App session={session} />;
}

function App({ session }: { session: Session }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const userId = session.user.id;

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [me, setMe] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [showProfile, setShowProfile] = useState(false);
  const [, setTick] = useState(0);
  const [tier, setTier] = useState<Tier>("standard");
  const [alias, setAlias] = useState<string>("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState<"watch" | "community">("watch");
  const [posts, setPosts] = useState<CommunityPost[]>(() => makeSeedPosts());
  const [showCreate, setShowCreate] = useState(false);
  const [botProfile, setBotProfile] = useState<{ name: string; handle: string; color: string; avatar: string; verified?: boolean } | null>(null);

  const [watchedEps, setWatchedEps] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(WATCHED_KEY);
      if (raw) return new Set<number>(JSON.parse(raw));
    } catch { /* ignore */ }
    return new Set<number>();
  });
  const markEpisodeWatched = useCallback((num: number) => {
    setWatchedEps((prev) => {
      if (prev.has(num)) return prev;
      const next = new Set(prev);
      next.add(num);
      try { localStorage.setItem(WATCHED_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, []);


  useEffect(() => {
    try {
      const t = (localStorage.getItem(TIER_KEY) as Tier | null) ?? "standard";
      const a = localStorage.getItem(ALIAS_KEY) ?? "";
      setTier(t);
      setAlias(a);
    } catch { /* ignore */ }
    const id = window.setTimeout(() => setShowWelcome(false), 5000);
    return () => window.clearTimeout(id);
  }, []);

  const current = EPISODES[idx];

  // refresh time-ago labels
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // load me
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (data) setMe(data as Profile);
    })();
  }, [userId]);

  const fetchProfiles = useCallback(async (ids: string[]) => {
    const missing = ids.filter((id) => !profilesMap[id]);
    if (missing.length === 0) return;
    const { data } = await supabase.from("profiles").select("*").in("id", missing);
    if (data && data.length) {
      setProfilesMap((m) => {
        const next = { ...m };
        for (const p of data as Profile[]) next[p.id] = p;
        return next;
      });
    }
  }, [profilesMap]);

  // initial chat load
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) {
        const list = data as ChatMessage[];
        setMessages(list);
        const ids = Array.from(new Set(list.map((m) => m.user_id)));
        if (ids.length) {
          const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
          if (profs) {
            const map: Record<string, Profile> = {};
            for (const p of profs as Profile[]) map[p.id] = p;
            setProfilesMap(map);
          }
        }
      }
    })();
  }, []);

  // realtime subscribe
  useEffect(() => {
    const ch = supabase
      .channel("public-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((cs) => (cs.some((x) => x.id === m.id) ? cs : [m, ...cs].slice(0, 100)));
          fetchProfiles([m.user_id]);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const oldId = (payload.old as { id: string }).id;
          setMessages((cs) => cs.filter((x) => x.id !== oldId));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchProfiles]);

  useEffect(() => { setTime(0); setPlaying(false); }, [idx]);
  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);
  useEffect(() => {
    if (videoRef.current) { videoRef.current.volume = volume; videoRef.current.muted = muted; }
  }, [volume, muted]);

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current; if (!v || !dur) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - r.left) / r.width) * dur;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t || sending) return;
    setSending(true);
    const { error } = await supabase
      .from("chat_messages")
      .insert({ user_id: userId, content: t });
    setSending(false);
    if (!error) setInput("");
  };

  const deleteMessage = async (id: string) => {
    await supabase.from("chat_messages").delete().eq("id", id);
    setMessages((cs) => cs.filter((m) => m.id !== id));
  };

  const signOut = async () => {
    try { localStorage.removeItem(TIER_KEY); localStorage.removeItem(ALIAS_KEY); } catch { /* ignore */ }
    await supabase.auth.signOut();
  };

  // ---- Community actions ----
  const authorName = alias || me?.display_name || me?.username || "kamu";
  const authorHandle = (alias || me?.username || "kamu").replace(/[^a-zA-Z0-9_]/g, "");
  const authorVerified = tier === "dev";
  const isOwner = alias === "Sion_dfkit";

  const createPost = (data: { caption: string; hashtags: string[]; mentions: string[]; image: string }) => {
    const post: CommunityPost = {
      id: randomId(),
      author: authorName,
      handle: authorHandle,
      color: meColor,
      verified: authorVerified,
      caption: data.caption,
      hashtags: data.hashtags,
      mentions: data.mentions,
      image: data.image,
      createdAt: Date.now(),
      likes: 0,
      reposts: 0,
      views: 12,
      comments: [],
      isMine: true,
    };
    setPosts((ps) => [post, ...ps]);
    setShowCreate(false);
    setActiveTab("community");

    // Simulate viral explosion
    let ticks = 0;
    const viralId = window.setInterval(() => {
      ticks += 1;
      setPosts((ps) => ps.map((p) => {
        if (p.id !== post.id) return p;
        const bump = Math.floor(50 + Math.random() * 350);
        return {
          ...p,
          likes: p.likes + Math.floor(20 + Math.random() * 180),
          reposts: p.reposts + Math.floor(5 + Math.random() * 45),
          views: p.views + bump * 8,
        };
      }));
      if (ticks > 30) window.clearInterval(viralId);
    }, 700);

    // Flood bot comments
    let cticks = 0;
    const usedTexts = new Set<string>();
    const commentId = window.setInterval(() => {
      cticks += 1;
      const bot = pickRandom(BOT_POOL);
      let text = pickRandom(COMMENT_POOL);
      let guard = 0;
      while (usedTexts.has(text) && guard < 5) { text = pickRandom(COMMENT_POOL); guard++; }
      usedTexts.add(text);
      const comment: BotComment = {
        id: randomId(),
        name: bot.name,
        handle: bot.handle,
        color: bot.color,
        avatar: bot.avatar,
        text,
        ago: `${cticks}d`,
        replies: [],
      };
      setPosts((ps) => ps.map((p) => p.id === post.id ? { ...p, comments: [comment, ...p.comments] } : p));
      if (cticks > 40) window.clearInterval(commentId);
    }, 450);
  };


  const toggleLike = (id: string) => setPosts((ps) => ps.map((p) => p.id === id
    ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p));
  const toggleRepost = (id: string) => setPosts((ps) => ps.map((p) => p.id === id
    ? { ...p, reposted: !p.reposted, reposts: p.reposts + (p.reposted ? -1 : 1) } : p));

  const deletePost = (id: string) => setPosts((ps) => ps.filter((p) => !(p.id === id && p.isMine)));
  const deleteReply = (postId: string, commentId: string, replyId: string) =>
    setPosts((ps) => ps.map((p) => p.id !== postId ? p : {
      ...p,
      comments: p.comments.map((c) => c.id !== commentId ? c : {
        ...c,
        replies: c.replies.filter((r) => !(r.id === replyId && r.isUser)),
      }),
    }));

  const replyToComment = (postId: string, commentId: string, text: string) => {
    const myReply: BotReply = {
      id: randomId(),
      name: authorName,
      handle: authorHandle,
      color: meColor,
      avatar: "",
      text,
      ago: "0d",
      isUser: true,
      verified: authorVerified,
    };
    setPosts((ps) => ps.map((p) => p.id !== postId ? p : {
      ...p,
      comments: p.comments.map((c) => c.id !== commentId ? c : { ...c, replies: [...c.replies, myReply] }),
    }));

    // Tampilkan indikator "Bot sedang mengetik..." dulu biar terasa natural
    const typingId = randomId();
    setPosts((ps) => ps.map((p) => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: p.comments.map((c) => {
          if (c.id !== commentId) return c;
          const typingReply: BotReply = {
            id: typingId,
            name: c.name,
            handle: c.handle,
            color: c.color,
            avatar: c.avatar,
            text: "Bot sedang mengetik",
            ago: "baru saja",
            typing: true,
          };
          return { ...c, replies: [...c.replies, typingReply] };
        }),
      };
    }));

    // Bot balas balik 1-2 detik kemudian, replace placeholder mengetik
    const delay = 1000 + Math.floor(Math.random() * 1000);
    window.setTimeout(() => {
      setPosts((ps) => ps.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: p.comments.map((c) => {
            if (c.id !== commentId) return c;
            const thread: ThreadTurn[] = c.replies
              .filter((r) => !r.typing)
              .map((r) => ({ text: r.text, isUser: !!r.isUser }));
            const botReply: BotReply = {
              id: randomId(),
              name: c.name,
              handle: c.handle,
              color: c.color,
              avatar: c.avatar,
              text: pickBotReplyContextual(c.text, thread, text),
              ago: "baru saja",
            };
            return {
              ...c,
              replies: [...c.replies.filter((r) => r.id !== typingId), botReply],
            };
          }),
        };
      }));
    }, delay);
  };


  const progress = dur ? (time / dur) * 100 : 0;
  const meColor = me?.avatar_color ?? NEON;
  const meInitial = (me?.display_name || me?.username || "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#0a0d0b] text-white">
      <style>{`
        .neon-glow { box-shadow: 0 0 0 1px rgba(57,255,122,.35), 0 0 24px rgba(57,255,122,.15); }
        .range-neon { accent-color: ${NEON}; }
      `}</style>

      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md font-black text-black" style={{ background: NEON }}>Z</div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-black tracking-widest">ZONE</h1>
              <p className="truncate text-[10px] uppercase tracking-[0.2em] text-white/40">Heaven Defying Dragonforce</p>
            </div>
          </div>
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 hover:bg-white/10"
          >
            <span
              className="grid h-7 w-7 place-items-center rounded-full text-xs font-black text-black"
              style={{ background: meColor }}
            >
              {meInitial}
            </span>
            <span className="text-xs font-bold">@{alias || me?.username || "..."}</span>
            {isOwner && <DevPurpleCheck size={14} title="Developer / Owner" />}
            <TierBadges tier={tier} />
          </button>
        </div>
        {showWelcome && (
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 pb-2 text-[11px] text-white/70 animate-fade-in">
            <span>Welcome back,</span>
            <span className="font-bold text-white">{alias || me?.username || "kamu"}</span>
            <TierBadges tier={tier} />
            <button onClick={() => setShowWelcome(false)} className="ml-auto text-white/40 hover:text-white">✕</button>
          </div>
        )}
      </header>

      <main className={`mx-auto max-w-3xl px-4 py-5 space-y-4 pb-24 animate-fade-in ${activeTab === "watch" ? "" : "hidden"}`}>
        {/* Menu Utama — Katalog */}
        <section>
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">Menu Utama</p>
              <h2 className="text-lg font-black sm:text-xl">Katalog Serial</h2>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-white/40">1 Judul</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* HDD — bisa ditonton */}
            <button
              onClick={() => playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-black text-left transition hover:border-[color:var(--n)]"
              style={{ ["--n" as never]: NEON }}
            >
              <div className="relative aspect-[3/4] w-full">
                <img src={poster.url} alt="Heaven Defying Dragonforce" className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-black" style={{ background: NEON }}>
                  <span className="h-1 w-1 animate-pulse rounded-full bg-black/70" /> Bisa Ditonton
                </span>
              </div>
              <div className="p-2.5">
                <p className="truncate text-xs font-black">Heaven Defying Dragonforce</p>
                <p className="mt-0.5 text-[10px] text-white/50">Season 1 • 5 Episode</p>
              </div>
            </button>
          </div>
        </section>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10">
          <div className="relative aspect-[3/4] sm:aspect-[16/9] w-full">
            <img src={poster.url} alt="Heaven Defying Dragonforce poster" className="absolute inset-0 h-full w-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
            <div className="pointer-events-none absolute -inset-px rounded-2xl" style={{ boxShadow: `inset 0 0 60px ${NEON}22` }} />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-black" style={{ background: NEON, boxShadow: `0 0 12px ${NEON}80` }}>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black/70" /> Tersedia • Sedang Tayang
                </span>
                <span className="inline-block rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest" style={{ borderColor: NEON, color: NEON }}>
                  Eksklusif • Season 1
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black leading-tight drop-shadow-lg">
                Heaven Defying <span style={{ color: NEON }}>Dragonforce</span>
              </h2>
              <p className="max-w-lg text-xs sm:text-sm text-white/75 line-clamp-3">
                Di tanah yang dikuasai kultivator kejam, Lei Zhen bangkit dengan kekuatan Naga Awal untuk melawan takdir. Petualangan epik penuh pertarungan dahsyat dan rahasia kuno menanti.
              </p>
              <button
                onClick={() => {
                  playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  setTimeout(() => videoRef.current?.play().catch(() => {}), 600);
                }}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-black transition hover:brightness-110"
                style={{ background: NEON, boxShadow: `0 0 24px ${NEON}80` }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
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
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                setTime(v.currentTime);
                if (v.duration > 0 && v.currentTime / v.duration >= 0.9) {
                  markEpisodeWatched(current.num);
                }
              }}
              onEnded={() => markEpisodeWatched(current.num)}
              onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
              playsInline
            />
            {!playing && (
              <button onClick={togglePlay} className="absolute inset-0 grid place-items-center bg-black/30 transition hover:bg-black/40" aria-label="Play">
                <span className="grid h-16 w-16 place-items-center rounded-full text-black" style={{ background: NEON, boxShadow: `0 0 30px ${NEON}80` }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </button>
            )}
          </div>

          <div className="bg-gradient-to-t from-black to-black/70 px-3 pb-3 pt-2">
            <div onClick={seek} className="group relative h-2 cursor-pointer rounded-full bg-white/10">
              <div className="absolute inset-y-0 left-0 rounded-full transition-[width]" style={{ width: `${progress}%`, background: NEON, boxShadow: `0 0 8px ${NEON}` }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <button onClick={togglePlay} className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/10 hover:bg-white/20" aria-label={playing ? "Pause" : "Play"}>
                {playing ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <span className="tabular-nums text-white/70">{fmt(time)} <span className="text-white/30">/</span> {fmt(dur)}</span>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => setMuted((m) => !m)} className="grid h-8 w-8 place-items-center rounded-md bg-white/10 hover:bg-white/20" aria-label="Mute">
                  {muted || volume === 0 ? "🔇" : volume < 0.5 ? "🔈" : "🔊"}
                </button>
                <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                  onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
                  className="range-neon hidden w-20 sm:block" />
                <div className="relative">
                  <button onClick={() => setSpeedOpen((o) => !o)} className="rounded-md bg-white/10 px-2 py-1.5 text-xs font-semibold hover:bg-white/20">{speed}x</button>
                  {speedOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-24 overflow-hidden rounded-md border border-white/10 bg-black/95 shadow-lg">
                      {SPEEDS.map((s) => (
                        <button key={s} onClick={() => { setSpeed(s); setSpeedOpen(false); }}
                          className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-white/10 ${s === speed ? "font-bold" : ""}`}
                          style={s === speed ? { color: NEON } : undefined}>
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

        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">Sedang Tayang</p>
          <h2 className="mt-1 text-lg font-black sm:text-xl">
            Episode {current.num} — <span style={{ color: NEON }}>{current.title}</span>
          </h2>
        </div>

        {/* Public Realtime Chat */}
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase tracking-widest">Obrolan Publik</h3>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/70">{messages.length}</span>
              <span className="flex items-center gap-1 text-[10px] text-white/50">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: NEON }} />
                Realtime
              </span>
            </div>
          </div>

          <form onSubmit={sendMessage} className="mb-4 flex items-start gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black text-black" style={{ background: meColor }}>
              {meInitial}
            </div>
            <div className="min-w-0 flex-1">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ajak ngobrol semua orang..."
                className="w-full border-b border-white/10 bg-transparent px-1 py-2 text-sm placeholder:text-white/30 focus:border-[color:var(--neon)] focus:outline-none"
                style={{ ["--neon" as never]: NEON }}
                maxLength={500}
              />
              {input.trim() && (
                <div className="mt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setInput("")} className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10">Batal</button>
                  <button type="submit" disabled={sending} className="rounded-full px-4 py-1.5 text-xs font-bold text-black transition hover:brightness-110 disabled:opacity-60" style={{ background: NEON }}>
                    {sending ? "Mengirim..." : "Kirim"}
                  </button>
                </div>
              )}
            </div>
          </form>

          {messages.length === 0 ? (
            <p className="text-xs text-white/30">Belum ada pesan. Jadilah yang pertama!</p>
          ) : (
            <ul className="space-y-4">
              {messages.map((m) => {
                const p = profilesMap[m.user_id];
                const color = p?.avatar_color ?? "#888";
                const name = p?.display_name || p?.username || "User";
                const uname = p?.username ?? "user";
                const isMine = m.user_id === userId;
                return (
                  <li key={m.id} className="flex items-start gap-2">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black text-black" style={{ background: color }}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-white/90">{name}</span>
                        <span className="text-[10px] text-white/40">@{uname} • {timeAgo(m.created_at)}</span>
                      </div>
                      {p?.bio && <p className="text-[10px] italic text-white/40 line-clamp-1">{p.bio}</p>}
                      <p className="mt-0.5 break-words text-sm text-white/85">{m.content}</p>
                      {isMine && (
                        <button onClick={() => deleteMessage(m.id)} className="mt-1 text-[10px] text-white/40 hover:text-red-400">
                          Hapus
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Episode grid */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest">Daftar Episode</h3>
            <span className="text-[10px] uppercase tracking-widest text-white/40">Season 1</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {EPISODES.map((e, i) => {
              const active = i === idx;
              return (
                <button key={e.num} onClick={() => setIdx(i)}
                  className={`aspect-square rounded-md border text-sm font-bold transition ${active ? "text-black" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"}`}
                  style={active ? { background: NEON, borderColor: NEON, boxShadow: `0 0 12px ${NEON}80` } : undefined}>
                  {e.num}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {activeTab === "community" && (
        <main className="mx-auto max-w-3xl px-4 py-5 pb-24 animate-fade-in">
          <CommunityFeed
            posts={posts}
            onLike={toggleLike}
            onRepost={toggleRepost}
            onCreate={() => setShowCreate(true)}
            onReply={replyToComment}
            onDeletePost={deletePost}
            onDeleteReply={deleteReply}
            onOpenBotProfile={setBotProfile}
            meName={authorName}
            meHandle={authorHandle}
            meColor={meColor}
            meVerified={authorVerified}
          />

        </main>
      )}

      {showCreate && (
        <CreatePostModal
          author={authorName}
          handle={authorHandle}
          color={meColor}
          verified={authorVerified}
          onClose={() => setShowCreate(false)}
          onPost={createPost}
        />
      )}

      {botProfile && (
        <BotProfileModal bot={botProfile} onClose={() => setBotProfile(null)} />
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl">
          {([
            { key: "watch", label: "Nonton", icon: "▶" },
            { key: "community", label: "Komunitas", icon: "◎" },
          ] as const).map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition"
                style={active ? { color: NEON } : { color: "rgba(255,255,255,0.5)" }}
              >
                <span className="text-lg leading-none">{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>


      {showProfile && me && (
        <ProfileSheet
          profile={me}
          tier={tier}
          isOwner={isOwner}
          watchedCount={watchedEps.size}
          totalEpisodes={EPISODES.length}
          onClose={() => setShowProfile(false)}
          onSaved={(p) => { setMe(p); setProfilesMap((m) => ({ ...m, [p.id]: p })); }}
          onSignOut={signOut}
        />
      )}
    </div>
  );
}
