import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { recommendTitles } from "@/lib/recommend.functions";
import { MediaCard } from "@/components/MediaCard";
import { useProfile } from "@/components/ProfileProvider";
import { getHistory } from "@/lib/profiles";
import type { Media } from "@/lib/tmdb.functions";

export const Route = createFileRoute("/for-you")({
  head: () => ({
    meta: [
      { title: "For you — AI picks on CINEBE" },
      { name: "description", content: "Describe your mood and get personalised movie and show picks." },
      { property: "og:title", content: "For you — AI picks on CINEBE" },
      { property: "og:description", content: "Tell CINEBE what you feel like watching and get tailored picks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForYou,
});

const IDEAS = [
  "A slow-burn sci-fi mystery",
  "Feel-good comedy for a lazy Sunday",
  "Dark crime series like Breaking Bad",
  "Mind-bending thriller with a twist",
];

function ForYou() {
  const { profile } = useProfile();
  const recommend = useServerFn(recommendTitles);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<(Media & { reason: string })[]>([]);

  const run = async (text: string) => {
    if (!text.trim() || loading) return;
    setPrompt(text);
    setLoading(true);
    setError(null);
    try {
      const recent = profile ? getHistory(profile.id).slice(0, 20).map((h) => h.title) : [];
      const res = await recommend({ data: { prompt: text, recent, kids: !!profile?.kids } });
      setItems(res.items);
      if (res.error) setError(res.error);
      else if (!res.items.length) setError("No matches found — try describing it differently.");
    } catch {
      setError("Couldn't get recommendations right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-10 pb-24">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          AI picks
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          What are you in the mood for{profile ? `, ${profile.name}` : ""}?
        </h1>
        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(prompt);
          }}
        >
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={1000}
            placeholder="e.g. a cosy mystery set in a small town"
            className="h-12 flex-1 rounded-md border border-border bg-surface/70 px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
          />
          <button
            disabled={loading}
            className="accent-gradient inline-flex items-center gap-2 rounded-md px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Find
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {IDEAS.map((i) => (
            <button
              key={i}
              onClick={() => run(i)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-8 text-sm text-destructive">{error}</p>}
      {loading && <p className="mt-8 text-sm text-muted-foreground">Finding titles for you…</p>}

      {items.length > 0 && !loading && (
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((m) => (
            <div key={`${m.type}-${m.id}`}>
              <MediaCard item={m} width="w-full" />
              <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{m.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
