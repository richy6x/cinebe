const CODE_KEY = "cinebe.syncCode";
const LOCAL_ONLY = new Set([CODE_KEY, "cinebe.activeProfile", "cinebe.syncAt"]);

export const normalizeCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "");
export const formatCode = (c: string) => c.match(/.{1,4}/g)?.join("-") ?? c;

export function getSyncCode() {
  return typeof window === "undefined" ? null : localStorage.getItem(CODE_KEY);
}
export function setSyncCode(code: string | null) {
  if (code) localStorage.setItem(CODE_KEY, code);
  else localStorage.removeItem(CODE_KEY);
  window.dispatchEvent(new Event("cinebe:sync"));
}

export function snapshot(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith("cinebe.") && !LOCAL_ONLY.has(k)) out[k] = localStorage.getItem(k)!;
  }
  return out;
}

export function applySnapshot(data: Record<string, string>) {
  const existing: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith("cinebe.") && !LOCAL_ONLY.has(k)) existing.push(k);
  }
  existing.forEach((k) => localStorage.removeItem(k));
  Object.entries(data).forEach(([k, v]) => {
    if (k.startsWith("cinebe.") && !LOCAL_ONLY.has(k)) localStorage.setItem(k, v);
  });
  window.dispatchEvent(new Event("cinebe:synced"));
}
