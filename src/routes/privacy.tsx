import { createFileRoute } from "@tanstack/react-router";
import { BrandPage, Block, pageHead } from "@/components/BrandPage";

export const Route = createFileRoute("/privacy")({
  head: () => pageHead("Privacy — CINEBE", "How CINEBE handles your profiles, viewing history and sync data."),
  component: () => (
    <BrandPage eyebrow="Legal" title="Privacy policy" intro="Short version: no accounts, no ads tracking, and your data stays on your device unless you choose to sync.">
      <Block title="What we store">
        <p>Profiles (name, username, picture), My List, history and playback positions are saved in your browser on this device.</p>
      </Block>
      <Block title="Syncing">
        <p>If you create a sync code, a copy of that data is stored online so your other devices can fetch it. We only keep a scrambled version of the code. Stopping sync on a device stops it sending updates.</p>
      </Block>
      <Block title="Recommendations">
        <p>When you use For you, your request and recent titles are sent to an AI service to generate picks. They aren't linked to your identity.</p>
      </Block>
      <Block title="Third-party players">
        <p>Videos play from independent sources. Those sources have their own privacy practices, which we don't control.</p>
      </Block>
      <p className="text-xs text-muted-foreground">Last updated September 2026.</p>
    </BrandPage>
  ),
});
