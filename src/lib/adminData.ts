import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ShrineDeityRole } from "@/lib/types";

export type PaginatedResult<T> = {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
};

export type AdminShrine = {
  id: string;
  name: string;
  reading: string | null;
  slug: string;
  prefecture_id: string | null;
  municipality_id: string | null;
  address: string | null;
  official_url: string | null;
  founding_description: string | null;
  history: string | null;
  name_origin: string | null;
  cultural_properties: string | null;
  access_info: string | null;
  parking_info: string | null;
  worship_hours: string | null;
  is_published: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

export type AdminDeity = {
  id: string;
  name: string;
  reading: string | null;
  aliases: string[];
  summary: string | null;
  mythology: string | null;
  divinity: string | null;
  slug: string;
  is_published: boolean;
};

export type AdminFigure = {
  id: string;
  name: string;
  reading: string | null;
  summary: string | null;
  deification_description: string | null;
  slug: string;
  is_published: boolean;
};

export type AdminLineage = {
  id: string;
  name: string;
  reading: string | null;
  description: string | null;
  slug: string;
  is_published: boolean;
};

export type AdminBenefit = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_published: boolean;
};

export type AdminSource = {
  id: string;
  name: string;
  url: string | null;
  source_type: string;
  last_verified_at: string;
  notes: string | null;
};

export type Prefecture = { id: string; name: string; slug: string };
export type Municipality = { id: string; prefecture_id: string; name: string };

export type AdminShrineDeity = {
  deity_id: string;
  role: ShrineDeityRole;
  display_order: number;
  deities: { id: string; name: string } | null;
};

export type AdminShrineFigure = {
  figure_id: string;
  description: string | null;
  historical_figures: { id: string; name: string } | null;
};

export type AdminShrineLineage = {
  lineage_id: string;
  lineages: { id: string; name: string } | null;
};

export type AdminShrineBenefit = {
  benefit_id: string;
  description: string | null;
  benefits: { id: string; name: string } | null;
};

export type AdminShrineSource = {
  source_id: string;
  field_name: string | null;
  sources: { id: string; name: string } | null;
};

export type AdminShrineImage = {
  id: string;
  image_url: string;
  alt_text: string;
  source_credit: string | null;
  display_order: number;
};

function mapAdminShrine(value: unknown): AdminShrine {
  const row = value as AdminShrine & { location?: unknown };
  let point = row.location;
  if (typeof point === "string") {
    try {
      point = JSON.parse(point);
    } catch {
      point = null;
    }
  }
  const coordinates =
    point && typeof point === "object" && "coordinates" in point && Array.isArray(point.coordinates)
      ? point.coordinates
      : [];
  const longitude = typeof row.longitude === "number" ? row.longitude : typeof coordinates[0] === "number" ? coordinates[0] : null;
  const latitude = typeof row.latitude === "number" ? row.latitude : typeof coordinates[1] === "number" ? coordinates[1] : null;
  return { ...row, latitude, longitude };
}

const DEFAULT_PAGE_SIZE = 20;

export function parseAdminPage(value?: string): number {
  const page = Number(value ?? "1");
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function clampAdminPage(page: number, count: number, pageSize: number): number {
  return Math.min(page, Math.max(1, Math.ceil(count / pageSize)));
}

function sanitizeSearch(q: string | null | undefined): string | undefined {
  if (!q) return undefined;
  const trimmed = q.trim().replace(/[,.*()\\%_"']/g, "").slice(0, 100);
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildOrIlikeFilter(columns: string[], search: string): string {
  const pattern = "%" + search + "%";
  return columns.map((column) => column + ".ilike." + pattern).join(",");
}

export async function getAdminShrines(
  page = 1,
  search?: string | null
): Promise<PaginatedResult<AdminShrine>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: [], count: 0, page, pageSize: DEFAULT_PAGE_SIZE };

  const q = sanitizeSearch(search);
  let query = supabase.from("shrines").select("*", { count: "exact" });
  if (q) {
    query = query.or(buildOrIlikeFilter(["name", "reading", "address"], q));
  }

  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;
  const { data, error, count } = await query.order("name", { ascending: true }).range(from, to);

  if (error) throw error;

  return {
    data: (data as AdminShrine[]) ?? [],
    count: count ?? 0,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export async function getAdminShrine(id: string): Promise<AdminShrine | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("shrines").select("*").eq("id", id).single();
  if (error) return null;
  return mapAdminShrine(data);
}

export async function getAdminShrineRelations(id: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const [deities, figures, lineages, benefits, sources, images] = await Promise.all([
    supabase
      .from("shrine_deities")
      .select("deity_id, role, display_order, deities ( id, name )")
      .eq("shrine_id", id)
      .order("display_order", { ascending: true }),
    supabase
      .from("shrine_figures")
      .select("figure_id, description, historical_figures ( id, name )")
      .eq("shrine_id", id),
    supabase
      .from("shrine_lineages")
      .select("lineage_id, lineages ( id, name )")
      .eq("shrine_id", id),
    supabase
      .from("shrine_benefits")
      .select("benefit_id, description, benefits ( id, name )")
      .eq("shrine_id", id),
    supabase
      .from("shrine_sources")
      .select("source_id, field_name, sources ( id, name )")
      .eq("shrine_id", id),
    supabase
      .from("shrine_images")
      .select("id, image_url, alt_text, source_credit, display_order")
      .eq("shrine_id", id)
      .order("display_order", { ascending: true }),
  ]);

  return {
    deities: (deities.data ?? []) as unknown as AdminShrineDeity[],
    figures: (figures.data ?? []) as unknown as AdminShrineFigure[],
    lineages: (lineages.data ?? []) as unknown as AdminShrineLineage[],
    benefits: (benefits.data ?? []) as unknown as AdminShrineBenefit[],
    sources: (sources.data ?? []) as unknown as AdminShrineSource[],
    images: (images.data ?? []) as AdminShrineImage[],
  };
}

export async function getAdminDeities(
  page = 1,
  search?: string | null
): Promise<PaginatedResult<AdminDeity>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: [], count: 0, page, pageSize: DEFAULT_PAGE_SIZE };

  const q = sanitizeSearch(search);
  let query = supabase.from("deities").select("*", { count: "exact" });
  if (q) {
    query = query.or(buildOrIlikeFilter(["name", "reading"], q));
  }

  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;
  const { data, error, count } = await query.order("name", { ascending: true }).range(from, to);

  if (error) throw error;
  return { data: (data as AdminDeity[]) ?? [], count: count ?? 0, page, pageSize: DEFAULT_PAGE_SIZE };
}

export async function getAdminDeity(id: string): Promise<AdminDeity | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("deities").select("*").eq("id", id).single();
  if (error) return null;
  return data as AdminDeity;
}

export async function getAdminFigures(
  page = 1,
  search?: string | null
): Promise<PaginatedResult<AdminFigure>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: [], count: 0, page, pageSize: DEFAULT_PAGE_SIZE };

  const q = sanitizeSearch(search);
  let query = supabase.from("historical_figures").select("*", { count: "exact" });
  if (q) {
    query = query.or(buildOrIlikeFilter(["name", "reading"], q));
  }

  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;
  const { data, error, count } = await query.order("name", { ascending: true }).range(from, to);

  if (error) throw error;
  return { data: (data as AdminFigure[]) ?? [], count: count ?? 0, page, pageSize: DEFAULT_PAGE_SIZE };
}

export async function getAdminFigure(id: string): Promise<AdminFigure | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("historical_figures").select("*").eq("id", id).single();
  if (error) return null;
  return data as AdminFigure;
}

export async function getAdminLineages(): Promise<AdminLineage[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("lineages").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data as AdminLineage[]) ?? [];
}

export async function getAdminLineagesPage(
  page = 1,
  search?: string | null
): Promise<PaginatedResult<AdminLineage>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: [], count: 0, page, pageSize: DEFAULT_PAGE_SIZE };

  const q = sanitizeSearch(search);
  let query = supabase.from("lineages").select("*", { count: "exact" });
  if (q) query = query.or(buildOrIlikeFilter(["name", "reading", "description"], q));

  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;
  const { data, error, count } = await query.order("name", { ascending: true }).range(from, to);
  if (error) throw error;
  return { data: (data as AdminLineage[]) ?? [], count: count ?? 0, page, pageSize: DEFAULT_PAGE_SIZE };
}

export async function getAdminLineage(id: string): Promise<AdminLineage | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("lineages").select("*").eq("id", id).single();
  if (error) return null;
  return data as AdminLineage;
}

export async function getAdminBenefits(): Promise<AdminBenefit[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("benefits").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data as AdminBenefit[]) ?? [];
}

export async function getAdminBenefitsPage(
  page = 1,
  search?: string | null
): Promise<PaginatedResult<AdminBenefit>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: [], count: 0, page, pageSize: DEFAULT_PAGE_SIZE };

  const q = sanitizeSearch(search);
  let query = supabase.from("benefits").select("*", { count: "exact" });
  if (q) query = query.or(buildOrIlikeFilter(["name", "description"], q));

  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;
  const { data, error, count } = await query.order("name", { ascending: true }).range(from, to);
  if (error) throw error;
  return { data: (data as AdminBenefit[]) ?? [], count: count ?? 0, page, pageSize: DEFAULT_PAGE_SIZE };
}

export async function getAdminBenefit(id: string): Promise<AdminBenefit | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("benefits").select("*").eq("id", id).single();
  if (error) return null;
  return data as AdminBenefit;
}

export async function getAdminSources(
  page = 1,
  search?: string | null
): Promise<PaginatedResult<AdminSource>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: [], count: 0, page, pageSize: DEFAULT_PAGE_SIZE };

  const q = sanitizeSearch(search);
  let query = supabase.from("sources").select("*", { count: "exact" });
  if (q) {
    query = query.or(buildOrIlikeFilter(["name", "url"], q));
  }

  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;
  const { data, error, count } = await query.order("name", { ascending: true }).range(from, to);

  if (error) throw error;
  return { data: (data as AdminSource[]) ?? [], count: count ?? 0, page, pageSize: DEFAULT_PAGE_SIZE };
}

export async function getAdminSource(id: string): Promise<AdminSource | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("sources").select("*").eq("id", id).single();
  if (error) return null;
  return data as AdminSource;
}

export async function getAdminDeityRelations(id: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const [lineages, benefits] = await Promise.all([
    supabase
      .from("deity_lineages")
      .select("lineage_id, lineages ( id, name )")
      .eq("deity_id", id),
    supabase
      .from("deity_benefits")
      .select("benefit_id, benefits ( id, name )")
      .eq("deity_id", id),
  ]);

  return {
    lineages: (lineages.data ?? []) as unknown as { lineage_id: string; lineages: { id: string; name: string } | null }[],
    benefits: (benefits.data ?? []) as unknown as { benefit_id: string; benefits: { id: string; name: string } | null }[],
  };
}

export async function getPrefectures(): Promise<Prefecture[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("prefectures").select("id, name, slug").order("name", { ascending: true });
  if (error) throw error;
  return (data as Prefecture[]) ?? [];
}

export async function getMunicipalities(prefectureId?: string): Promise<Municipality[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  let query = supabase.from("municipalities").select("id, prefecture_id, name").order("name", { ascending: true });
  if (prefectureId) {
    query = query.eq("prefecture_id", prefectureId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data as Municipality[]) ?? [];
}

export function getPageNumbers(currentPage: number, totalPages: number, maxVisible = 5): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxVisible + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
