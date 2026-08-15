// Sistem Moderasi Kata Kasar & Blokir Otomatis (modul mandiri)
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "zone_moderation_v1";
export const APPEAL_MS = 17 * 60 * 1000; // 17 menit

const BAD_WORDS = ["kontol", "tai", "bangsat", "ngetod", "anjing", "goblok"];

/** Normalisasi leetspeak & pemisah agar variasi tetap terdeteksi */
function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[4@]/g, "a")
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[$5]/g, "s")
    .replace(/[^a-z]+/g, " ");
}

export function findProfanity(text: string): string | null {
  const n = ` ${normalize(text)} `;
  for (const w of BAD_WORDS) {
    if (new RegExp(`\\b${w}\\w*\\b`).test(n)) return w;
  }
  return null;
}

export function containsProfanity(text: string): boolean {
  return findProfanity(text) !== null;
}

export const WARNING_TEXT =
  "Peringatan Pelanggaran: Sistem ZONE mendeteksi kata-kata tidak pantas/kasar dalam postingan Anda. Akun Anda dibatasi sementara demi menjaga kenyamanan Komunitas!";

type State = { flagged: boolean; appealUntil: number | null };

function read(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as State;
      if (p.appealUntil && p.appealUntil <= Date.now()) return { flagged: false, appealUntil: null };
      return { flagged: !!p.flagged, appealUntil: p.appealUntil ?? null };
    }
  } catch { /* ignore */ }
  return { flagged: false, appealUntil: null };
}

export function useModeration() {
  const [state, setState] = useState<State>({ flagged: false, appealUntil: null });
  const [now, setNow] = useState(Date.now());

  useEffect(() => { setState(read()); }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  useEffect(() => {
    if (!state.appealUntil) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (state.appealUntil && t >= state.appealUntil) {
        setState({ flagged: false, appealUntil: null });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.appealUntil]);

  const remainingMs = state.appealUntil ? Math.max(0, state.appealUntil - now) : 0;
  const appealing = !!state.appealUntil && remainingMs > 0;
  const locked = state.flagged || appealing;

  const flag = useCallback(() => setState((s) => ({ ...s, flagged: true })), []);
  const startAppeal = useCallback(
    () => setState({ flagged: true, appealUntil: Date.now() + APPEAL_MS }),
    [],
  );
  const clear = useCallback(() => setState({ flagged: false, appealUntil: null }), []);

  const mmss = `${String(Math.floor(remainingMs / 60000)).padStart(2, "0")}:${String(
    Math.floor((remainingMs % 60000) / 1000),
  ).padStart(2, "0")}`;

  return { flagged: state.flagged, appealing, locked, remainingMs, countdown: mmss, flag, startAppeal, clear };
}
