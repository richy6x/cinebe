import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { searchTitles } from "@/lib/tmdb.functions";
import { MediaCard } from "@/components/MediaCard";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({ q: String(search["q"] ?? "") }),
  head: () => ({
    meta: [
      { title: "Search — CINEBE" },
      { name: "description", content: "Search movies and shows across the CINEBE catalogue." },
      { property: "og:title", content: "Search — CINEBE" },
      { property: "og:description", content: "Find any movie or series to stream on CINEBE." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const search = useServerFn(searchTitles);
  const { data, isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: () => search({ data: { query: q } }),
    enabled: q.length > 0,
  });

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-10">
      <h1 className="section-bar text-2xl font-semibold">
        {q ? `Results for “${q}”` : "Search CINEBE"}
      </h1>
      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Searching…</p>}
      {data && data.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">Nothing matched that search.</p>
      )}
      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {data?.map((m) => <MediaCard key={`${m.type}-${m.id}`} item={m} width="w-full" />)}
      </div>
    </div>
  );
}
