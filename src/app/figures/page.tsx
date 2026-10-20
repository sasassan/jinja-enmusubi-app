"use client";

import Link from "next/link";
import { useClientSiteData } from "@/components/ClientSiteData";
import { DeityMotif } from "@/components/motifs/DeityMotifs";

export default function FiguresPage() {
  const { figures, source, isLoading } = useClientSiteData();

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
        <p className="eyebrow">HISTORICAL FIGURES</p>
        <h1>人物から探す</h1>
        <p>実在の人物が神格化され、神社に祀られるまでの由緒をご覧いただけます。</p>
      </section>

      <section className="section-pad results-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIGURES</p>
            <h2>人物一覧</h2>
          </div>
          <span>{figures.length}名</span>
        </div>
        <div className="entity-list">
          {figures.map((figure) => (
            <Link href={`/figures/detail?slug=${encodeURIComponent(figure.slug)}`} key={figure.id} className="entity-card">
              <div className="motif-tile" aria-hidden="true">
                <DeityMotif deities={[figure.name]} />
              </div>
              <div className="shrine-copy">
                <p className="eyebrow">神格化された人物</p>
                <h3>{figure.name}</h3>
                <p className="reading">{figure.reading || "読み不明"}</p>
                <div className="tags">
                  <span>{figure.shrineRefs.length}社に関連</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {figures.length === 0 && (
          <div className="empty-state">
            <DeityMotif />
            <strong>人物データが見つかりませんでした</strong>
            <p>時間をおいて再度お試しください。</p>
          </div>
        )}
      </section>
    </main>
  );
}
