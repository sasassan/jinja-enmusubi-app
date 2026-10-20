import Link from "next/link";

/**
 * オフライン時のフォールバックページ。
 *
 * 静的エクスポートページを Service Worker が
 * このページをキャッシュから返す。静的にプリレンダリングされるため、
 * ビルド時に生成される HTML がそのまま Service Worker のプリキャッシュ対象になる。
 */
export default function OfflinePage() {
  return (
    <main className="offline-page">
      <p className="eyebrow">OFFLINE</p>
      <h1>電波が届いていないようです</h1>
      <p>
        インターネットに接続されていないため、最新の情報を表示できません。
        <br />
        通信環境が整ったら、もう一度お試しください。
      </p>
      <p className="offline-hint">
        ※ 一度表示した神社の情報は、次回オフラインでも一部ご覧いただける場合があります。
      </p>
      <Link href="/" className="primary-button">
        トップページに戻る
      </Link>
    </main>
  );
}
