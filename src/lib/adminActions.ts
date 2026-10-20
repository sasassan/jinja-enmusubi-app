import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isAdminBrowser } from "@/lib/admin-browser";
import type { ShrineDeityRole } from "@/lib/types";

function slugify(input: string): string {
  const slug = input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
  return slug || `record-${globalThis.crypto.randomUUID()}`;
}

const SOURCE_TYPES = ["official_site", "shrine_association", "government", "publication", "other"] as const;

type ActionResult = { success: true; id?: string } | { success: false; error: string };

function safeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validSourceType(value: string): boolean {
  return SOURCE_TYPES.includes(value as (typeof SOURCE_TYPES)[number]);
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  if (year < 1) return false;

  const parsed = new Date(0);
  parsed.setUTCFullYear(year, month - 1, day);
  parsed.setUTCHours(0, 0, 0, 0);
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function validCoordinates(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}

function getCoordinates(formData: FormData): { latitude: number | null; longitude: number | null } | null {
  const latitudeValue = String(formData.get("latitude") ?? "").trim();
  const longitudeValue = String(formData.get("longitude") ?? "").trim();
  if (!latitudeValue && !longitudeValue) return { latitude: null, longitude: null };
  if (!latitudeValue || !longitudeValue) return null;

  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  if (!validCoordinates(latitude, longitude)) return null;
  return { latitude, longitude };
}

async function guardAdmin(): Promise<ActionResult | null> {
  const admin = await isAdminBrowser();
  if (!admin) return { success: false, error: "管理者権限がありません。" };
  return null;
}

// ── Shrine ─────────────────────────────────────────────────────────

export async function createShrine(formData: FormData): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { success: false, error: "神社名は必須です。" };

  const slug = slugify(String(formData.get("slug") ?? "").trim() || name);
  const prefectureId = String(formData.get("prefecture_id") ?? "").trim() || null;
  const municipalityId = String(formData.get("municipality_id") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const officialUrlInput = String(formData.get("official_url") ?? "").trim();
  if (officialUrlInput && !safeHttpUrl(officialUrlInput)) return { success: false, error: "公式URLは http または https を指定してください。" };
  const officialUrl = officialUrlInput || null;
  const foundingDescription = String(formData.get("founding_description") ?? "").trim() || null;
  const history = String(formData.get("history") ?? "").trim() || null;
  const nameOrigin = String(formData.get("name_origin") ?? "").trim() || null;
  const culturalProperties = String(formData.get("cultural_properties") ?? "").trim() || null;
  const accessInfo = String(formData.get("access_info") ?? "").trim() || null;
  const parkingInfo = String(formData.get("parking_info") ?? "").trim() || null;
  const worshipHours = String(formData.get("worship_hours") ?? "").trim() || null;
  const isPublished = formData.get("is_published") === "on";
  const coordinates = getCoordinates(formData);
  if (!coordinates) return { success: false, error: "緯度・経度は両方入力し、範囲内の値を指定してください。" };

  const { data, error } = await supabase
    .from("shrines")
    .insert({
      name,
      slug,
      prefecture_id: prefectureId,
      municipality_id: municipalityId,
      address,
      official_url: officialUrl,
      founding_description: foundingDescription,
      history,
      name_origin: nameOrigin,
      cultural_properties: culturalProperties,
      access_info: accessInfo,
      parking_info: parkingInfo,
      worship_hours: worshipHours,
      is_published: isPublished,
      location: coordinates.latitude !== null && coordinates.longitude !== null
        ? `POINT(${coordinates.longitude} ${coordinates.latitude})`
        : null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, id: data.id };
}

export async function updateShrine(id: string, formData: FormData): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { success: false, error: "神社名は必須です。" };

  const slug = slugify(String(formData.get("slug") ?? "").trim() || name);
  const prefectureId = String(formData.get("prefecture_id") ?? "").trim() || null;
  const municipalityId = String(formData.get("municipality_id") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const officialUrlInput = String(formData.get("official_url") ?? "").trim();
  if (officialUrlInput && !safeHttpUrl(officialUrlInput)) return { success: false, error: "公式URLは http または https を指定してください。" };
  const officialUrl = officialUrlInput || null;
  const foundingDescription = String(formData.get("founding_description") ?? "").trim() || null;
  const history = String(formData.get("history") ?? "").trim() || null;
  const nameOrigin = String(formData.get("name_origin") ?? "").trim() || null;
  const culturalProperties = String(formData.get("cultural_properties") ?? "").trim() || null;
  const accessInfo = String(formData.get("access_info") ?? "").trim() || null;
  const parkingInfo = String(formData.get("parking_info") ?? "").trim() || null;
  const worshipHours = String(formData.get("worship_hours") ?? "").trim() || null;
  const isPublished = formData.get("is_published") === "on";
  const coordinates = getCoordinates(formData);
  if (!coordinates) return { success: false, error: "緯度・経度は両方入力し、範囲内の値を指定してください。" };

  const { error } = await supabase
    .from("shrines")
    .update({
      name,
      slug,
      prefecture_id: prefectureId,
      municipality_id: municipalityId,
      address,
      official_url: officialUrl,
      founding_description: foundingDescription,
      history,
      name_origin: nameOrigin,
      cultural_properties: culturalProperties,
      access_info: accessInfo,
      parking_info: parkingInfo,
      worship_hours: worshipHours,
      is_published: isPublished,
      location: coordinates.latitude !== null && coordinates.longitude !== null
        ? `POINT(${coordinates.longitude} ${coordinates.latitude})`
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteShrine(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase.from("shrines").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Shrine relations ───────────────────────────────────────────────

export async function addShrineDeity(
  shrineId: string,
  deityId: string,
  role: ShrineDeityRole,
  displayOrder: number
): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase.from("shrine_deities").insert({
    shrine_id: shrineId,
    deity_id: deityId,
    role,
    display_order: displayOrder,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeShrineDeity(shrineId: string, deityId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase
    .from("shrine_deities")
    .delete()
    .eq("shrine_id", shrineId)
    .eq("deity_id", deityId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addShrineFigure(
  shrineId: string,
  figureId: string,
  description: string
): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase.from("shrine_figures").insert({
    shrine_id: shrineId,
    figure_id: figureId,
    description: description.trim() || null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeShrineFigure(shrineId: string, figureId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase
    .from("shrine_figures")
    .delete()
    .eq("shrine_id", shrineId)
    .eq("figure_id", figureId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addShrineLineage(shrineId: string, lineageId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase.from("shrine_lineages").insert({ shrine_id: shrineId, lineage_id: lineageId });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeShrineLineage(shrineId: string, lineageId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase
    .from("shrine_lineages")
    .delete()
    .eq("shrine_id", shrineId)
    .eq("lineage_id", lineageId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addShrineBenefit(
  shrineId: string,
  benefitId: string,
  description: string
): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase.from("shrine_benefits").insert({
    shrine_id: shrineId,
    benefit_id: benefitId,
    description: description.trim() || null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeShrineBenefit(shrineId: string, benefitId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase
    .from("shrine_benefits")
    .delete()
    .eq("shrine_id", shrineId)
    .eq("benefit_id", benefitId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addShrineSource(
  shrineId: string,
  sourceId: string,
  fieldName: string
): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase.from("shrine_sources").insert({
    shrine_id: shrineId,
    source_id: sourceId,
    field_name: fieldName.trim() || null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeShrineSource(shrineId: string, sourceId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase
    .from("shrine_sources")
    .delete()
    .eq("shrine_id", shrineId)
    .eq("source_id", sourceId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addShrineImage(
  shrineId: string,
  imageUrl: string,
  altText: string,
  sourceCredit: string,
  displayOrder: number
): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  if (!safeHttpUrl(imageUrl)) return { success: false, error: "写真URLは http または https を指定してください。" };

  const { error } = await supabase.from("shrine_images").insert({
    shrine_id: shrineId,
    image_url: imageUrl.trim(),
    alt_text: altText.trim(),
    source_credit: sourceCredit.trim() || null,
    display_order: displayOrder,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeShrineImage(shrineId: string, imageId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase.from("shrine_images").delete().eq("id", imageId).eq("shrine_id", shrineId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Deity relations (系統・御利益) ─────────────────────────────────

export async function addDeityLineage(deityId: string, lineageId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase.from("deity_lineages").insert({
    deity_id: deityId,
    lineage_id: lineageId,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeDeityLineage(deityId: string, lineageId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase
    .from("deity_lineages")
    .delete()
    .eq("deity_id", deityId)
    .eq("lineage_id", lineageId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addDeityBenefit(deityId: string, benefitId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase.from("deity_benefits").insert({
    deity_id: deityId,
    benefit_id: benefitId,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeDeityBenefit(deityId: string, benefitId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase
    .from("deity_benefits")
    .delete()
    .eq("deity_id", deityId)
    .eq("benefit_id", benefitId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Generic entity CRUD helpers ────────────────────────────────────

type EntityTable =
  | "deities"
  | "historical_figures"
  | "lineages"
  | "benefits"
  | "sources";

const ENTITY_TABLES: readonly EntityTable[] = ["deities", "historical_figures", "lineages", "benefits", "sources"];

function isEntityTable(table: string): table is EntityTable {
  return ENTITY_TABLES.includes(table as EntityTable);
}

export async function createEntity(
  table: EntityTable,
  formData: FormData
): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;
  if (!isEntityTable(table)) return { success: false, error: "対象のデータ種別が正しくありません。" };

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { success: false, error: "名称は必須です。" };

  const payload: Record<string, unknown> = {
    name,
  };

  if (table !== "sources") {
    payload.slug = slugify(String(formData.get("slug") ?? "").trim() || name);
    payload.is_published = formData.get("is_published") === "on";
  }

  if (table === "sources") {
    const sourceUrl = String(formData.get("url") ?? "").trim();
    if (sourceUrl && !safeHttpUrl(sourceUrl)) return { success: false, error: "情報源URLは http または https を指定してください。" };
    const sourceType = String(formData.get("source_type") ?? "").trim();
    if (!validSourceType(sourceType)) return { success: false, error: "情報源の種別を選択してください。" };
    const lastVerifiedAt = String(formData.get("last_verified_at") ?? "").trim() || new Date().toISOString().slice(0, 10);
    if (!validDate(lastVerifiedAt)) return { success: false, error: "確認日は正しい日付を指定してください。" };
    payload.url = sourceUrl || null;
    payload.source_type = sourceType;
    payload.last_verified_at = lastVerifiedAt;
  }

  if (formData.has("reading")) payload.reading = String(formData.get("reading") ?? "").trim() || null;
  if (formData.has("aliases")) {
    const raw = String(formData.get("aliases") ?? "").trim();
    payload.aliases = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }
  if (formData.has("summary")) payload.summary = String(formData.get("summary") ?? "").trim() || null;
  if (formData.has("mythology")) payload.mythology = String(formData.get("mythology") ?? "").trim() || null;
  if (formData.has("divinity")) payload.divinity = String(formData.get("divinity") ?? "").trim() || null;
  if (formData.has("deification_description"))
    payload.deification_description = String(formData.get("deification_description") ?? "").trim() || null;
  if (formData.has("description")) payload.description = String(formData.get("description") ?? "").trim() || null;
  if (formData.has("notes")) payload.notes = String(formData.get("notes") ?? "").trim() || null;

  const { data, error } = await supabase.from(table).insert(payload).select("id").single();
  if (error) return { success: false, error: error.message };
  return { success: true, id: data.id };
}

export async function updateEntity(
  table: EntityTable,
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;
  if (!isEntityTable(table)) return { success: false, error: "対象のデータ種別が正しくありません。" };

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { success: false, error: "名称は必須です。" };

  const payload: Record<string, unknown> = {
    name,
  };

  if (table !== "sources") {
    payload.slug = slugify(String(formData.get("slug") ?? "").trim() || name);
    payload.is_published = formData.get("is_published") === "on";
  }

  if (table === "deities" || table === "historical_figures") {
    payload.updated_at = new Date().toISOString();
  }

  if (table === "sources") {
    const sourceUrl = String(formData.get("url") ?? "").trim();
    if (sourceUrl && !safeHttpUrl(sourceUrl)) return { success: false, error: "情報源URLは http または https を指定してください。" };
    const sourceType = String(formData.get("source_type") ?? "").trim();
    if (!validSourceType(sourceType)) return { success: false, error: "情報源の種別を選択してください。" };
    const lastVerifiedAt = String(formData.get("last_verified_at") ?? "").trim() || new Date().toISOString().slice(0, 10);
    if (!validDate(lastVerifiedAt)) return { success: false, error: "確認日は正しい日付を指定してください。" };
    payload.url = sourceUrl || null;
    payload.source_type = sourceType;
    payload.last_verified_at = lastVerifiedAt;
  }

  if (formData.has("reading")) payload.reading = String(formData.get("reading") ?? "").trim() || null;
  if (formData.has("aliases")) {
    const raw = String(formData.get("aliases") ?? "").trim();
    payload.aliases = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }
  if (formData.has("summary")) payload.summary = String(formData.get("summary") ?? "").trim() || null;
  if (formData.has("mythology")) payload.mythology = String(formData.get("mythology") ?? "").trim() || null;
  if (formData.has("divinity")) payload.divinity = String(formData.get("divinity") ?? "").trim() || null;
  if (formData.has("deification_description"))
    payload.deification_description = String(formData.get("deification_description") ?? "").trim() || null;
  if (formData.has("description")) payload.description = String(formData.get("description") ?? "").trim() || null;
  if (formData.has("notes")) payload.notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase.from(table).update(payload).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteEntity(table: EntityTable, id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;
  if (!isEntityTable(table)) return { success: false, error: "対象のデータ種別が正しくありません。" };

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "DB接続がありません。" };

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
