import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Media } from "@/lib/tmdb.functions";

export function MediaCard({
  item,
  rank,
  caption,
  width = "w-[160px] sm:w-[180px]",
}: {
  item: Pick<Media, "id" | "type" | "title" | "poster"> & Partial<Media>;
  rank?: number;
  caption?: string;
  width?: string;
}) {
  return (
    <Link
      to="/title/$type/$id"
      params={{ type: item.type, id: String(item.id) }}
      className={`group relative ${width}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border/60 bg-surface shadow-[var(--shadow-card)]">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
            {item.title}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-x-0 bottom-0 translate-y-2 p-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="accent-gradient inline-flex rounded-full px-3 py-1 text-[11px] font-semibold text-primary-foreground">
            Watch now
          </span>
        </div>
        {rank !== undefined && (
          <span className="accent-gradient absolute left-2 top-2 rounded px-1.5 py-1 text-[10px] font-bold leading-none text-primary-foreground">
            TOP
            <br />
            {String(rank).padStart(2, "0")}
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-sm font-medium">{item.title}</p>
      <p className="truncate text-xs text-muted-foreground">
        {caption ?? (
          <>
            {item.rating ? (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3 fill-primary text-primary" />
                {item.rating}
              </span>
            ) : null}
            {item.year ? ` · ${item.year}` : ""} · {item.type === "tv" ? "TV" : "Movie"}
          </>
        )}
      </p>
    </Link>
  );
}
