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
    id: "vidsrc",
    name: "VidSrc",
    movie: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "embedsu",
    name: "Embed.su",
    movie: (id) => `https://embed.su/embed/movie/${id}`,
    tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidsrcto",
    name: "VidSrc.to",
    movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    movie: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    tv: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
];
