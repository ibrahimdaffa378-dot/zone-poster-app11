import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const NEON = "#39FF7A";
const MY_PROFILE_KEY = "zone_my_profile_v1";
const MY_UPLOADS_KEY = "zone_my_uploads_v1";

export type MyProfileData = {
  name: string;
  bio: string;
  avatar: string;
};

type MyUpload = {
  id: string;
  title: string;
  hashtag: string;
  kind: "video" | "image";
  src: string;
  poster?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt: number;
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

function loadUploads(): MyUpload[] {
  try {
    const raw = localStorage.getItem(MY_UPLOADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MyUpload[];
    return Array.isArray(parsed) ? parsed.filter((u) => u && typeof u.src === "string" && !u.src.startsWith("blob:")) : [];
  } catch { return []; }
}

function saveUploads(list: MyUpload[]) {
  try {
    localStorage.setItem(MY_UPLOADS_KEY, JSON.stringify(list.filter((u) => !u.src.startsWith("blob:"))));
  } catch { /* ignore: quota */ }
}

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

const rnd = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));

export default function MyProfile({
  fallbackName,
  handle,
  seed,
  badge,
}: {
  fallbackName: string;
  handle: string;
  seed: string;
  badge?: React.ReactNode;
  myPosts?: { id: string; image: string; caption: string; likes: number }[];
}) {
  const [data, setData] = useState<MyProfileData>(() => loadMyProfile(fallbackName, seed));
  const [editing, setEditing] = useState(false);
  const [uploads, setUploads] = useState<MyUpload[]>(() => loadUploads());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);

  useEffect(() => { saveMyProfile(data); }, [data]);
  useEffect(() => { saveUploads(uploads); }, [uploads]);

  const followers = useMemo(() => 1240 + uploads.length * 137, [uploads.length]);
  const following = 182;
  const likes = useMemo(() => uploads.reduce((a, u) => a + u.likes, 0), [uploads]);

  const addUpload = useCallback((u: Omit<MyUpload, "id" | "views" | "likes" | "comments" | "shares" | "createdAt">) => {
    const item: MyUpload = {
      ...u,
      id: `up_${Date.now()}`,
      views: 1000,
      likes: rnd(180, 640),
      comments: rnd(20, 120),
      shares: rnd(10, 80),
      createdAt: Date.now(),
    };
    setUploads((prev) => [item, ...prev]);
    setUploadOpen(false);
  }, []);

  const toggleLike = useCallback((id: string) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, likes: u.likes + 1 } : u)));
  }, []);

  const bumpShare = useCallback((id: string) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, shares: u.shares + 1 } : u)));
  }, []);

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

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg px-6 py-2 text-xs font-black uppercase tracking-widest text-black transition hover:brightness-110"
            style={{ background: NEON, boxShadow: `0 0 14px ${NEON}55` }}
          >
            Edit Profil
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            aria-label="Unggah video atau foto"
            className="grid h-9 w-9 place-items-center rounded-lg border text-lg font-black leading-none transition hover:brightness-125"
            style={{ borderColor: `${NEON}66`, color: NEON, background: `${NEON}14`, boxShadow: `0 0 12px ${NEON}33` }}
          >
            +
          </button>
        </div>

        <p className="mt-3 max-w-sm whitespace-pre-wrap text-xs text-white/70">{data.bio}</p>
      </div>

      <div className="mt-5 border-t border-white/10 pt-1">
        <div className="mb-2 flex items-center gap-4 px-1 text-[11px] font-bold uppercase tracking-widest">
          <span style={{ color: NEON }}>Video</span>
          <span className="text-white/30">Disukai</span>
        </div>

        {uploads.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/15 px-4 py-10 text-center">
            <p className="text-xs text-white/50">Belum ada video. Unggah video pertamamu!</p>
            <button
              onClick={() => setUploadOpen(true)}
              className="rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-widest text-black"
              style={{ background: NEON }}
            >
              + Unggah
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {uploads.map((it, i) => (
              <button
                key={it.id}
                onClick={() => setPlaying(i)}
                className="relative aspect-[9/14] overflow-hidden rounded-md bg-white/5 text-left"
              >
                {it.kind === "image" ? (
                  <img src={it.src} alt={it.title} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <video src={it.src} poster={it.poster} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                )}
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[9px] font-bold text-white">
                  ▶ {compact(it.views)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {playing != null && uploads[playing] && (
        <TikTokPlayer
          item={uploads[playing]}
          handle={handle}
          avatar={data.avatar}
          onClose={() => setPlaying(null)}
          onLike={() => toggleLike(uploads[playing]!.id)}
          onShare={() => bumpShare(uploads[playing]!.id)}
        />
      )}

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onSubmit={addUpload} />}

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

function TikTokPlayer({
  item, handle, avatar, onClose, onLike, onShare,
}: {
  item: MyUpload;
  handle: string;
  avatar: string;
  onClose: () => void;
  onLike: () => void;
  onShare: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      {item.kind === "image" ? (
        <img src={item.src} alt={item.title} className="h-full w-full object-contain" />
      ) : (
        <video src={item.src} poster={item.poster} autoPlay loop playsInline controls={false} className="h-full w-full object-contain" />
      )}

      <button
        onClick={onClose}
        aria-label="Kembali"
        className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-lg text-white backdrop-blur"
      >
        ‹
      </button>

      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-5">
        <img src={avatar} alt="" className="h-10 w-10 rounded-full border-2 object-cover" style={{ borderColor: NEON, background: "#111" }} />
        <button
          onClick={() => { if (!liked) { setLiked(true); onLike(); } }}
          className="flex flex-col items-center text-white"
          aria-label="Suka"
        >
          <span className="text-2xl" style={{ color: liked ? "#ff2d55" : "#fff" }}>♥</span>
          <span className="text-[10px] font-bold">{compact(item.likes + (liked ? 1 : 0))}</span>
        </button>
        <button onClick={() => setShowComments((v) => !v)} className="flex flex-col items-center text-white" aria-label="Komentar">
          <span className="text-2xl">💬</span>
          <span className="text-[10px] font-bold">{compact(item.comments)}</span>
        </button>
        <button onClick={onShare} className="flex flex-col items-center text-white" aria-label="Bagikan">
          <span className="text-2xl">↪</span>
          <span className="text-[10px] font-bold">{compact(item.shares)}</span>
        </button>
      </div>

      <div className="absolute bottom-6 left-4 right-20">
        <p className="text-sm font-black text-white">@{handle}</p>
        <p className="mt-1 text-xs text-white/90">{item.title}</p>
        {item.hashtag && <p className="mt-1 text-xs font-bold" style={{ color: NEON }}>{item.hashtag}</p>}
        <p className="mt-1 text-[10px] text-white/50">{compact(item.views)} penonton</p>
      </div>

      {showComments && (
        <div className="absolute inset-x-0 bottom-0 max-h-[45%] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#0d0f0d] p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest">{compact(item.comments)} Komentar</p>
            <button onClick={() => setShowComments(false)} className="text-white/60">✕</button>
          </div>
          <p className="text-[11px] text-white/50">Komentar sedang ramai berdatangan… 🔥</p>
        </div>
      )}
    </div>
  );
}

function UploadModal({
  onClose, onSubmit,
}: {
  onClose: () => void;
  onSubmit: (u: { title: string; hashtag: string; kind: "video" | "image"; src: string; poster?: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [hashtag, setHashtag] = useState("#HDD");
  const [file, setFile] = useState<{ name: string; kind: "video" | "image"; src: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const kind: "video" | "image" = f.type.startsWith("video") ? "video" : "image";
    const reader = new FileReader();
    reader.onload = () => setFile({ name: f.name, kind, src: String(reader.result) });
    reader.readAsDataURL(f);
  };

  const submit = () => {
    const t = title.trim() || "Video baru";
    const tag = hashtag.trim().startsWith("#") || !hashtag.trim() ? hashtag.trim() : `#${hashtag.trim()}`;
    onSubmit({
      title: t,
      hashtag: tag,
      kind: file?.kind ?? "video",
      src: file?.src ?? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl border border-white/10 bg-[#0d0f0d] p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest">Unggah Video</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="video/*,image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="mb-4 flex w-full flex-col items-center gap-1 rounded-xl border border-dashed py-6 text-xs"
          style={{ borderColor: `${NEON}55`, color: NEON, background: `${NEON}0d` }}
        >
          <span className="text-2xl leading-none">+</span>
          {file ? <span className="px-3 text-center text-white/70">{file.name}</span> : <span>Pilih file video / foto</span>}
        </button>

        <label className="mb-1 block text-[10px] uppercase tracking-widest text-white/40">Judul Video</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm outline-none focus:border-white/30"
          placeholder="Judul videomu"
        />

        <label className="mb-1 block text-[10px] uppercase tracking-widest text-white/40">Hashtag</label>
        <input
          value={hashtag}
          onChange={(e) => setHashtag(e.target.value)}
          className="mb-4 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm outline-none focus:border-white/30"
          placeholder="#HDD #edit"
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
            Post
          </button>
        </div>
      </div>
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
