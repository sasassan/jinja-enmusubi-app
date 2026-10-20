import { DeityMotif } from "@/components/motifs/DeityMotifs";

export type GoshuinEntry = {
  id: string;
  shrineName: string;
  prefecture: string;
  visitedAt: string; // 表示用の日付文字列（例: "2026.09.07"）
  deities: string[];
  lineages: string[];
  benefits: string[];
};

/** 御朱印帳に押される「奉拝」印にちなみ、社名から一文字を朱印の中核に据える簡易ロジック（表示専用） */
function sealCharacter(name: string): string {
  const trimmed = name.replace(/^(鎮西大社|旧|新)/, "");
  return trimmed.slice(0, 1) || "社";
}

/**
 * 一枚の御朱印（奉拝印）を表す帳面カード。
 * 円形の朱印・墨書き風の社名・参拝日を、実際の御朱印の構成（印・書・日付）を
 * 意識してレイアウトしている。
 */
export function GoshuinStamp({ entry }: { entry: GoshuinEntry }) {
  return (
    <article className="goshuin-stamp" aria-label={`${entry.shrineName}の御朱印`}>
      <div className="goshuin-stamp-top">
        <span className="stamp-pref eyebrow">{entry.prefecture}</span>
        <span className="stamp-date">{entry.visitedAt} 参拝</span>
      </div>
      <div className="goshuin-stamp-body">
        <div className="goshuin-seal" aria-hidden="true">
          <span className="seal-kanji">{sealCharacter(entry.shrineName)}</span>
        </div>
        <div className="goshuin-stamp-name">
          <p className="name-kanji">{entry.shrineName}</p>
        </div>
      </div>
      <div className="goshuin-stamp-foot">
        {entry.deities.slice(0, 2).map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </article>
  );
}

/** まだ参拝していない神社のための、空の御朱印スロット（帳面の白紙ページ） */
export function GoshuinEmptySlot({ label = "まだ御朱印はありません" }: { label?: string }) {
  return (
    <div className="goshuin-slot-empty">
      <DeityMotif />
      <span>{label}</span>
    </div>
  );
}
