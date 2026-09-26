export type Provider = {
  id: string;
  name: string;
  resumable?: boolean;
  movie: (id: number, start?: number) => string;
  tv: (id: number, season: number, episode: number, start?: number) => string;
};

const vk = (start?: number) =>
  `?color=34d399${start && start > 5 ? `&progress=${Math.floor(start)}` : ""}`;

export const PROVIDERS: Provider[] = [
  {
    id: "vidking",
    name: "Vidking",
    resumable: true,
    movie: (id, start) => `https://www.vidking.net/embed/movie/${id}${vk(start)}`,
    tv: (id, s, e, start) =>
      `https://www.vidking.net/embed/tv/${id}/${s}/${e}${vk(start)}&episodeSelector=false&nextEpisode=false`,
  },
  {
    id: "vidlink",
    name: "VidLink",
    movie: (id) => `https://vidlink.pro/movie/${id}?primaryColor=34d399`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=34d399`,
  },
  {
    id: "videasy",
    name: "Videasy",
    movie: (id) => `https://player.videasy.net/movie/${id}?color=34d399`,
    tv: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}?color=34d399`,
  },
  {
    id: "vidfast",
    name: "VidFast",
    movie: (id) => `https://vidfast.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidfast.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidsrc",
    name: "VidSrc",
    movie: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidsrcto",
    name: "VidSrc.to",
    movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidsrcxyz",
    name: "VidSrc.xyz",
    movie: (id) => `https://vidsrc.xyz/embed/movie?tmdb=${id}`,
    tv: (id, s, e) => `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: "vidsrcicu",
    name: "VidSrc.icu",
    movie: (id) => `https://vidsrc.icu/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "embedsu",
    name: "Embed.su",
    movie: (id) => `https://embed.su/embed/movie/${id}`,
    tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    movie: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    tv: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "multiembed",
    name: "MultiEmbed",
    movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: "2embed",
    name: "2Embed",
    movie: (id) => `https://www.2embed.cc/embed/${id}`,
    tv: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: "moviesapi",
    name: "MoviesAPI",
    movie: (id) => `https://moviesapi.club/movie/${id}`,
    tv: (id, s, e) => `https://moviesapi.club/tv/${id}-${s}-${e}`,
  },
  {
    id: "111movies",
    name: "111Movies",
    movie: (id) => `https://111movies.com/movie/${id}`,
    tv: (id, s, e) => `https://111movies.com/tv/${id}/${s}/${e}`,
  },
  {
    id: "smashy",
    name: "Smashy",
    movie: (id) => `https://player.smashy.stream/movie/${id}`,
    tv: (id, s, e) => `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`,
  },
];
