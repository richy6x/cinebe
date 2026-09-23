import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Check, Play, Plus, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { getTitle } from "@/lib/tmdb.functions";
import { MediaCard } from "@/components/MediaCard";
import { Row } from "@/components/Row";
import { useProfile } from "@/components/ProfileProvider";
import { getList, toggleList } from "@/lib/profiles";

const titleQuery = (type: "movie" | "tv", id: number) =>
  queryOptions({ queryKey: ["title", type, id], queryFn: () => getTitle({ data: { type, id } }) });

export const Route = createFileRoute("/title/$type/$id")({
  loader: ({ context, params }) => {
    const type = params.type === "tv" ? "tv" : "movie";
    const id = Number(params.id);
    if (!Number.isFinite(id)) throw notFound();
    return context.queryClient.ensureQueryData(titleQuery(type, id));
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Unavailable — CINEBE" }, { name: "robots", content: "noindex" }],
      };
    }
    const { media } = loaderData;
    const desc = media.overview.slice(0, 160) || `Watch ${media.title} on CINEBE.`;
    return {
      meta: [
        { title: `${media.title} — CINEBE` },
        { name: "description", content: desc },
        { property: "og:title", content: `${media.title} — CINEBE` },
        { property: "og:description", content: desc },
        ...(media.backdrop
          ? [
              { property: "og:image", content: media.backdrop },
              { name: "twitter:image", content: media.backdrop },
            ]
          : []),
      ],
    };
  },
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-lg px-5 py-24 text-center" role="alert">
      <h1 className="text-xl font-semibold">This title didn&apos;t load</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <h1 className="text-xl font-semibold">Title not found</h1>
    </div>
  ),
  component: TitlePage,
});

function TitlePage() {
  const params = Route.useParams();
  const type = params.type === "tv" ? "tv" : "movie";
  const { data } = useSuspenseQuery(titleQuery(type, Number(params.id)));
  const { media, genres, cast, similar, tagline, runtime, seasons } = data;
  const { profile } = useProfile();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setSaved(getList(profile.id).some((e) => e.id === media.id && e.type === media.type));
  }, [profile, media.id, media.type]);

  return (
    <div className="pb-24">
      <div className="relative h-[52vh] min-h-[360px] w-full overflow-hidden">
        {media.backdrop && (
          <img
            src={media.backdrop}
            alt={media.title}
            className="absolute inset-0 size-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(0deg,oklch(0.1_0.012_165)_5%,transparent_70%)]" />
      </div>

      <div className="mx-auto -mt-40 max-w-[1600px] px-5">
        <div className="flex flex-col gap-8 md:flex-row">
          {media.poster && (
            <img
              src={media.poster}
              alt={media.title}
              className="w-40 shrink-0 rounded-xl border border-border shadow-[var(--shadow-card)] sm:w-52"
            />
          )}
          <div className="relative">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{media.title}</h1>
            {tagline && <p className="mt-2 text-sm italic text-muted-foreground">{tagline}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-foreground">
                <Star className="size-4 fill-primary text-primary" />
                {media.rating}
              </span>
              {media.year && <span>· {media.year}</span>}
              <span>· {media.type === "tv" ? "Series" : "Movie"}</span>
              {runtime ? <span>· {runtime} min</span> : null}
              {genres.length > 0 && <span>· {genres.join(", ")}</span>}
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {media.overview}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/watch/$type/$id"
                params={{ type: media.type, id: String(media.id) }}
                className="accent-gradient inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
              >
                <Play className="size-4 fill-primary-foreground" />
                Play
              </Link>
              <button
                onClick={() => {
                  if (!profile) return;
                  setSaved(
                    toggleList(profile.id, {
                      id: media.id,
                      type: media.type,
                      title: media.title,
                      poster: media.poster,
                    }),
                  );
                }}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface/70 px-6 py-3 text-sm font-semibold transition-colors hover:border-primary/60"
              >
                {saved ? <Check className="size-4" /> : <Plus className="size-4" />}
                {saved ? "In my list" : "My list"}
              </button>
            </div>

            {seasons.length > 0 && (
              <p className="mt-5 text-xs text-muted-foreground">
                {seasons.length} season{seasons.length > 1 ? "s" : ""} available
              </p>
            )}
          </div>
        </div>

        {cast.length > 0 && (
          <section className="mt-14">
            <h2 className="section-bar text-lg font-semibold">Cast</h2>
            <div className="row-scroll mt-4">
              {cast.map((c) => (
                <div key={c.name} className="w-28 text-center">
                  <div className="aspect-square overflow-hidden rounded-full border border-border bg-surface">
                    {c.photo ? (
                      <img src={c.photo} alt={c.name} className="size-full object-cover" />
                    ) : null}
                  </div>
                  <p className="mt-2 truncate text-xs font-medium">{c.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{c.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {similar.length > 0 && (
        <Row title="More like this">
          {similar.map((m) => (
            <MediaCard key={m.id} item={m} />
          ))}
        </Row>
      )}
    </div>
  );
}
