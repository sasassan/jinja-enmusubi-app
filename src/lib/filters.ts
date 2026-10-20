import type { Shrine } from "@/lib/types";
import { haversineKm } from "@/lib/types";

// ShrineExplorer(検索)と /map(地図)の両方で使う検索条件の型・フィルタリングロジック。
// URL クエリパラメータへのエンコード/デコードも提供し、ページ間・共有リンクで検索条件を連動させる。

export type Filters = {
  deity: string | null;
  lineage: string | null;
  benefit: string | null;
  figure: string | null;
  prefecture: string | null;
  region: string | null;
};

export const REGION_GROUPS = [
  { name: "北海道・東北", prefectures: ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"] },
  { name: "関東", prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"] },
  { name: "中部", prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"] },
  { name: "近畿", prefectures: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] },
  { name: "中国", prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"] },
  { name: "四国", prefectures: ["徳島県", "香川県", "愛媛県", "高知県"] },
  { name: "九州・沖縄", prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"] },
] as const;

export function regionForPrefecture(prefecture: string): string | null {
  return REGION_GROUPS.find((region) => region.prefectures.some((name) => name === prefecture))?.name ?? null;
}

export const EMPTY_FILTERS: Filters = {
  deity: null,
  lineage: null,
  benefit: null,
  figure: null,
  prefecture: null,
  region: null,
};

export type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "granted"; lat: number; lng: number }
  | { status: "denied"; message: string };

export type ShrineWithDistance = { shrine: Shrine; distanceKm: number | null };

/** 現在地(あるいはnull)を基準に、全神社との距離を計算する。 */
export function withDistance(shrines: Shrine[], geo: GeoState): ShrineWithDistance[] {
  return shrines.map((s) => ({
    shrine: s,
    distanceKm: geo.status === "granted" ? haversineKm(geo.lat, geo.lng, s.latitude, s.longitude) : null,
  }));
}

/** キーワード・チップ絞り込み・半径絞り込みを適用し、現在地取得済みなら距離順に並べる。 */
export function filterShrines(
  shrinesWithDistance: ShrineWithDistance[],
  { query, filters, radiusKm, sortByDistance }: { query: string; filters: Filters; radiusKm: number | null; sortByDistance: boolean }
): ShrineWithDistance[] {
  const normalized = query.trim().toLowerCase();
  const filtered = shrinesWithDistance.filter(({ shrine, distanceKm }) => {
    const collection = [
      shrine.name,
      shrine.reading,
      shrine.prefecture,
      shrine.municipality,
      shrine.address,
      shrine.history,
      shrine.founded,
      shrine.nameOrigin,
      shrine.culturalProperties,
      ...shrine.deities,
      ...shrine.lineages,
      ...shrine.benefits,
      ...shrine.figureRefs.map((f) => f.name),
    ]
      .join(" ")
      .toLowerCase();

    if (normalized && !collection.includes(normalized)) return false;
    if (filters.deity && !shrine.deities.includes(filters.deity)) return false;
    if (filters.lineage && !shrine.lineages.includes(filters.lineage)) return false;
    if (filters.benefit && !shrine.benefits.includes(filters.benefit)) return false;
    if (filters.figure && !shrine.figureRefs.some((f) => f.name === filters.figure)) return false;
    if (filters.prefecture && shrine.prefecture !== filters.prefecture) return false;
    if (filters.region && regionForPrefecture(shrine.prefecture) !== filters.region) return false;
    if (radiusKm != null) {
      if (distanceKm == null || distanceKm > radiusKm) return false;
    }
    return true;
  });

  if (sortByDistance) {
    filtered.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }
  return filtered;
}

const FILTER_PARAM_KEYS: Record<keyof Filters, string> = {
  deity: "deity",
  lineage: "lineage",
  benefit: "benefit",
  figure: "figure",
  prefecture: "pref",
  region: "region",
};

/** 検索条件を URL クエリパラメータへエンコードする(ページ間の連動・共有リンク用)。 */
export function encodeFiltersToParams(params: URLSearchParams, opts: { query: string; filters: Filters; radiusKm: number | null }) {
  if (opts.query) params.set("q", opts.query);
  for (const key of Object.keys(FILTER_PARAM_KEYS) as (keyof Filters)[]) {
    const value = opts.filters[key];
    if (value) params.set(FILTER_PARAM_KEYS[key], value);
  }
  if (opts.radiusKm != null) params.set("radius", String(opts.radiusKm));
  return params;
}

/** URL クエリパラメータから検索条件を復元する。 */
export function decodeFiltersFromParams(params: URLSearchParams): { query: string; filters: Filters; radiusKm: number | null } {
  const filters: Filters = { ...EMPTY_FILTERS };
  for (const key of Object.keys(FILTER_PARAM_KEYS) as (keyof Filters)[]) {
    const value = params.get(FILTER_PARAM_KEYS[key]);
    if (value) filters[key] = value;
  }
  const radiusRaw = params.get("radius");
  const radiusKm = radiusRaw ? Number(radiusRaw) : null;
  return {
    query: params.get("q") ?? "",
    filters,
    radiusKm: radiusKm != null && !Number.isNaN(radiusKm) ? radiusKm : null,
  };
}
