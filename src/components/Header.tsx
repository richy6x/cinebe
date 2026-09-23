import { Link, useNavigate } from "@tanstack/react-router";
import { Play, Search } from "lucide-react";
import { useState } from "react";
import { useProfile } from "@/components/ProfileProvider";

export function Header() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { profile, switchProfile } = useProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="accent-gradient flex size-8 items-center justify-center rounded-full">
            <Play className="size-4 fill-primary-foreground text-primary-foreground" />
          </span>
          <span className="text-lg font-semibold tracking-tight">CINEBE</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground" }}
            className="transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <Link
            to="/browse"
            activeProps={{ className: "text-foreground" }}
            className="transition-colors hover:text-foreground"
          >
            Browse
          </Link>
          <Link
            to="/my-list"
            activeProps={{ className: "text-foreground" }}
            className="transition-colors hover:text-foreground"
          >
            My list
          </Link>
        </nav>

        <form
          className="ml-auto flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) navigate({ to: "/search", search: { q: query.trim() } });
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles"
              className="h-9 w-36 rounded-full border border-border bg-surface/70 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:w-56 focus:border-primary/60 sm:w-48"
            />
          </div>
        </form>

        <button
          onClick={switchProfile}
          className="flex items-center gap-2 rounded-full border border-border bg-surface/70 py-1 pl-1 pr-3 text-sm transition-colors hover:border-primary/60"
        >
          <span
            className="flex size-7 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground"
            style={{ background: profile?.color ?? "var(--primary)" }}
          >
            {profile?.name.slice(0, 1).toUpperCase() ?? "?"}
          </span>
          <span className="hidden sm:inline">{profile?.name ?? "Profile"}</span>
        </button>
      </div>
    </header>
  );
}
