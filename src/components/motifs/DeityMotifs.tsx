/**
 * 神様・縁結びモチーフ — SVG コンポーネント集
 *
 * 外部画像に依存せず、currentColor で着色できる線画/シルエットとして実装。
 * 将来、生成AI等で描いた実イラストに差し替える場合は、同名コンポーネントの
 * 内部実装（<svg>）だけを画像/イラストに置き換えれば呼び出し側は変更不要。
 *
 * 効能・ご利益を断定する表現は使わず、モチーフ名は「信仰の系統・伝承」を
 * 示す記号として扱う（AI倫理ガード方針を維持）。
 */
import type { ReactElement, SVGProps } from "react";

export type MotifKey =
  | "izumo"      // 出雲・大国主系 — 縁結びの結び紐
  | "enmusubi"   // 縁結び全般 — 赤い糸
  | "gakumon"    // 天神信仰 — 梅と鶯（菅原道真公）
  | "inari"      // 稲荷信仰 — 狐と宝珠
  | "gion"       // 祇園・素盞嗚系 — 勾玉と八重
  | "sumiyoshi"  // 住吉・海上安全系 — 波と松
  | "torii";     // 汎用フォールバック — 鳥居

type MotifProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** 汎用フォールバック: 鳥居のシルエット */
export function ToriiMotif(props: MotifProps) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <path d="M6 14 L42 14" strokeWidth={2.2} />
      <path d="M4 10 L44 10" strokeWidth={2.6} />
      <path d="M13 10 C13 8 14.5 7 17 7 L31 7 C33.5 7 35 8 35 10" />
      <path d="M12 14 L10 40" />
      <path d="M36 14 L38 40" />
      <path d="M17 22 L31 22" strokeWidth={1.4} />
    </svg>
  );
}

/** 出雲・大国主系: 縄と紙垂（しめ縄）で「結び」を表現 */
export function IzumoMotif(props: MotifProps) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <path d="M6 16 C6 22 12 22 12 16 C12 10 18 10 18 16 C18 22 24 22 24 16 C24 10 30 10 30 16 C30 22 36 22 36 16 C36 10 42 10 42 16" />
      <path d="M12 16 L12 24 L9 30" strokeWidth={1.3} />
      <path d="M24 16 L24 24 L21 30" strokeWidth={1.3} />
      <path d="M36 16 L36 24 L33 30" strokeWidth={1.3} />
      <path d="M12 24 L15 30" strokeWidth={1.3} />
      <path d="M24 24 L27 30" strokeWidth={1.3} />
      <path d="M36 24 L39 30" strokeWidth={1.3} />
    </svg>
  );
}

/** 縁結び全般: 結ばれた赤い糸のモチーフ（輪と結び目） */
export function EnmusubiMotif(props: MotifProps) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <path d="M16 30 C6 30 6 14 16 14 C24 14 24 24 30 24" />
      <path d="M32 18 C42 18 42 34 32 34 C24 34 24 24 18 24" />
      <circle cx="24" cy="24" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** 天神信仰: 梅の花と鶯（菅原道真公にちなむ「飛梅」の伝承） */
export function GakumonMotif(props: MotifProps) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <path d="M8 40 C8 24 16 16 16 16" strokeWidth={1.8} />
      <path d="M16 22 L22 18" strokeWidth={1.4} />
      <path d="M14 30 L21 27" strokeWidth={1.4} />
      {[0, 72, 144, 216, 288].map((deg) => (
        <path
          key={deg}
          d="M30 12 C31.6 9.6 34.4 9.6 34.5 12 C34.6 14 32.4 15.4 30 15.4 C27.6 15.4 25.4 14 25.5 12 C25.6 9.6 28.4 9.6 30 12 Z"
          transform={`rotate(${deg} 30 12)`}
        />
      ))}
      <circle cx="30" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M36 30 C36 27 38.5 25 41 26 C41 28.5 39.5 30.5 37 31 Z" />
      <circle cx="38.4" cy="27.6" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** 稲荷信仰: 狐と宝珠（お稲荷様の使いとされる伝承） */
export function InariMotif(props: MotifProps) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <path d="M24 36 C15 36 11 30 12 23 C9 21 8 16 10 12 C13 13 15 15 16 18 C19 16.5 21.5 16 24 16 C26.5 16 29 16.5 32 18 C33 15 35 13 38 12 C40 16 39 21 36 23 C37 30 33 36 24 36 Z" />
      <path d="M16 18 L14 11 L19 15 Z" fill="currentColor" stroke="none" opacity=".9" />
      <path d="M32 18 L34 11 L29 15 Z" fill="currentColor" stroke="none" opacity=".9" />
      <circle cx="19.5" cy="25" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="28.5" cy="25" r="1.1" fill="currentColor" stroke="none" />
      <path d="M22 29 C23 30 25 30 26 29" strokeWidth={1.3} />
      <path d="M36 30 C39 27.5 42.5 28 43 31.5 C39.5 32.5 37.5 32 36 30 Z" opacity=".85" />
    </svg>
  );
}

/** 祇園・素盞嗚系: 勾玉と八重（祇園祭の伝承にちなむ） */
export function GionMotif(props: MotifProps) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <path d="M24 10 C34 10 38 18 34 26 C31 32 24 34 24 34 C24 34 17 32 14 26 C10 18 14 10 24 10 Z" />
      <circle cx="24" cy="20" r="3.2" fill="currentColor" stroke="none" />
      <path d="M18 34 C18 38 21 40 24 40 C27 40 30 38 30 34" strokeWidth={1.3} />
    </svg>
  );
}

/** 住吉・海上安全系: 波と松 */
export function SumiyoshiMotif(props: MotifProps) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <path d="M6 30 C10 26 14 26 18 30 C22 34 26 34 30 30 C34 26 38 26 42 30" />
      <path d="M8 36 C12 32 16 32 20 36 C24 40 28 40 32 36 C36 32 40 32 44 36" />
      <path d="M24 22 L24 10" strokeWidth={1.3} />
      <path d="M24 12 C20 10 18 6 19 4 C22 5 24 8 24 12 Z" />
      <path d="M24 15 C28 13 30 9 29 7 C26 8 24 11 24 15 Z" />
    </svg>
  );
}

const MOTIF_COMPONENTS: Record<MotifKey, (props: MotifProps) => ReactElement> = {
  izumo: IzumoMotif,
  enmusubi: EnmusubiMotif,
  gakumon: GakumonMotif,
  inari: InariMotif,
  gion: GionMotif,
  sumiyoshi: SumiyoshiMotif,
  torii: ToriiMotif,
};

/** 神様名・信仰系統の文字列から、対応するモチーフキーを推定する（表示専用のヒント判定） */
export function getMotifKey(keywords: string[]): MotifKey {
  const text = keywords.join(" ");
  if (/菅原|天神|天満/.test(text)) return "gakumon";
  if (/稲荷|倉稲魂/.test(text)) return "inari";
  if (/出雲|大国主|大幡主/.test(text)) return "izumo";
  if (/縁結び|良縁/.test(text)) return "enmusubi";
  if (/素盞嗚|祇園|八坂/.test(text)) return "gion";
  if (/住吉|海上|航海/.test(text)) return "sumiyoshi";
  return "torii";
}

/**
 * 神社の祭神・信仰系統・御利益から、適切なモチーフ SVG を自動選択して描画する。
 * 見た目のみの表示コンポーネントで、データ取得やビジネスロジックは持たない。
 */
export function DeityMotif({
  deities = [],
  lineages = [],
  benefits = [],
  className,
}: {
  deities?: string[];
  lineages?: string[];
  benefits?: string[];
  className?: string;
}) {
  const key = getMotifKey([...deities, ...lineages, ...benefits]);
  const Motif = MOTIF_COMPONENTS[key];
  return <Motif className={className ? `motif-icon ${className}` : "motif-icon"} />;
}
