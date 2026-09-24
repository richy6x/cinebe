import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Info, Play, Star } from "lucide-react";
import { getHome } from "@/lib/tmdb.functions";
import { Row } from "@/components/Row";
import { MediaCard } from "@/components/MediaCard";
import { useProfile } from "@/components/ProfileProvider";
import { getContinue, type WatchEntry } from "@/lib/profiles";

const homeQuery = queryOptions({ queryKey: ["home"], queryFn: () => getHome() });

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  head: () => ({
    meta: [
      { title: "CINEBE — Stream movies and shows" },
      {
        name: "description",
        content:
          "CINEBE is a sleek streaming hub with Netflix-style profiles, trending films, top shows and multiple playback sources.",
      },
      { property: "og:title", content: "CINEBE — Stream movies and shows" },
      {
        property: "og:description",
        content: "Profiles, trending titles and multi-source playback in one dark, cinematic hub.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { profile } = useProfile();
  const [continueList, setContinueList] = useState<WatchEntry[]>([]);

  useEffect(() => {
    if (!profile) return;
    const sync = () => setContinueList(getContinue(profile.id));
    sync();
    window.addEventListener("cinebe:watch", sync);
    return () => window.removeEventListener("cinebe:watch", sync);
  }, [profile]);

  return (
    <div className="pb-24">
      <Hero items={data.hero} />

      {continueList.length > 0 && (
        <Row title="Continue watching">
          {continueList.map((e) => (
            <Link
              key={`${e.type}-${e.id}`}
              to="/watch/$type/$id"
              params={{ type: e.type, id: String(e.id) }}
              className="group relative w-[260px] shrink-0"
            >
              <div className="relative aspect-video overflow-hidden rounded-lg border border-border/60 bg-surface">
                {e.poster && (
                  <img src={e.poster} alt={e.title} loading="lazy" className="size-full object-cover object-top opacity-80 transition-transform duration-500 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-background/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="accent-gradient flex size-12 items-center justify-center rounded-full">
                    <Play className="size-5 fill-primary-foreground text-primary-foreground" />
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-muted/70">
                  <div
                    className="accent-gradient h-full"
                    style={{
                      width: `${e.position && e.duration ? Math.min(100, (e.position / e.duration) * 100) : 3}%`,
                    }}
                  />
                </div>
              </div>
              <p className="mt-2 truncate text-sm font-medium">{e.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {e.type === "tv" && e.season ? `S${e.season} · E${e.episode} · ` : ""}
                {e.position ? `Resume from ${Math.floor(e.position / 60)}m` : "Continue watching"}
              </p>
            </Link>
          ))}
        </Row>
      )}

      <Row
        title="Trending today"
        action={
          <Link to="/browse" className="text-xs text-muted-foreground hover:text-foreground">
            See all
          </Link>
        }
      >
        {data.trending.map((m, i) => (
          <MediaCard key={`${m.type}-${m.id}`} item={m} rank={i < 10 ? i + 1 : undefined} />
        ))}
      </Row>

      <Row title="Only on Netflix">
        {data.netflix.map((m) => (
          <MediaCard key={m.id} item={m} />
        ))}
      </Row>

      <Row title="Popular movies">
        {data.popularMovies.map((m) => (
          <MediaCard key={m.id} item={m} />
        ))}
      </Row>

      <Row title="Top rated series">
        {data.topTv.map((m) => (
          <MediaCard key={m.id} item={m} />
        ))}
      </Row>

      <Row title="Apple TV+ picks">
        {data.apple.map((m) => (
          <MediaCard key={m.id} item={m} />
        ))}
      </Row>
    </div>
  );
}

function Hero({ items }: { items: Awaited<ReturnType<typeof getHome>>["hero"] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 8000);
    return () => clearInterval(t);
  }, [items.length]);

  const item = items[index];
  if (!item) return null;

  return (
    <section className="relative h-[68vh] min-h-[460px] w-full overflow-hidden">
      {item.backdrop && (
        <img
          key={item.id}
          src={item.backdrop}
          alt={item.title}
          className="absolute inset-0 size-full object-cover object-center opacity-70 duration-1000 animate-in fade-in"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.1_0.012_165)_10%,transparent_75%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,oklch(0.1_0.012_165)_2%,transparent_55%)]" />

      <div className="relative mx-auto flex h-full max-w-[1600px] flex-col justify-center px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Trending this week
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
          {item.title}
        </h1>
        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-foreground">
            <Star className="size-4 fill-primary text-primary" />
            {item.rating}
          </span>
          <span>·</span>
          <span>{item.year}</span>
          <span>·</span>
          <span>{item.type === "tv" ? "TV" : "Movie"}</span>
        </div>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {item.overview}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to="/watch/$type/$id"
            params={{ type: item.type, id: String(item.id) }}
            className="accent-gradient inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            <Play className="size-4 fill-primary-foreground" />
            Play
          </Link>
          <Link
            to="/title/$type/$id"
            params={{ type: item.type, id: String(item.id) }}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface/70 px-6 py-3 text-sm font-semibold backdrop-blur transition-colors hover:border-primary/60"
          >
            <Info className="size-4" />
            See more
          </Link>
        </div>

        <div className="mt-10 flex gap-2">
          {items.map((h, i) => (
            <button
              key={h.id}
              onClick={() => setIndex(i)}
              aria-label={`Show ${h.title}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "accent-gradient w-8" : "w-2 bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
