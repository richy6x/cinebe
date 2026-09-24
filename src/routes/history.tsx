import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, Trash2, X } from "lucide-react";
import { useProfile } from "@/components/ProfileProvider";
import { clearHistory, getHistory, removeHistory, type WatchEntry } from "@/lib/profiles";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Viewing history — CINEBE" },
      { name: "description", content: "Everything this profile has watched on CINEBE." },
      { property: "og:title", content: "Viewing history — CINEBE" },
      { property: "og:description", content: "Revisit or remove titles from your CINEBE history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function fmt(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

function HistoryPage() {
  const { profile } = useProfile();
  const [items, setItems] = useState<WatchEntry[]>([]);

  useEffect(() => {
    if (!profile) return;
    const sync = () => setItems(getHistory(profile.id));
    sync();
    window.addEventListener("cinebe:history", sync);
    window.addEventListener("cinebe:watch", sync);
    return () => {
      window.removeEventListener("cinebe:history", sync);
      window.removeEventListener("cinebe:watch", sync);
    };
  }, [profile]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 pb-24">
      <div className="flex items-end justify-between gap-4">
        <h1 className="section-bar text-2xl font-semibold">
          {profile ? `${profile.name}'s history` : "Viewing history"}
        </h1>
        {items.length > 0 && profile && (
          <button
            onClick={() => confirm("Clear all viewing history?") && clearHistory(profile.id)}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="size-3.5" /> Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nothing watched yet on this profile.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((e) => {
            const pct = e.position && e.duration ? Math.min(100, (e.position / e.duration) * 100) : 0;
            return (
              <li
                key={`${e.type}-${e.id}`}
                className="surface-panel flex items-center gap-4 rounded-lg p-3"
              >
                <Link
                  to="/title/$type/$id"
                  params={{ type: e.type, id: String(e.id) }}
                  className="h-24 w-16 shrink-0 overflow-hidden rounded bg-surface-2"
                >
                  {e.poster && <img src={e.poster} alt={e.title} className="size-full object-cover" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/title/$type/$id"
                    params={{ type: e.type, id: String(e.id) }}
                    className="truncate font-medium hover:text-primary"
                  >
                    {e.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e.type === "tv" && e.season ? `S${e.season} · E${e.episode} · ` : ""}
                    {e.type === "tv" ? "TV" : "Movie"} · {new Date(e.updatedAt).toLocaleDateString()}
                    {e.position ? ` · stopped at ${fmt(e.position)}` : ""}
                  </p>
                  {pct > 0 && (
                    <div className="mt-2 h-1 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                      <div className="accent-gradient h-full" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
                <Link
                  to="/watch/$type/$id"
                  params={{ type: e.type, id: String(e.id) }}
                  className="accent-gradient inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-primary-foreground"
                >
                  <Play className="size-3.5 fill-primary-foreground" />
                  {e.position ? "Resume" : "Watch again"}
                </Link>
                <button
                  onClick={() => profile && removeHistory(profile.id, e.id, e.type)}
                  aria-label={`Remove ${e.title} from history`}
                  className="rounded-full p-2 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
