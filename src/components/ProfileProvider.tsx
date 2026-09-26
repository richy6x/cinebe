import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { createVault, pullVault, pushVault } from "@/lib/sync.functions";
import {
  applySnapshot,
  formatCode,
  getSyncCode,
  normalizeCode,
  setSyncCode,
  snapshot,
} from "@/lib/sync";
import {
  AVATAR_COLORS,
  AVATAR_EMOJIS,
  updateProfile,
  createProfile,
  deleteProfile,
  getActiveProfileId,
  loadProfiles,
  setActiveProfileId,
  type Profile,
} from "@/lib/profiles";

type Ctx = {
  profile: Profile | null;
  switchProfile: () => void;
};

const ProfileCtx = createContext<Ctx>({ profile: null, switchProfile: () => {} });

export const useProfile = () => useContext(ProfileCtx);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    const list = loadProfiles();
    setProfiles(list);
    setActiveId(getActiveProfileId());
    setHydrated(true);
  }, []);

  // Cross-device sync via sync code
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let applying = false;
    const pull = async () => {
      const code = getSyncCode();
      if (!code) return;
      try {
        const res = await pullVault({ data: { code } });
        if (!res.found) return;
        applying = true;
        applySnapshot(res.data);
        applying = false;
        setProfiles(loadProfiles());
      } catch {
        applying = false;
      }
    };
    const schedulePush = () => {
      if (applying) return;
      const code = getSyncCode();
      if (!code) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        pushVault({ data: { code, data: snapshot() } }).catch(() => {});
      }, 1500);
    };
    const onProfiles = () => setProfiles(loadProfiles());
    const onFocus = () => {
      if (document.visibilityState === "visible") void pull();
    };
    void pull();
    const evs = ["cinebe:watch", "cinebe:list", "cinebe:history", "cinebe:profiles"];
    evs.forEach((e) => window.addEventListener(e, schedulePush));
    window.addEventListener("cinebe:profiles", onProfiles);
    window.addEventListener("cinebe:sync", pull);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearTimeout(timer);
      evs.forEach((e) => window.removeEventListener(e, schedulePush));
      window.removeEventListener("cinebe:profiles", onProfiles);
      window.removeEventListener("cinebe:sync", pull);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const profile = useMemo(
    () => profiles.find((p) => p.id === activeId) ?? null,
    [profiles, activeId],
  );

  const select = useCallback((id: string) => {
    setActiveProfileId(id);
    setActiveId(id);
    setPicking(false);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ profile, switchProfile: () => setPicking(true) }),
    [profile],
  );

  const gateOpen = hydrated && (!profile || picking);

  return (
    <ProfileCtx.Provider value={value}>
      {children}
      {gateOpen && (
        <ProfileGate
          profiles={profiles}
          onSelect={select}
          onChange={setProfiles}
          canClose={!!profile}
          onClose={() => setPicking(false)}
        />
      )}
    </ProfileCtx.Provider>
  );
}

function ProfileGate({
  profiles,
  onSelect,
  onChange,
  canClose,
  onClose,
}: {
  profiles: Profile[];
  onSelect: (id: string) => void;
  onChange: (p: Profile[]) => void;
  canClose: boolean;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<Profile | "new" | null>(profiles.length === 0 ? "new" : null);
  const [manage, setManage] = useState(false);

  if (editing) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 px-5 py-12 backdrop-blur-xl">
        <ProfileEditor
          initial={editing === "new" ? null : editing}
          canCancel={profiles.length > 0}
          onCancel={() => setEditing(null)}
          onDone={(id, isNew) => {
            onChange(loadProfiles());
            setEditing(null);
            if (isNew && id) onSelect(id);
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/95 px-5 py-12 backdrop-blur-xl">
      <div className="w-full max-w-4xl text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
          {manage ? "Manage profiles" : <>Who&apos;s watching?</>}
        </h1>

        <div className="mt-12 flex flex-wrap items-start justify-center gap-6 sm:gap-8">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => (manage ? setEditing(p) : onSelect(p.id))}
              className="group flex w-28 flex-col items-center gap-3 sm:w-36"
            >
              <span className="relative">
                <Avatar
                  profile={p}
                  className="size-28 rounded-2xl text-5xl ring-4 ring-transparent transition-all group-hover:scale-105 group-hover:ring-primary sm:size-36 sm:text-6xl"
                />
                {manage && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60">
                    <Pencil className="size-8" />
                  </span>
                )}
                {p.kids && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    Kids
                  </span>
                )}
              </span>
              <span className="w-full truncate font-display text-base font-semibold text-muted-foreground group-hover:text-foreground">
                {p.name}
              </span>
              {p.username && (
                <span className="-mt-2 w-full truncate text-xs text-muted-foreground/80">@{p.username}</span>
              )}
            </button>
          ))}

          {profiles.length < 6 && (
            <button
              onClick={() => setEditing("new")}
              className="group flex w-28 flex-col items-center gap-3 text-muted-foreground transition-colors hover:text-foreground sm:w-36"
            >
              <span className="flex size-28 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface/60 transition-all group-hover:border-primary sm:size-36">
                <Plus className="size-10" />
              </span>
              <span className="font-display text-base font-semibold">Add profile</span>
            </button>
          )}
        </div>

        <div className="mt-12 flex justify-center gap-3">
          {profiles.length > 0 && (
            <button
              onClick={() => setManage((m) => !m)}
              className={`rounded-md px-6 py-2.5 text-sm font-semibold uppercase tracking-widest transition-colors ${
                manage
                  ? "accent-gradient text-primary-foreground"
                  : "border border-muted-foreground/50 text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {manage ? "Done" : "Manage profiles"}
            </button>
          )}
          {canClose && !manage && (
            <button
              onClick={onClose}
              className="rounded-md border border-muted-foreground/50 px-6 py-2.5 text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
          )}
        </div>

        <SyncPanel />
      </div>
    </div>
  );
}

async function fileToAvatar(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });
  const size = 192;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const m = Math.min(img.width, img.height);
  ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.82);
}

function ProfileEditor({
  initial,
  canCancel,
  onCancel,
  onDone,
}: {
  initial: Profile | null;
  canCancel: boolean;
  onCancel: () => void;
  onDone: (id: string | null, isNew: boolean) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [color, setColor] = useState(initial?.color ?? AVATAR_COLORS[0]!);
  const [avatar, setAvatar] = useState<string | undefined>(initial?.avatar ?? AVATAR_EMOJIS[0]);
  const [kids, setKids] = useState(initial?.kids ?? false);
  const [autoplay, setAutoplay] = useState(initial?.autoplay ?? true);
  const [err, setErr] = useState("");

  const save = () => {
    if (!name.trim()) return setErr("Please enter a name.");
    const extra = {
      avatar,
      username: username.trim().replace(/^@/, "").toLowerCase() || undefined,
      tagline: tagline.trim() || undefined,
      autoplay,
    };
    if (initial) {
      updateProfile(initial.id, { ...extra, name: name.trim(), color, kids });
      onDone(initial.id, false);
    } else {
      const p = createProfile(name.trim(), color, kids, extra);
      onDone(p.id, true);
    }
  };

  const field =
    "mt-2 h-11 w-full rounded-md border border-border bg-background/60 px-3 text-sm outline-none focus:border-primary";

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        {initial ? "Edit profile" : "Add profile"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {initial ? "Update how this profile looks and behaves." : "Add a profile for another person watching CINEBE."}
      </p>

      <div className="mt-8 flex flex-col gap-8 border-y border-border py-8 sm:flex-row">
        <div className="flex flex-col items-center gap-3">
          <Avatar profile={{ name: name || "?", color, avatar }} className="size-32 rounded-2xl text-6xl" />
          <label className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-primary hover:underline">
            Upload photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setAvatar(await fileToAvatar(f));
              }}
            />
          </label>
        </div>

        <div className="flex-1 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Display name</label>
            <input autoFocus value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="Alex" className={field} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 mt-1 -translate-y-1/2 text-sm text-muted-foreground">@</span>
              <input
                value={username}
                maxLength={20}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                placeholder="alex_watches"
                className={`${field} pl-7`}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bio</label>
            <input value={tagline} maxLength={60} onChange={(e) => setTagline(e.target.value)} placeholder="Horror at midnight, comedies on Sunday" className={field} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Choose an icon</p>
            <div className="mt-3 grid grid-cols-8 gap-2">
              {AVATAR_EMOJIS.map((em) => (
                <button
                  key={em}
                  onClick={() => setAvatar(em)}
                  className={`flex aspect-square items-center justify-center rounded-lg text-2xl transition-transform hover:scale-110 ${
                    avatar === em ? "ring-2 ring-primary" : ""
                  }`}
                  style={{ background: color }}
                >
                  {em}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label="Pick colour"
                  className={`size-8 rounded-full transition-transform ${color === c ? "scale-110 ring-2 ring-foreground" : ""}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-5">
            <Toggle label="Kids profile" hint="Only family-friendly titles and picks." checked={kids} onChange={setKids} />
            <Toggle label="Autoplay previews" hint="Rotate the featured title on the home page." checked={autoplay} onChange={setAutoplay} />
          </div>
        </div>
      </div>

      {err && <p className="mt-4 text-sm text-destructive">{err}</p>}

      <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={save} className="accent-gradient rounded-md px-8 py-2.5 text-sm font-bold uppercase tracking-widest text-primary-foreground">
          Save
        </button>
        {canCancel && (
          <button onClick={onCancel} className="rounded-md border border-muted-foreground/50 px-8 py-2.5 text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        )}
        {initial && (
          <button
            onClick={() => {
              if (!confirm(`Delete ${initial.name}? Their history and list will be removed.`)) return;
              deleteProfile(initial.id);
              onDone(null, false);
            }}
            className="ml-auto flex items-center gap-2 rounded-md border border-destructive/50 px-5 py-2.5 text-sm font-semibold text-destructive"
          >
            <Trash2 className="size-4" /> Delete profile
          </button>
        )}
      </div>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 text-left">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-foreground transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function SyncPanel() {
  const [code, setCode] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setCode(getSyncCode()), []);

  const create = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await createVault({ data: { data: snapshot() } });
      setSyncCode(res.code);
      setCode(res.code);
    } catch {
      setMsg("Couldn't create a code. Try again.");
    }
    setBusy(false);
  };

  const link = async () => {
    const c = normalizeCode(input);
    if (c.length !== 12) return setMsg("Codes are 12 characters, like ABCD-EFGH-JKLM.");
    setBusy(true);
    setMsg("");
    try {
      const res = await pullVault({ data: { code: c } });
      if (!res.found) setMsg("That code wasn't found.");
      else {
        localStorage.setItem("cinebe.syncCode", c);
        applySnapshot(res.data);
        setSyncCode(c);
        setCode(c);
        setInput("");
      }
    } catch {
      setMsg("Something went wrong. Try again.");
    }
    setBusy(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-6 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {code ? "Synced across devices" : "Sync with another device"}
      </button>
    );
  }

  return (
    <div className="surface-panel mx-auto mt-6 max-w-sm rounded-xl p-5 text-left">
      {code ? (
        <>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Your sync code</p>
          <p className="mt-2 font-mono text-2xl tracking-widest text-primary">{formatCode(code)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Enter this on another device to share profiles, My List and history. Keep it private.
          </p>
          <button
            onClick={() => {
              setSyncCode(null);
              setCode(null);
            }}
            className="mt-4 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Stop syncing this device
          </button>
        </>
      ) : (
        <>
          <button
            onClick={create}
            disabled={busy}
            className="accent-gradient w-full rounded-md py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            Create a sync code
          </button>
          <p className="my-4 text-center text-xs text-muted-foreground">or enter one from another device</p>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && link()}
              placeholder="ABCD-EFGH-JKLM"
              className="h-10 flex-1 rounded-md border border-border bg-background/60 px-3 font-mono text-sm uppercase outline-none focus:border-primary"
            />
            <button
              onClick={link}
              disabled={busy}
              className="rounded-md border border-border px-4 text-sm hover:border-primary disabled:opacity-60"
            >
              Link
            </button>
          </div>
        </>
      )}
      {msg && <p className="mt-3 text-xs text-destructive">{msg}</p>}
      <button onClick={() => setOpen(false)} className="mt-4 text-xs text-muted-foreground hover:text-foreground">
        Close
      </button>
    </div>
  );
}
