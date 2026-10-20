import { createClient } from "@supabase/supabase-js";

export async function getPublishedSlugs(table: "deities" | "historical_figures" | "shrines") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const { data, error } = await createClient(url, key)
    .from(table)
    .select("slug")
    .eq("is_published", true);
  if (error) return [];
  return (data ?? []).map((record) => ({ slug: record.slug }));
}
