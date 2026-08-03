import { useCallback, useEffect, useMemo, useState } from "react";

const NEON = "#39FF7A";
const MY_PROFILE_KEY = "zone_my_profile_v1";

export type MyProfileData = {
  name: string;
  bio: string;
  avatar: string;
};

const AVATAR_STYLES = ["adventurer", "big-smile", "bottts", "fun-emoji", "micah", "avataaars", "lorelei", "notionists"];

export function avatarUrl(style: string, seed: string) {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`;
}

export function loadMyProfile(fallbackName: string, seed: string): MyProfileData {
  const def: MyProfileData = {
    name: fallbackName,
    bio: "Penikmat Heaven Defying Dragonforce ⚡",
    avatar: avatarUrl("adventurer", seed || fallbackName || "zone"),
  };
  try {
    const raw = localStorage.getItem(MY_PROFILE_KEY);
    if (raw) return { ...def, ...(JSON.parse(raw) as Partial<MyProfileData>) };
  } catch { /* ignore */ }
  return def;
}

function saveMyProfile(p: MyProfileData) {
  try { localStorage.setItem(MY_PROFILE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

const DUMMY_VIDEOS: { src: string; poster: string; caption: string; views: number }[] = [
  {
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    poster: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&q=70&auto=format&fit=crop",
    caption: "Reaction ending Ep 5 🔥 #HDD",
    views: 128400,
  },
  {
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    poster: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&q=70&auto=format&fit=crop",
    caption: "Edit malam-malam, vibes opening 🌃",
    views: 54300,
  },
  {
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    poster: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=70&auto=format&fit=crop",
    caption: "Grinding sampe pagi 🎮",
    views: 21900,
  },
  {
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    poster: "https://images.unsplash.com/photo-1633613286991-611fe299c4be?w=500&q=70&auto=format&fit=crop",
    caption: "Frame favorit gua, estetik parah 🎨",
    views: 9800,
  },
];

export default function MyProfile({
  fallbackName,
  handle,
  seed,
  badge,
  myPosts,
}: {
  fallbackName: string;
  handle: string;
  seed: string;
  badge?: React.ReactNode;
  myPosts: { id: string; image: string; caption: string; likes: number }[];
}) {
  const [data, setData] = useState<MyProfileData>(() => loadMyProfile(fallbackName, seed));
  const [editing, setEditing] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);

  useEffect(() => { saveMyProfile(data); }, [data]);

  const followers = useMemo(() => 1240 + myPosts.length * 137, [myPosts.length]);
  const following = 182;
  const likes = useMemo(
    () => 8600 + myPosts.reduce((a, p) => a + (p.likes || 0), 0) + DUMMY_VIDEOS.reduce((a, v) => a + Math.round(v.views / 40), 0),
    [myPosts],
  );

  const items = useMemo(
    () => [
      ...myPosts.map((p) => ({ kind: "image" as const, id: p.id, poster: p.image, caption: p.caption, views: 1200 + p.likes * 13 })),
      ...DUMMY_VIDEOS.map((v, i) => ({ kind: "video" as const, id: `dv${i}`, poster: v.poster, caption: v.caption, views: v.views, src: v.src })),
    ],
    [myPosts],
  );

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col items-center text-center">
        <img
          src={data.avatar}
          alt={data.name}
          className="h-24 w-24 rounded-full border-2 object-cover"
          style={{ borderColor: `${NEON}66`, background: "#111" }}
        />
        <div className="mt-3 flex items-center gap-1 text-base font-black">
          <span>{data.name || fallbackName}</span>
          {badge}
        </div>
        <p className="text-xs text-white/50">@{handle}</p>

        <div className="mt-4 flex items-center gap-6">
          {[
            { v: following, l: "Mengikuti" },
            { v: followers, l: "Pengikut" },
            { v: likes, l: "Penggemar" },
          ].map((s) => (
            <div key={s.l} className="min-w-[64px]">
              <div className="text-base font-black">{compact(s.v)}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/40">{s.l}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setEditing(true)}
          className="mt-4 rounded-lg px-6 py-2 text-xs font-black uppercase tracking-widest text-black transition hover:brightness-110"
          style={{ background: NEON, boxShadow: `0 0 14px ${NEON}55` }}
        >
          Edit Profil
        </button>

        <p className="mt-3 max-w-sm whitespace-pre-wrap text-xs text-white/70">{data.bio}</p>
      </div>

      <div className="mt-5 border-t border-white/10 pt-1">
        <div className="mb-2 flex items-center gap-4 px-1 text-[11px] font-bold uppercase tracking-widest">
          <span style={{ color: NEON }}>Video</span>
          <span className="text-white/30">Disukai</span>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {items.map((it, i) => (
            <button
              key={it.id}
              onClick={() => it.kind === "video" && setPlaying(i)}
              className="relative aspect-[9/14] overflow-hidden rounded-md bg-white/5 text-left"
            >
              <img src={it.poster} alt={it.caption} loading="lazy" className="h-full w-full object-cover" />
              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[9px] font-bold text-white">
                ▶ {compact(it.views)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {playing != null && items[playing]?.kind === "video" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setPlaying(null)}>
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <video
              src={(items[playing] as { src: string }).src}
              poster={items[playing].poster}
              controls
              autoPlay
              className="w-full rounded-xl border border-white/10"
            />
            <div className="mt-2 flex items-start justify-between gap-3">
              <p className="text-xs text-white/70">{items[playing].caption}</p>
              <button onClick={() => setPlaying(null)} className="text-white/60 hover:text-white">✕</button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <EditMyProfile
          data={data}
          seed={seed || handle}
          onClose={() => setEditing(false)}
          onSave={(d) => { setData(d); setEditing(false); }}
        />
      )}
    </div>
  );
}

function EditMyProfile({
  data, seed, onClose, onSave,
}: {
  data: MyProfileData;
  seed: string;
  onClose: () => void;
  onSave: (d: MyProfileData) => void;
}) {
  const [name, setName] = useState(data.name);
  const [bio, setBio] = useState(data.bio);
  const [avatar, setAvatar] = useState(data.avatar);

  const options = useMemo(
    () => AVATAR_STYLES.flatMap((s) => [avatarUrl(s, seed || "zone"), avatarUrl(s, `${seed || "zone"}-2`)]),
    [seed],
  );

  const submit = useCallback(() => {
    onSave({ name: name.trim() || data.name, bio: bio.trim(), avatar });
  }, [name, bio, avatar, data.name, onSave]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl border border-white/10 bg-[#0d0f0d] p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest">Edit Profil</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>

        <div className="mb-3 flex items-center gap-3">
          <img src={avatar} alt="avatar" className="h-16 w-16 rounded-full border object-cover" style={{ borderColor: `${NEON}55`, background: "#111" }} />
          <p className="text-[11px] text-white/50">Pilih avatar kartun favoritmu di bawah.</p>
        </div>

        <div className="mb-4 grid max-h-32 grid-cols-6 gap-2 overflow-y-auto pr-1">
          {options.map((u) => (
            <button key={u} onClick={() => setAvatar(u)} className="rounded-full ring-2" style={{ boxShadow: u === avatar ? `0 0 0 2px ${NEON}` : undefined }}>
              <img src={u} alt="opsi avatar" loading="lazy" className="h-10 w-10 rounded-full bg-white/5 object-cover" />
            </button>
          ))}
        </div>

        <label className="mb-1 block text-[10px] uppercase tracking-widest text-white/40">Nama</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-3 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm outline-none focus:border-white/30"
          placeholder="Nama tampilan"
        />

        <label className="mb-1 block text-[10px] uppercase tracking-widest text-white/40">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="mb-4 w-full resize-none rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm outline-none focus:border-white/30"
          placeholder="Bio singkat"
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-white/15 py-2 text-xs font-bold uppercase tracking-widest text-white/70">
            Batal
          </button>
          <button
            onClick={submit}
            className="flex-1 rounded-lg py-2 text-xs font-black uppercase tracking-widest text-black"
            style={{ background: NEON }}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
