import { WARNING_TEXT } from "@/lib/moderation";

export function ModerationWarning({
  appealing,
  countdown,
  onAppeal,
}: {
  appealing: boolean;
  countdown: string;
  onAppeal: () => void;
}) {
  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-red-500/60 bg-red-950/40 shadow-[0_0_24px_rgba(239,68,68,0.25)]">
      <div className="flex items-center gap-2 border-b border-red-500/40 bg-red-600/20 px-3 py-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-black text-black">!</span>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-400">Pelanggaran Komunitas</p>
      </div>
      <div className="px-3 py-3">
        <p className="text-[13px] font-semibold leading-relaxed text-red-400">{WARNING_TEXT}</p>

        {!appealing ? (
          <button
            type="button"
            onClick={onAppeal}
            className="mt-3 w-full rounded-xl border border-red-500/70 bg-red-500/20 px-3 py-2 text-[13px] font-bold text-red-300 transition hover:bg-red-500/30"
          >
            Ajukan Permohonan Banding
          </button>
        ) : (
          <div className="mt-3 rounded-xl border border-red-500/50 bg-black/40 px-3 py-2 text-center">
            <p className="text-[12px] font-bold text-red-300">Banding Sedang Diproses</p>
            <p className="mt-1 font-mono text-2xl font-black tabular-nums text-red-400">{countdown}</p>
            <p className="mt-1 text-[10px] text-white/40">Fitur posting terkunci sampai hitungan selesai.</p>
          </div>
        )}
      </div>
    </div>
  );
}
