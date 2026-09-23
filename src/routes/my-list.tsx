import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MediaCard } from "@/components/MediaCard";
import { useProfile } from "@/components/ProfileProvider";
import { getList, type WatchEntry } from "@/lib/profiles";

export const Route = createFileRoute("/my-list")({
  head: () => ({
    meta: [
      { title: "My list — CINEBE" },
      { name: "description", content: "Titles you saved to watch later on CINEBE." },
      { property: "og:title", content: "My list — CINEBE" },
      { property: "og:description", content: "Your saved movies and series on CINEBE." },
    ],
  }),
  component: MyList,
});

function MyList() {
  const { profile } = useProfile();
  const [items, setItems] = useState<WatchEntry[]>([]);

  useEffect(() => {
    if (!profile) return;
    const sync = () => setItems(getList(profile.id));
    sync();
    window.addEventListener("cinebe:list", sync);
    return () => window.removeEventListener("cinebe:list", sync);
  }, [profile]);

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-10">
      <h1 className="section-bar text-2xl font-semibold">My list</h1>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Nothing saved yet — add titles from any detail page.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {items.map((e) => (
            <MediaCard
              key={`${e.type}-${e.id}`}
              width="w-full"
              item={{ id: e.id, type: e.type, title: e.title, poster: e.poster }}
              caption={e.type === "tv" ? "TV" : "Movie"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
