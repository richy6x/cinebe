import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import { z } from "zod";
import { searchTitles, type Media } from "@/lib/tmdb.functions";

const Input = z.object({
  prompt: z.string().min(1).max(1000),
  recent: z.array(z.string()).max(30),
  kids: z.boolean(),
});

export const recommendTitles = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ items: (Media & { reason: string })[]; error?: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { items: [], error: "AI is not configured." };
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        system:
          "You are a film and TV recommender. Suggest exactly 10 real, existing movies or TV shows that fit the request. Give a one-sentence reason for each (max 25 words). Avoid titles the viewer already watched." +
          (data.kids ? " The viewer is a child: only family-friendly titles." : ""),
        prompt: `Request: ${data.prompt}\nRecently watched: ${data.recent.join(", ") || "nothing yet"}`,
        output: Output.object({
          schema: z.object({
            picks: z.array(
              z.object({
                title: z.string(),
                year: z.string().nullable(),
                type: z.enum(["movie", "tv"]),
                reason: z.string(),
              }),
            ),
          }),
        }),
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const out = await result.output;
      const found = await Promise.all(
        out.picks.slice(0, 10).map(async (p) => {
          const res = await searchTitles({ data: { query: p.title } }).catch(() => [] as Media[]);
          const match =
            res.find((r) => r.type === p.type && (!p.year || r.year === p.year)) ??
            res.find((r) => r.type === p.type) ??
            res[0];
          return match ? { ...match, reason: p.reason } : null;
        }),
      );
      const seen = new Set<string>();
      const items = found.filter((m): m is Media & { reason: string } => {
        if (!m) return false;
        const k = `${m.type}-${m.id}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      return { items };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      console.error("recommend failed", msg);
      if (msg.includes("402")) return { items: [], error: "AI credits have run out." };
      if (msg.includes("429")) return { items: [], error: "Too many requests — try again in a moment." };
      return { items: [], error: "Couldn't get recommendations right now." };
    }
  });
