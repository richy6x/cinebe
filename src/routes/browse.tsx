import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { browseTitles, getGenres } from "@/lib/tmdb.functions";
import { MediaCard } from "@/components/MediaCard";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse — CINEBE" },
      {
        name: "description",
        content: "Browse every movie and series on CINEBE by type and genre.",
      },
      { property: "og:title", content: "Browse — CINEBE" },
      {
        property: "og:description",
        content: "Filter the full CINEBE catalogue by movies, series and genre.",
      },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const [type, setType] = useState<"movie" | "tv">("movie");
  const [genre, setGenre] = useState<string | undefined>(undefined);

  const genresFn = useServerFn(getGenres);
  const browseFn = useServerFn(browseTitles);

  const { data: genres } = useQuery({
    queryKey: ["genres", type],
    queryFn: () => genresFn({ data: { type } }),
  });
  const { data: items, isLoading } = useQuery({
    queryKey: ["browse", type, genre],
    queryFn: () => browseFn({ data: { type, ...(genre ? { genre } : {}) } }),
  });

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-10">
      <h1 className="section-bar text-2xl font-semibold">Browse</h1>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["movie", "tv"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t);
              setGenre(undefined);
            }}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              type === t
                ? "accent-gradient font-semibold text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "movie" ? "Movies" : "Series"}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setGenre(undefined)}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            genre === undefined
              ? "border-primary text-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All genres
        </button>
        {genres?.map((g) => (
          <button
            key={g.id}
            onClick={() => setGenre(String(g.id))}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              genre === String(g.id)
                ? "border-primary text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading titles…</p>}
      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {items?.map((m) => <MediaCard key={`${m.type}-${m.id}`} item={m} width="w-full" />)}
      </div>
    </div>
  );
}
