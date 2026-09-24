import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { getSeason, getTitle } from "@/lib/tmdb.functions";
import { PROVIDERS } from "@/lib/providers";
import { useProfile } from "@/components/ProfileProvider";
import { getResume, recordWatch, saveProgress } from "@/lib/profiles";

const titleQuery = (type: "movie" | "tv", id: number) =>
  queryOptions({ queryKey: ["title", type, id], queryFn: () => getTitle({ data: { type, id } }) });

export const Route = createFileRoute("/watch/$type/$id")({
  loader: ({ context, params }) => {
    const type = params.type === "tv" ? "tv" : "movie";
    const id = Number(params.id);
    if (!Number.isFinite(id)) throw notFound();
    return context.queryClient.ensureQueryData(titleQuery(type, id));
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Player — CINEBE" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `Watch ${loaderData.media.title} — CINEBE` },
        { name: "description", content: `Stream ${loaderData.media.title} on CINEBE.` },
        { property: "og:title", content: `Watch ${loaderData.media.title} — CINEBE` },
        {
          property: "og:description",
          content: `Stream ${loaderData.media.title} on CINEBE with multiple sources.`,
        },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-lg px-5 py-24 text-center" role="alert">
      <h1 className="text-xl font-semibold">The player didn&apos;t load</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <h1 className="text-xl font-semibold">Title not found</h1>
    </div>
  ),
  component: WatchPage,
});

function WatchPage() {
  const params = Route.useParams();
  const type = params.type === "tv" ? "tv" : "movie";
  const id = Number(params.id);
  const { data } = useSuspenseQuery(titleQuery(type, id));
  const { media, seasons } = data;
  const { profile } = useProfile();

  const [providerId, setProviderId] = useState(PROVIDERS[0]!.id);
  const [season, setSeason] = useState(seasons[0]?.season_number ?? 1);
  const [episode, setEpisode] = useState(1);
  const [startAt, setStartAt] = useState(0);
  const [ready, setReady] = useState(false);

  // Restore saved position/episode on first load
  useEffect(() => {
    if (!profile) {
      setReady(true);
      return;
    }
    const saved = getResume(profile.id, media.id, media.type);
    if (saved) {
      if (type === "tv" && saved.season) {
        setSeason(saved.season);
        setEpisode(saved.episode ?? 1);
      }
      if (saved.position) setStartAt(saved.position);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, media.id]);

  const seasonFn = useServerFn(getSeason);
  const { data: episodes } = useQuery({
    queryKey: ["season", id, season],
    queryFn: () => seasonFn({ data: { id, season } }),
    enabled: type === "tv",
  });

  useEffect(() => {
    if (!profile || !ready) return;
    recordWatch(profile.id, {
      id: media.id,
      type: media.type,
      title: media.title,
      poster: media.poster,
      ...(type === "tv" ? { season, episode } : {}),
    });
  }, [profile, ready, media.id, media.type, media.title, media.poster, type, season, episode]);

  // Listen for progress events from the player
  useEffect(() => {
    if (!profile) return;
    let last = 0;
    const onMsg = (ev: MessageEvent) => {
      let msg: unknown = ev.data;
      if (typeof msg === "string") {
        try {
          msg = JSON.parse(msg);
        } catch {
          return;
        }
      }
      if (!msg || typeof msg !== "object") return;
      const m = msg as Record<string, unknown>;
      const d = (m["data"] && typeof m["data"] === "object" ? m["data"] : m) as Record<string, unknown>;
      const t = Number(d["currentTime"] ?? d["time"] ?? d["position"]);
      const dur = Number(d["duration"] ?? 0);
      if (!Number.isFinite(t) || t <= 0) return;
      const now = Date.now();
      if (now - last < 4000 && d["event"] !== "pause" && d["event"] !== "ended") return;
      last = now;
      saveProgress(profile.id, media.id, media.type, t, Number.isFinite(dur) ? dur : 0);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [profile, media.id, media.type]);

  const provider = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0]!;
  const src =
    type === "tv" ? provider.tv(id, season, episode, startAt) : provider.movie(id, startAt);

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6 pb-24">
      <Link
        to="/title/$type/$id"
        params={{ type: media.type, id: String(media.id) }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to details
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
        {media.title}
        {type === "tv" && (
          <span className="ml-3 text-base font-normal text-muted-foreground">
            S{season} · E{episode}
          </span>
        )}
      </h1>

      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-black shadow-[var(--shadow-card)]">
        <div className="aspect-video w-full">
          <iframe
            key={src}
            src={src}
            title={`${media.title} player`}
            allowFullScreen
            referrerPolicy="origin"
            className="size-full"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Sources</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProviderId(p.id)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                p.id === providerId
                  ? "accent-gradient font-semibold text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          If a source won&apos;t play, switch to another one.
        </p>
      </div>

      {type === "tv" && seasons.length > 0 && (
        <div className="mt-10">
          <div className="flex flex-wrap items-center gap-2">
            {seasons.map((s) => (
              <button
                key={s.season_number}
                onClick={() => {
                  setSeason(s.season_number);
                  setEpisode(1);
                }}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  s.season_number === season
                    ? "border-primary text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {episodes?.map((e) => (
              <button
                key={e.episode_number}
                onClick={() => setEpisode(e.episode_number)}
                className={`surface-panel flex gap-3 rounded-lg p-3 text-left transition-colors ${
                  e.episode_number === episode ? "ring-1 ring-primary" : ""
                }`}
              >
                <div className="h-16 w-28 shrink-0 overflow-hidden rounded bg-surface-2">
                  {e.still && (
                    <img src={e.still} alt={e.name} className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {e.episode_number}. {e.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{e.overview}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
