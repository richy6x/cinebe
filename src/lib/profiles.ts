export type Profile = {
  id: string;
  name: string;
  color: string;
  kids: boolean;
};

export type WatchEntry = {
  id: number;
  type: "movie" | "tv";
  title: string;
  poster: string | null;
  season?: number;
  episode?: number;
  updatedAt: number;
};

const PROFILES_KEY = "cinebe.profiles";
const ACTIVE_KEY = "cinebe.activeProfile";

export const AVATAR_COLORS = [
  "oklch(0.72 0.16 155)",
  "oklch(0.62 0.13 175)",
  "oklch(0.78 0.15 130)",
  "oklch(0.55 0.12 200)",
  "oklch(0.7 0.14 95)",
  "oklch(0.6 0.15 300)",
];

const isBrowser = () => typeof window !== "undefined";

export function loadProfiles(): Profile[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]") as Profile[];
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: Profile[]) {
  if (!isBrowser()) return;
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function getActiveProfileId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProfileId(id: string | null) {
  if (!isBrowser()) return;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
  window.dispatchEvent(new Event("cinebe:profile"));
}

export function createProfile(name: string, color: string, kids: boolean): Profile {
  const profile: Profile = {
    id: Math.random().toString(36).slice(2, 10),
    name,
    color,
    kids,
  };
  saveProfiles([...loadProfiles(), profile]);
  return profile;
}

export function deleteProfile(id: string) {
  saveProfiles(loadProfiles().filter((p) => p.id !== id));
  if (getActiveProfileId() === id) setActiveProfileId(null);
  if (isBrowser()) {
    localStorage.removeItem(`cinebe.watch.${id}`);
    localStorage.removeItem(`cinebe.list.${id}`);
  }
}

/* ---- per-profile continue watching ---- */

export function getContinue(profileId: string): WatchEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = JSON.parse(localStorage.getItem(`cinebe.watch.${profileId}`) || "[]");
    return (raw as WatchEntry[]).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function recordWatch(profileId: string, entry: Omit<WatchEntry, "updatedAt">) {
  if (!isBrowser()) return;
  const existing = getContinue(profileId).filter(
    (e) => !(e.id === entry.id && e.type === entry.type),
  );
  const next = [{ ...entry, updatedAt: Date.now() }, ...existing].slice(0, 20);
  localStorage.setItem(`cinebe.watch.${profileId}`, JSON.stringify(next));
  window.dispatchEvent(new Event("cinebe:watch"));
}

export function removeWatch(profileId: string, id: number, type: "movie" | "tv") {
  if (!isBrowser()) return;
  const next = getContinue(profileId).filter((e) => !(e.id === id && e.type === type));
  localStorage.setItem(`cinebe.watch.${profileId}`, JSON.stringify(next));
  window.dispatchEvent(new Event("cinebe:watch"));
}

/* ---- per-profile my list ---- */

export function getList(profileId: string): WatchEntry[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(`cinebe.list.${profileId}`) || "[]") as WatchEntry[];
  } catch {
    return [];
  }
}

export function toggleList(profileId: string, entry: Omit<WatchEntry, "updatedAt">) {
  if (!isBrowser()) return false;
  const current = getList(profileId);
  const exists = current.some((e) => e.id === entry.id && e.type === entry.type);
  const next = exists
    ? current.filter((e) => !(e.id === entry.id && e.type === entry.type))
    : [{ ...entry, updatedAt: Date.now() }, ...current];
  localStorage.setItem(`cinebe.list.${profileId}`, JSON.stringify(next));
  window.dispatchEvent(new Event("cinebe:list"));
  return !exists;
}
