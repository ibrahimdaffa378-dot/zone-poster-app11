import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import hddPoster from "@/assets/hdd-poster.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Animation Lokal Zone — Heaven Defying Dragonforce" },
      { name: "description", content: "Streaming eksklusif Heaven Defying Dragonforce di Animation Lokal Zone." },
      { property: "og:title", content: "Animation Lokal Zone" },
      { property: "og:description", content: "Streaming eksklusif Heaven Defying Dragonforce." },
      { property: "og:image", content: hddPoster.url },
    ],
  }),
  component: Index,
});

const EPISODES = [
  { num: 1, title: "Kebangkitan Kekuatan Naga", dur: "24:00" },
  { num: 2, title: "Pertarungan Pertama Lei Zhen", dur: "23:42" },
  { num: 3, title: "Kultivasi Ku Ditekan", dur: "24:15" },
  { num: 4, title: "Bentrokan Bayangan Sekte", dur: "25:08" },
  { num: 5, title: "Jejak Akar Naga Awal", dur: "24:33" },
  { num: 6, title: "Murka Sang Pendekar", dur: "26:00" },
];

function Index() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(1);

  const filtered = EPISODES.filter(
    (e) =>
      !query ||
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      `episode ${e.num}`.includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-black text-neutral-100 selection:bg-[#a855f7]/40 pb-24 md:pb-0">
      {/* NAV */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/70 border-b border-white/5">
        <div className="mx-auto max-w-7xl grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 md:px-6 md:py-4">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#39ff7a] to-[#a855f7] text-black font-black shadow-[0_0_20px_rgba(168,85,247,0.5)]">
              Z
            </span>
            <span className="hidden sm:block truncate font-black tracking-[0.18em] text-sm md:text-base bg-gradient-to-r from-[#39ff7a] via-emerald-300 to-[#c084fc] bg-clip-text text-transparent">
              ANIMATION LOKAL ZONE
            </span>
          </Link>

          <div className="relative mx-auto w-full max-w-md">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari episode atau klip..."
              className="w-full rounded-full bg-white/5 border border-white/10 px-4 py-2 pl-10 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition focus:border-[#39ff7a]/60 focus:ring-2 focus:ring-[#39ff7a]/20"
            />
            <svg viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="relative shrink-0">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#a855f7] to-[#39ff7a] text-black font-black ring-2 ring-white/10">
              D
            </div>
            <span
              title="Developer Verified"
              className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-[#a855f7] text-[8px] font-black text-white ring-2 ring-black shadow-[0_0_10px_#a855f7]"
            >
              ✓
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 md:px-6">
        {/* HERO */}
        <section className="relative mt-5 overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-[0_30px_80px_-30px_rgba(168,85,247,0.45)]">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full">
            <img
              src={hddPoster.url}
              alt="Heaven Defying Dragonforce"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

            <div className="relative z-10 flex h-full flex-col justify-end p-5 sm:p-8 md:p-12 max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#39ff7a]/40 bg-[#39ff7a]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#39ff7a] shadow-[0_0_18px_rgba(57,255,122,0.25)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#39ff7a] animate-pulse" />
                Original Series · Eksklusif
              </span>
              <h1 className="mt-3 text-3xl sm:text-5xl md:text-6xl font-black leading-[0.95] tracking-tight">
                <span className="text-[#39ff7a] drop-shadow-[0_0_18px_rgba(57,255,122,0.45)]">
                  Heaven Defying
                </span>
                <br />
                <span className="text-yellow-300 drop-shadow-[0_0_18px_rgba(253,224,71,0.4)]">
                  Dragonforce
                </span>
              </h1>
              <p className="mt-3 text-xs sm:text-sm md:text-base text-neutral-300/90 max-w-lg">
                Ikuti perjalanan epik Lei Zhen dalam menguasai kekuatan naga kuno yang telah lama tertidur — pertarungan, pengkhianatan, dan kebangkitan.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  to="/watch"
                  className="group relative inline-flex items-center gap-2 rounded-full bg-[#39ff7a] px-5 py-2.5 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_25px_rgba(57,255,122,0.55)] transition hover:scale-105 hover:shadow-[0_0_40px_rgba(57,255,122,0.85)]"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-black/20">▶</span>
                  Tonton Sekarang
                </Link>
                <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                  6 Episode · Season 1
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* EPISODE GRID */}
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Daftar Episode</h2>
              <p className="text-xs text-neutral-500 mt-1">Season 1 · Heaven Defying Dragonforce</p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#a855f7]">
              {filtered.length} / {EPISODES.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((ep) => {
              const isActive = active === ep.num;
              return (
                <Link
                  key={ep.num}
                  to="/watch"
                  onClick={() => setActive(ep.num)}
                  onMouseEnter={() => setActive(ep.num)}
                  className={[
                    "group relative block overflow-hidden rounded-2xl bg-neutral-950 ring-1 transition-all duration-300",
                    "hover:-translate-y-1 hover:scale-[1.02]",
                    isActive
                      ? "ring-[#39ff7a] shadow-[0_0_30px_rgba(57,255,122,0.45)]"
                      : "ring-white/10 hover:ring-[#a855f7]/70 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]",
                  ].join(" ")}
                >
                  <div className="relative aspect-video w-full overflow-hidden">
                    <img
                      src={hddPoster.url}
                      alt={`Episode ${ep.num}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                    {/* Play overlay */}
                    <div className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-[#39ff7a] text-black shadow-[0_0_25px_rgba(57,255,122,0.7)]">
                        ▶
                      </div>
                    </div>

                    {/* Episode num */}
                    <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#39ff7a] backdrop-blur">
                      EP {String(ep.num).padStart(2, "0")}
                    </span>
                    {/* Duration */}
                    <span className="absolute right-2 bottom-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/10">
                      {ep.dur}
                    </span>
                  </div>

                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                      Episode {ep.num}
                    </p>
                    <h3 className="mt-1 text-sm font-bold leading-snug line-clamp-2">
                      Eps {ep.num}: {ep.title}
                    </h3>
                  </div>

                  {isActive && (
                    <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-[#39ff7a]/40" />
                  )}
                </Link>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-neutral-500">
              Tidak ada episode cocok dengan "{query}"
            </p>
          )}
        </section>

        <footer className="mt-16 border-t border-white/5 py-6 text-center text-[10px] uppercase tracking-[0.25em] text-neutral-600">
          © Animation Lokal Zone · Heaven Defying Dragonforce
        </footer>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 inset-x-0 z-30 md:hidden border-t border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="grid grid-cols-3">
          <button className="flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-widest text-[#39ff7a]">
            <span className="text-base">⌂</span>Home
          </button>
          <Link to="/watch" className="flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-widest text-neutral-400 hover:text-[#a855f7]">
            <span className="text-base">▶</span>Tonton
          </Link>
          <button className="flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-widest text-neutral-400">
            <span className="text-base">◉</span>Profil
          </button>
        </div>
      </nav>
    </div>
  );
}
