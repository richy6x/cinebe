import type { ReactNode } from "react";

export function BrandPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">{eyebrow}</p>
      <h1 className="mt-3 text-5xl sm:text-6xl">{title}</h1>
      <p className="mt-5 text-lg text-muted-foreground">{intro}</p>
      <div className="mt-12 space-y-6">{children}</div>
    </div>
  );
}

export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="surface-panel rounded-xl p-6">
      <h2 className="text-xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export const pageHead = (title: string, description: string) => ({
  meta: [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
