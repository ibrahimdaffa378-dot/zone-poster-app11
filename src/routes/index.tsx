import { createFileRoute, Link } from "@tanstack/react-router";
import hddPoster from "@/assets/hdd-poster.asset.json";
import zanePoster from "@/assets/zane-poster.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zone — Menu Utama" },
      { name: "description", content: "Tonton anime stickman eksklusif di Zone: Heaven Defying Dragonforce & Zane Movies." },
      { property: "og:title", content: "Zone — Menu Utama" },
      { property: "og:description", content: "Tonton anime stickman eksklusif di Zone." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 selection:bg-[#39ff14]/30">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-black/60 border-b border-white/5">
        <div className="mx-auto max-w-5xl px-5 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-[0.25em] bg-gradient-to-r from-[#39ff14] via-emerald-300 to-yellow-300 bg-clip-text text-transparent">
            ZONE
          </h1>
          <span className="text-[10px] uppercase tracking-widest text-neutral-500">Menu Utama</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20 pt-6 space-y-10">
        {/* Featured */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase tracking-[0.2em] text-neutral-400">Featured</h2>
            <span className="text-[10px] text-[#39ff14]/80">● NOW STREAMING</span>
          </div>

          <Link
            to="/watch"
            className="group relative block w-full overflow-hidden rounded-3xl bg-black ring-1 ring-white/10 shadow-[0_20px_60px_-20px_rgba(57,255,20,0.35)] transition-transform duration-300 ease-out hover:scale-[1.015] active:scale-[0.99]"
          >
            <div className="aspect-[16/9] w-full overflow-hidden">
              <img
                src={hddPoster.url}
                alt="Heaven Defying Dragonforce Season 1 poster"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-left">
              <span className="inline-block text-[10px] font-semibold tracking-widest uppercase text-[#39ff14] mb-2">
                Season 1 • Episode Baru Mingguan
              </span>
              <h3 className="text-xl sm:text-2xl font-black leading-tight">
                Heaven Defying Dragonforce
              </h3>
              <p className="mt-1 text-xs text-neutral-300/80 max-w-md">
                Pertarungan epik dua pendekar stickman dengan aura legendaris. Tap untuk menonton.
              </p>
              <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#39ff14] px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-black">
                ▶ Tonton Sekarang
              </span>
            </div>
          </Link>
        </section>




        <p className="text-center text-[10px] uppercase tracking-widest text-neutral-600 pt-4">
          © Zone Studio
        </p>
      </main>
    </div>
  );
}
