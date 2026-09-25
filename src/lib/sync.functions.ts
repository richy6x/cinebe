import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const codeSchema = z.string().regex(/^[A-Z0-9]{12}$/);
const dataSchema = z.record(z.string().max(100), z.string().max(200_000));

async function hash(code: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`cinebe:${code}`));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const createVault = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ data: dataSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
    const { error } = await supabaseAdmin
      .from("sync_vaults")
      .insert({ code_hash: await hash(code), data: data.data });
    if (error) throw new Error("Couldn't create a sync code. Try again.");
    return { code };
  });

export const pullVault = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: codeSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("sync_vaults")
      .select("data, updated_at")
      .eq("code_hash", await hash(data.code))
      .maybeSingle();
    if (!row) return { found: false as const };
    return { found: true as const, data: row.data as Record<string, string>, updatedAt: row.updated_at };
  });

export const pushVault = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: codeSchema, data: dataSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("sync_vaults")
      .update({ data: data.data, updated_at: new Date().toISOString() })
      .eq("code_hash", await hash(data.code))
      .select("updated_at")
      .maybeSingle();
    if (error || !row) return { ok: false as const };
    return { ok: true as const, updatedAt: row.updated_at };
  });
