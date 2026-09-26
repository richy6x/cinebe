import { createFileRoute } from "@tanstack/react-router";
import { BrandPage, Block, pageHead } from "@/components/BrandPage";

export const Route = createFileRoute("/terms")({
  head: () => pageHead("Terms — CINEBE", "The terms for using CINEBE."),
  component: () => (
    <BrandPage eyebrow="Legal" title="Terms of use" intro="By using CINEBE you agree to these terms.">
      <Block title="The service">
        <p>CINEBE is an index of titles. It does not host video files; playback comes from independent third-party sources.</p>
      </Block>
      <Block title="Your responsibilities">
        <p>Use CINEBE lawfully and in line with the rules where you live. Keep your sync code private — anyone with it can view and change your profiles.</p>
      </Block>
      <Block title="No guarantees">
        <p>The service is provided as-is. Sources may be unavailable, and we're not responsible for third-party content or players.</p>
      </Block>
      <Block title="Changes">
        <p>We may update these terms. Continuing to use CINEBE means you accept the latest version.</p>
      </Block>
      <p className="text-xs text-muted-foreground">Last updated September 2026.</p>
    </BrandPage>
  ),
});
