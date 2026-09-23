import { createServerFn } from "@tanstack/react-start";

const BASE = "https://api.themoviedb.org/3";

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env["TMDB_API_KEY"];
  if (!key) throw new Error("TMDB_API_KEY is not configured");
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", key);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB request failed (${res.status})`);
  return (await res.json()) as T;
}

export type Media = {
  id: number;
  type: "movie" | "tv";
  title: string;
  poster: string | null;
  backdrop: string | null;
  rating: number;
  year: string;
  overview: string;
};

type RawItem = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
};

const img = (p: string | null | undefined, size: string) =>
  p ? `https://image.tmdb.org/t/p/${size}${p}` : null;

function normalize(raw: RawItem, fallbackType: "movie" | "tv" = "movie"): Media {
  const type = (raw.media_type === "tv" || raw.media_type === "movie"
    ? raw.media_type
    : fallbackType) as "movie" | "tv";
  const date = raw.release_date || raw.first_air_date || "";
  return {
    id: raw.id,
    type,
    title: raw.title || raw.name || "Untitled",
    poster: img(raw.poster_path, "w500"),
    backdrop: img(raw.backdrop_path, "w1280"),
    rating: Math.round((raw.vote_average ?? 0) * 10) / 10,
    year: date ? date.slice(0, 4) : "",
    overview: raw.overview || "",
  };
}

const list = (d: { results?: RawItem[] }, t: "movie" | "tv" = "movie") =>
  (d.results ?? []).filter((r) => r.poster_path || r.backdrop_path).map((r) => normalize(r, t));

export const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const [week, day, popularMovies, topTv, netflix, apple] = await Promise.all([
    tmdb<{ results: RawItem[] }>("/trending/all/week"),
    tmdb<{ results: RawItem[] }>("/trending/all/day"),
    tmdb<{ results: RawItem[] }>("/movie/popular"),
    tmdb<{ results: RawItem[] }>("/tv/top_rated"),
    tmdb<{ results: RawItem[] }>("/discover/tv", { with_networks: "213", sort_by: "popularity.desc" }),
    tmdb<{ results: RawItem[] }>("/discover/tv", { with_networks: "2552", sort_by: "popularity.desc" }),
  ]);

  return {
    hero: list(week).filter((m) => m.backdrop).slice(0, 6),
    trending: list(day).slice(0, 18),
    popularMovies: list(popularMovies, "movie").slice(0, 18),
    topTv: list(topTv, "tv").slice(0, 18),
    netflix: list(netflix, "tv").slice(0, 18),
    apple: list(apple, "tv").slice(0, 18),
  };
});

export type Season = { season_number: number; name: string; episode_count: number };
export type Episode = {
  episode_number: number;
  name: string;
  overview: string;
  still: string | null;
  runtime: number | null;
};

export const getTitle = createServerFn({ method: "GET" })
  .inputValidator((d: { type: "movie" | "tv"; id: number }) => d)
  .handler(async ({ data }) => {
    const raw = await tmdb<
      RawItem & {
        genres?: { id: number; name: string }[];
        runtime?: number;
        tagline?: string;
        seasons?: { season_number: number; name: string; episode_count: number }[];
        similar?: { results: RawItem[] };
        credits?: { cast?: { name: string; character: string; profile_path: string | null }[] };
      }
    >(`/${data.type}/${data.id}`, { append_to_response: "credits,similar" });

    return {
      media: normalize(raw, data.type),
      tagline: raw.tagline || "",
      runtime: raw.runtime ?? null,
      genres: (raw.genres ?? []).map((g) => g.name),
      seasons: (raw.seasons ?? []).filter((s) => s.season_number > 0),
      cast: (raw.credits?.cast ?? []).slice(0, 12).map((c) => ({
        name: c.name,
        character: c.character,
        photo: img(c.profile_path, "w185"),
      })),
      similar: list(raw.similar ?? { results: [] }, data.type).slice(0, 12),
    };
  });

export const getSeason = createServerFn({ method: "GET" })
  .inputValidator((d: { id: number; season: number }) => d)
  .handler(async ({ data }) => {
    const raw = await tmdb<{
      episodes?: {
        episode_number: number;
        name: string;
        overview: string;
        still_path: string | null;
        runtime: number | null;
      }[];
    }>(`/tv/${data.id}/season/${data.season}`);
    return (raw.episodes ?? []).map((e) => ({
      episode_number: e.episode_number,
      name: e.name,
      overview: e.overview,
      still: img(e.still_path, "w300"),
      runtime: e.runtime,
    }));
  });

export const searchTitles = createServerFn({ method: "GET" })
  .inputValidator((d: { query: string }) => d)
  .handler(async ({ data }) => {
    if (!data.query.trim()) return [];
    const raw = await tmdb<{ results: RawItem[] }>("/search/multi", { query: data.query });
    return (raw.results ?? [])
      .filter((r) => r.media_type === "movie" || r.media_type === "tv")
      .filter((r) => r.poster_path)
      .map((r) => normalize(r));
  });

export const browseTitles = createServerFn({ method: "GET" })
  .inputValidator((d: { type: "movie" | "tv"; genre?: string; page?: number }) => d)
  .handler(async ({ data }) => {
    const params: Record<string, string> = {
      sort_by: "popularity.desc",
      page: String(data.page ?? 1),
    };
    if (data.genre) params["with_genres"] = data.genre;
    const raw = await tmdb<{ results: RawItem[] }>(`/discover/${data.type}`, params);
    return list(raw, data.type);
  });

export const getGenres = createServerFn({ method: "GET" })
  .inputValidator((d: { type: "movie" | "tv" }) => d)
  .handler(async ({ data }) => {
    const raw = await tmdb<{ genres: { id: number; name: string }[] }>(`/genre/${data.type}/list`);
    return raw.genres;
  });
