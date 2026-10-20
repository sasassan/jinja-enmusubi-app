import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 神社御縁",
  description: "神社御縁のプライバシーポリシーです。",
};

export default function PrivacyPage() {
  return (
    <main>
      <header className="site-header">
        <Link href="/" className="wordmark" style={{ textDecoration: "none" }}>
          神社御縁
        </Link>
      </header>

      <section className="hero">
        <Link href="/" className="goshuincho-back">
          ← 神社を探す
        </Link>
        <p className="eyebrow">PRIVACY</p>
        <h1>プライバシーポリシー</h1>
      </section>

      <article className="section-pad privacy-content">
        <h2>1. 取得する情報</h2>
        <p>
          本サービスでは、アカウント登録時にメールアドレスを取得します。これは認証およびアカウントの識別に利用します。
        </p>

        <h2>2. 利用目的</h2>
        <ul>
          <li>ユーザー認証</li>
          <li>お気に入り神社のサーバー同期</li>
          <li>参拝記録の保存・表示</li>
          <li>サービスの改善・不具合対応</li>
        </ul>

        <h2>3. 情報の保存先</h2>
        <p>
          アカウント情報および参拝記録は、Verdent プラットフォームが提供する Supabase データベースに保存されます。未ログイン時のお気に入り・最近見た神社は、お使いの端末の localStorage に保存されます。
        </p>

        <h2>4. 情報の共有</h2>
        <p>
          ユーザーの個人情報および参拝記録を、法令に基づく場合を除き、第三者に提供することはありません。
        </p>

        <h2>5. データの削除</h2>
        <p>
          アカウント削除をご希望の場合は、お問い合わせください。ユーザー自身で作成した参拝記録は、アプリ内からいつでも削除できます。
        </p>

        <h2>6. 免責事項</h2>
        <p>
          本サービスに掲載する神社・神様・御利益などの情報は、参考文献および公開情報に基づくものです。効能を保証するものではありません。
        </p>
      </article>
    </main>
  );
}
