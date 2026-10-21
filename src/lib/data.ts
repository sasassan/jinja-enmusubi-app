import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ROLE_LABELS } from "@/lib/types";
import type { Shrine, Deity, Figure, ShrineDeityRole } from "@/lib/types";

export type { Shrine, Deity, Figure };

type DiscoveryGroup = { label: string; value: string; items: string[] };

export type SiteData = {
  shrines: Shrine[];
  deities: Deity[];
  figures: Figure[];
  lineages: string[];
  benefits: string[];
  discoveryGroups: DiscoveryGroup[];
  // "db": Supabase から取得できた / "fallback": 取得できず静的データを使用
  source: "db" | "fallback";
};

type RawShrineRow = {
  id: string;
  name: string;
  reading: string | null;
  slug: string;
  address: string | null;
  history: string | null;
  founding_description: string | null;
  name_origin: string | null;
  cultural_properties: string | null;
  access_info: string | null;
  parking_info: string | null;
  worship_hours: string | null;
  official_url: string | null;
  latitude: number | null;
  longitude: number | null;
  prefectures: { name: string } | null;
  municipalities: { name: string } | null;
  shrine_deities:
    | { role: ShrineDeityRole; display_order: number; deities: { id: string; name: string; reading: string | null; slug: string } | null }[]
    | null;
  shrine_lineages: { lineages: { name: string } | null }[] | null;
  shrine_benefits: { description: string | null; benefits: { name: string; slug: string } | null }[] | null;
  shrine_figures: { description: string | null; historical_figures: { id: string; name: string; slug: string } | null }[] | null;
  shrine_sources: { field_name: string | null; sources: { name: string; url: string | null; last_verified_at: string } | null }[] | null;
  shrine_images: { image_url: string; alt_text: string; source_credit: string | null; display_order: number }[] | null;
};

type RawDeityRow = {
  id: string;
  name: string;
  reading: string | null;
  aliases: string[] | null;
  summary: string | null;
  mythology: string | null;
  divinity: string | null;
  slug: string;
};

type RawDeityRelationRow = {
  deity_id: string;
  related_deity_id: string;
  relation_type: string;
  note: string | null;
};

type RawFigureRow = {
  id: string;
  name: string;
  reading: string | null;
  summary: string | null;
  deification_description: string | null;
  slug: string;
};

function mapShrine(row: RawShrineRow): Shrine {

  const deityRefs = (row.shrine_deities ?? [])
    .filter((d) => d.deities)
    .sort((a, b) => a.display_order - b.display_order)
    .map((d) => ({
      id: d.deities!.id,
      name: d.deities!.name,
      reading: d.deities!.reading ?? "",
      slug: d.deities!.slug,
      role: d.role,
      roleLabel: ROLE_LABELS[d.role] ?? d.role,
    }));

  const figureRefs = (row.shrine_figures ?? [])
    .filter((f) => f.historical_figures)
    .map((f) => ({
      id: f.historical_figures!.id,
      name: f.historical_figures!.name,
      slug: f.historical_figures!.slug,
      description: f.description ?? "",
    }));

  const benefitRefs = (row.shrine_benefits ?? [])
    .filter((b) => b.benefits)
    .map((b) => ({ name: b.benefits!.name, slug: b.benefits!.slug, description: b.description ?? "" }));

  const sources = (row.shrine_sources ?? [])
    .filter((s) => s.sources)
    .map((s) => ({
      name: s.sources!.name,
      url: s.sources!.url ?? "",
      verifiedAt: s.sources!.last_verified_at,
      fieldName: s.field_name ?? "",
    }));

  const images = (row.shrine_images ?? []).map((i) => ({
    url: i.image_url,
    alt: i.alt_text,
    credit: i.source_credit ?? "",
  }));

  const primarySource = sources[0];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    reading: row.reading ?? "",
    prefecture: row.prefectures?.name ?? "",
    municipality: row.municipalities?.name ?? "",
    address: row.address ?? "",
    deities: deityRefs.map((d) => d.name),
    lineages: (row.shrine_lineages ?? []).map((l) => l.lineages?.name).filter((v): v is string => Boolean(v)),
    benefits: benefitRefs.map((b) => b.name),
    latitude: row.latitude,
    longitude: row.longitude,
    history: row.history ?? "",
    founded: row.founding_description ?? "",
    nameOrigin: row.name_origin ?? "",
    culturalProperties: row.cultural_properties ?? "",
    accessInfo: row.access_info ?? "",
    parkingInfo: row.parking_info ?? "",
    worshipHours: row.worship_hours ?? "",
    officialUrl: row.official_url ?? "",
    deityRefs,
    figureRefs,
    benefitRefs,
    sources,
    images,
    sourceName: primarySource?.name ?? "",
    sourceUrl: primarySource?.url ?? "",
    verifiedAt: primarySource?.verifiedAt ?? "",
  };
}

function buildDiscoveryGroups(shrines: Shrine[]): DiscoveryGroup[] {
  const unique = (values: string[]) => Array.from(new Set(values)).filter(Boolean).sort((a, b) => a.localeCompare(b, "ja"));
  return [
    { label: "神様から探す", value: "deity", items: unique(shrines.flatMap((s) => s.deities)) },
    { label: "御利益から探す", value: "benefit", items: unique(shrines.flatMap((s) => s.benefits)) },
    { label: "信仰系統から探す", value: "lineage", items: unique(shrines.flatMap((s) => s.lineages)) },
  ];
}

type PageResult<T> = { data: T[] | null; error: { message: string } | null };

async function fetchAllPages<T>(
  loadPage: (from: number, to: number) => Promise<PageResult<T>>,
): Promise<T[]> {
  const pageSize = 500;
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await loadPage(from, from + pageSize - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

function fallback(): SiteData {
  return {
    shrines: [],
    deities: [],
    figures: [],
    lineages: [],
    benefits: [],
    discoveryGroups: [],
    source: "fallback",
  };
}

/**
 * 神社・神様・人物などサイト全体のデータを Supabase から取得する。
 * DB に未接続・エラー・0件の場合は空のデータを返し、画面側で読み込みエラー/空状態を表示する。
 */
export async function getSiteData(): Promise<SiteData> {
  let supabase;
  try {
    supabase = getSupabaseBrowserClient();
  } catch {
    return fallback();
  }

  try {
    const [shrineRows, deityRows, relationRows, figureRows] = await Promise.all([
      fetchAllPages<RawShrineRow>(async (from, to) => {
        const response = await supabase
          .from("shrines")
          .select(
            `id, name, reading, slug, address, history, founding_description, name_origin, cultural_properties,
             access_info, parking_info, worship_hours, official_url, latitude, longitude,
             prefectures ( name ),
             municipalities ( name ),
             shrine_deities ( role, display_order, deities ( id, name, reading, slug ) ),
             shrine_lineages ( lineages ( name ) ),
             shrine_benefits ( description, benefits ( name, slug ) ),
             shrine_figures ( description, historical_figures ( id, name, slug ) ),
             shrine_sources ( field_name, sources ( name, url, last_verified_at ) ),
             shrine_images ( image_url, alt_text, source_credit, display_order )`
          )
          .eq("is_published", true)
          .order("name", { ascending: true })
          .range(from, to);
        return { data: response.data as unknown as RawShrineRow[] | null, error: response.error };
      }),
      fetchAllPages<RawDeityRow>(async (from, to) => {
        const response = await supabase
          .from("deities")
          .select("id, name, reading, aliases, summary, mythology, divinity, slug")
          .eq("is_published", true)
          .order("name", { ascending: true })
          .range(from, to);
        return { data: response.data as unknown as RawDeityRow[] | null, error: response.error };
      }),
      fetchAllPages<RawDeityRelationRow>(async (from, to) => {
        const response = await supabase
          .from("deity_relations")
          .select("deity_id, related_deity_id, relation_type, note")
          .range(from, to);
        return { data: response.data as unknown as RawDeityRelationRow[] | null, error: response.error };
      }),
      fetchAllPages<RawFigureRow>(async (from, to) => {
        const response = await supabase
          .from("historical_figures")
          .select("id, name, reading, summary, deification_description, slug")
          .eq("is_published", true)
          .order("name", { ascending: true })
          .range(from, to);
        return { data: response.data as unknown as RawFigureRow[] | null, error: response.error };
      }),
    ]);

    const shrines = shrineRows.map(mapShrine);

    if (shrines.length === 0) return fallback();

    const deityById = new Map(deityRows.map((d) => [d.id, d]));

    // 神様ごとに、祀られている神社のスラッグ一覧を構築(神社詳細から逆引き)
    const shrineSlugsByDeitySlug = new Map<string, string[]>();
    for (const shrine of shrines) {
      for (const ref of shrine.deityRefs) {
        const list = shrineSlugsByDeitySlug.get(ref.slug) ?? [];
        list.push(shrine.slug);
        shrineSlugsByDeitySlug.set(ref.slug, list);
      }
    }

    const deities: Deity[] = deityRows.map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      reading: d.reading ?? "",
      aliases: d.aliases ?? [],
      summary: d.summary ?? "",
      mythology: d.mythology ?? "",
      divinity: d.divinity ?? "",
      relatedDeities: relationRows
        .filter((r) => r.deity_id === d.id)
        .map((r) => {
          const related = deityById.get(r.related_deity_id);
          return related
            ? { slug: related.slug, name: related.name, relationType: r.relation_type, note: r.note ?? "" }
            : null;
        })
        .filter((v): v is Deity["relatedDeities"][number] => v !== null),
      shrineSlugs: shrineSlugsByDeitySlug.get(d.slug) ?? [],
    }));

    // 人物ごとに、関連する神社の一覧を構築(shrine_figures から逆引き)
    const shrineRefsByFigureSlug = new Map<string, Figure["shrineRefs"]>();
    for (const shrine of shrines) {
      for (const ref of shrine.figureRefs) {
        const list = shrineRefsByFigureSlug.get(ref.slug) ?? [];
        list.push({ slug: shrine.slug, name: shrine.name, description: ref.description });
        shrineRefsByFigureSlug.set(ref.slug, list);
      }
    }

    const figures: Figure[] = figureRows.map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      reading: f.reading ?? "",
      summary: f.summary ?? "",
      deificationDescription: f.deification_description ?? "",
      shrineRefs: shrineRefsByFigureSlug.get(f.slug) ?? [],
    }));

    return {
      shrines,
      deities,
      figures,
      lineages: Array.from(new Set(shrines.flatMap((s) => s.lineages))).sort(),
      benefits: Array.from(new Set(shrines.flatMap((s) => s.benefits))).sort(),
      discoveryGroups: buildDiscoveryGroups(shrines),
      source: "db",
    };
  } catch {
    return fallback();
  }
}
