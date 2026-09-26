import { createFileRoute } from "@tanstack/react-router";
import { BrandPage, pageHead } from "@/components/BrandPage";

const faqs = [
  ["Is CINEBE free?", "Yes. There's no sign-up and no subscription."],
  ["A title won't play. What do I do?", "Pick a different source under the player. Each source is independent, so another one usually works."],
  ["Where are subtitles and quality settings?", "Inside the player itself. Each source has its own settings button; availability varies by source."],
  ["How do profiles work?", "Each profile has its own picture, username, list, history and continue-watching row. Use Manage profiles to edit or delete them."],
  ["Can I use my profiles on another device?", "Yes. On the Who's watching screen, tap Sync with another device, create a code, and enter it on the other device."],
  ["Does it remember where I stopped?", "Yes. Vidking resumes at the exact time; other sources remember the episode."],
  ["Are kids profiles safe?", "Kids profiles show family-friendly recommendations. We still recommend an adult keeps an eye on what's playing."],
];

export const Route = createFileRoute("/faq")({
  head: () => pageHead("FAQ — CINEBE", "Answers about playback, sources, profiles, syncing and kids profiles on CINEBE."),
  component: () => (
    <BrandPage eyebrow="Help" title="Questions, answered." intro="Everything you need to know about watching on CINEBE.">
      {faqs.map(([q, a]) => (
        <details key={q} className="surface-panel group rounded-xl p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold">
            {q}
            <span className="text-2xl text-primary transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
        </details>
      ))}
    </BrandPage>
  ),
});
