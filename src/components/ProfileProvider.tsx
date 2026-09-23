import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  AVATAR_COLORS,
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
  const [adding, setAdding] = useState(profiles.length === 0);
  const [name, setName] = useState("");
  const [color, setColor] = useState(AVATAR_COLORS[0]!);
  const [kids, setKids] = useState(false);
  const [manage, setManage] = useState(false);

  const add = () => {
    if (!name.trim()) return;
    const created = createProfile(name.trim(), color, kids);
    onChange(loadProfiles());
    setName("");
    setKids(false);
    setAdding(false);
    onSelect(created.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-5 backdrop-blur-xl">
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Who&apos;s watching on <span className="accent-text">CINEBE</span>?
        </h1>

        <div className="mt-10 flex flex-wrap items-start justify-center gap-6">
          {profiles.map((p) => (
            <div key={p.id} className="group relative">
              <button
                onClick={() => onSelect(p.id)}
                className="flex w-24 flex-col items-center gap-3"
              >
                <span
                  className="flex size-24 items-center justify-center rounded-xl text-2xl font-semibold text-primary-foreground ring-2 ring-transparent transition-all group-hover:ring-primary"
                  style={{ background: p.color }}
                >
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="truncate text-sm text-muted-foreground group-hover:text-foreground">
                  {p.name}
                  {p.kids ? " · Kids" : ""}
                </span>
              </button>
              {manage && (
                <button
                  onClick={() => {
                    deleteProfile(p.id);
                    onChange(loadProfiles());
                  }}
                  className="absolute -right-2 -top-2 rounded-full border border-border bg-surface p-1.5 text-destructive"
                  aria-label={`Delete ${p.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}

          {!adding && profiles.length < 6 && (
            <button
              onClick={() => setAdding(true)}
              className="flex w-24 flex-col items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="flex size-24 items-center justify-center rounded-xl border border-dashed border-border bg-surface/60">
                <Plus className="size-8" />
              </span>
              <span className="text-sm">Add profile</span>
            </button>
          )}
        </div>

        {adding && (
          <div className="surface-panel mx-auto mt-10 max-w-sm rounded-xl p-5 text-left">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="e.g. Alex"
              className="mt-2 h-10 w-full rounded-md border border-border bg-background/60 px-3 text-sm outline-none focus:border-primary"
            />
            <div className="mt-4 flex gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label="Pick colour"
                  className={`size-8 rounded-full transition-transform ${
                    color === c ? "scale-110 ring-2 ring-primary" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={kids}
                onChange={(e) => setKids(e.target.checked)}
                className="size-4 accent-[oklch(0.72_0.16_158)]"
              />
              Kids profile
            </label>
            <div className="mt-5 flex gap-2">
              <button
                onClick={add}
                className="accent-gradient flex-1 rounded-md py-2 text-sm font-semibold text-primary-foreground"
              >
                Create
              </button>
              {profiles.length > 0 && (
                <button
                  onClick={() => setAdding(false)}
                  className="rounded-md border border-border px-4 text-sm text-muted-foreground"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-center gap-3">
          {profiles.length > 0 && (
            <button
              onClick={() => setManage((m) => !m)}
              className="rounded-full border border-border px-5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {manage ? "Done" : "Manage profiles"}
            </button>
          )}
          {canClose && (
            <button
              onClick={onClose}
              className="rounded-full border border-border px-5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
