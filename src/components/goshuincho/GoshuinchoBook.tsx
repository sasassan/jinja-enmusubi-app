import { GoshuinStamp, GoshuinEmptySlot, type GoshuinEntry } from "./GoshuinStamp";

/**
 * 御朱印帳の表紙・帳面ページをまとめた表示コンポーネント。
 * データの取得方法（デモ/DB）には関与せず、entries を受け取って描画するだけの
 * プレゼンテーション層。ページを開いたときのアニメーションは globals.css の
 * .goshuin-grid > * の page-open で表現している。
 */
export function GoshuinchoBook({ entries }: { entries: GoshuinEntry[] }) {
  return (
    <div>
      <div className="goshuincho-cover" role="img" aria-label="御朱印帳の表紙">
        <p className="cover-title">御朱印帳</p>
        <p className="cover-sub">JINJA GOEN · SHRINE VISIT RECORD</p>
        <div className="cover-count">
          参拝済み <b>{entries.length}</b> 社
        </div>
      </div>

      <div className="goshuin-pages">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MY RECORD</p>
            <h2>集めた御朱印</h2>
          </div>
          <span>{entries.length}件</span>
        </div>

        {entries.length === 0 ? (
          <div className="empty-state" style={{ marginTop: "var(--sp-5)" }}>
            <strong>帳面はまだ白紙です</strong>
            <p>
              神社を訪れて「参拝を記録する」を選ぶと、ここに御朱印が増えていきます。
            </p>
          </div>
        ) : (
          <div className="goshuin-grid">
            {entries.map((entry) => (
              <GoshuinStamp key={entry.id} entry={entry} />
            ))}
            <GoshuinEmptySlot label="次の参拝を記録しましょう" />
          </div>
        )}
      </div>
    </div>
  );
}

export type { GoshuinEntry };
