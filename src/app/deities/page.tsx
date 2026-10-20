"use client";

import Link from "next/link";
import { useClientSiteData } from "@/components/ClientSiteData";
import { DeityMotif } from "@/components/motifs/DeityMotifs";

export default function DeitiesPage() {
  const { deities, source, isLoading } = useClientSiteData();

  return (
    <main>
      <header className="site-header">
        <Link href="/" className="wordmark" style={{ textDecoration: "none" }}>
          神社御縁
        </Link>
      </header>

      {isLoading && <p className="auth-note" role="status">読み込み中…</p>}

      {source === "fallback" && !isLoading && (
        <p className="data-fallback-notice" role="status">
          現在データを読み込めません。ネットワーク環境をご確認のうえ再度お試しください。
        </p>
      )}

      <section className="hero">
        <Link href="/" className="goshuincho-back">
          ← 神社を探す
        </Link>
        <p className="eyebrow">DEITIES</p>
        <h1>神様から探す</h1>
        <p>
          別名や読みでも検索できます。神様を選ぶと、その神様を祀る神社の一覧をご覧いただけます。
        </p>
      </section>

      <section className="section-pad results-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">DEITIES</p>
            <h2>神様一覧</h2>
          </div>
          <span>{deities.length}柱</span>
        </div>
        <div className="entity-list">
          {deities.map((deity) => (
            <Link href={`/deities/${encodeURIComponent(deity.slug)}`} key={deity.id} className="entity-card">
              <div className="motif-tile" aria-hidden="true">
                <DeityMotif deities={[deity.name, ...deity.aliases]} />
              </div>
              <div className="shrine-copy">
                <p className="eyebrow">{deity.divinity || "神格情報なし"}</p>
                <h3>{deity.name}</h3>
                <p className="reading">
                  {deity.reading || "読み不明"}
                  {deity.aliases.length > 0 ? `（別名: ${deity.aliases.join("・")}）` : ""}
                </p>
                <div className="tags">
                  <span>{deity.shrineSlugs.length}社で祀られています</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {deities.length === 0 && (
          <div className="empty-state">
            <DeityMotif />
            <strong>神様データが見つかりませんでした</strong>
            <p>時間をおいて再度お試しください。</p>
          </div>
        )}
      </section>
    </main>
  );
}
