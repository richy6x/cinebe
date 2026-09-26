import { createFileRoute } from "@tanstack/react-router";
import { BrandPage, Block, pageHead } from "@/components/BrandPage";

export const Route = createFileRoute("/about")({
  head: () => pageHead("About — CINEBE", "What CINEBE is and why we built it: one sleek place to find and watch movies and shows."),
  component: () => (
    <BrandPage eyebrow="About" title="Movie night, simplified." intro="CINEBE is one sleek place to discover movies and series, keep track of what you're watching, and share it across the whole household.">
      <Block title="What we do">
        <p>We gather title info, artwork and ratings so you can browse, search and pick something fast. Playback comes from many independent sources, so if one doesn't work, another usually will.</p>
      </Block>
      <Block title="Made for households">
        <p>Everyone gets their own profile with a picture, username, list and history. Kids profiles keep things family-friendly, and a sync code carries it all to your other devices.</p>
      </Block>
      <Block title="Smart picks">
        <p>Not sure what to watch? Tell the For you page what you're in the mood for and get tailored recommendations.</p>
      </Block>
    </BrandPage>
  ),
});
