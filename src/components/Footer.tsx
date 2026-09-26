import { Link } from "@tanstack/react-router";

const links = [
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
] as const;

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        <Link to="/" className="font-display text-xl font-extrabold tracking-tight">
          CINE<span className="accent-text">BE</span>
        </Link>
        <nav className="flex flex-wrap justify-center gap-6 text-sm font-medium text-muted-foreground">
          {links.map((l) => (
            <Link key={l.to} to={l.to} activeProps={{ className: "text-primary" }} className="transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} CINEBE</p>
      </div>
    </footer>
  );
}
