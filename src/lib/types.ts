export type ShrineDeityRole = "principal" | "co_enshrined" | "enshrined" | "associated";

export const ROLE_LABELS: Record<ShrineDeityRole, string> = {
  principal: "主祭神",
  co_enshrined: "相殿神",
  enshrined: "配祀神",
  associated: "合祀神",
};

export type ShrineDeityRef = {
  id: string;
  name: string;
  reading: string;
  slug: string;
  role: ShrineDeityRole;
  roleLabel: string;
};

export type ShrineFigureRef = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type ShrineBenefitRef = {
  name: string;
  slug: string;
  description: string;
};

export type ShrineSourceRef = {
  name: string;
  url: string;
  verifiedAt: string;
  fieldName: string;
};

export type ShrineImageRef = {
  url: string;
  alt: string;
  credit: string;
};

export type Shrine = {
  id: string;
  slug: string;
  name: string;
  reading: string;
  prefecture: string;
  municipality: string;
  address: string;
  // 検索・モチーフ表示用のフラットな名称一覧(既存UIとの後方互換)
  deities: string[];
  lineages: string[];
  benefits: string[];
  latitude: number;
  longitude: number;
  history: string;
  founded: string;
  nameOrigin: string;
  culturalProperties: string;
  accessInfo: string;
  parkingInfo: string;
  worshipHours: string;
  officialUrl: string;
  deityRefs: ShrineDeityRef[];
  figureRefs: ShrineFigureRef[];
  benefitRefs: ShrineBenefitRef[];
  sources: ShrineSourceRef[];
  images: ShrineImageRef[];
  // 代表出典(既存UIとの後方互換)
  sourceName: string;
  sourceUrl: string;
  verifiedAt: string;
};

export type DeityRelationRef = {
  slug: string;
  name: string;
  relationType: string;
  note: string;
};

export type Deity = {
  id: string;
  slug: string;
  name: string;
  reading: string;
  aliases: string[];
  summary: string;
  mythology: string;
  divinity: string;
  relatedDeities: DeityRelationRef[];
  shrineSlugs: string[];
};

export type FigureShrineRef = {
  slug: string;
  name: string;
  description: string;
};

export type Figure = {
  id: string;
  slug: string;
  name: string;
  reading: string;
  summary: string;
  deificationDescription: string;
  shrineRefs: FigureShrineRef[];
};

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
