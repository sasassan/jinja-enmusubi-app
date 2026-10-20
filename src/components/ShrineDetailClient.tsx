"use client";

import Link from "next/link";
import Image from "next/image";
import { useClientSiteData } from "@/components/ClientSiteData";
import { DeityMotif } from "@/components/motifs/DeityMotifs";
import { ShrinePhotoGallery } from "@/components/photos/ShrinePhotoGallery";
import { ShrineContributions } from "@/components/shrines/ShrineContributions";

export function ShrineDetailClient({ slug }: { slug: string }) {
  const { shrines, isLoading } = useClientSiteData();
  const shrine = shrines.find((item) => item.slug === slug);

  if (isLoading) return <p className="auth-note" role="status">読み込み中…</p>;
  if (!shrine) return <main><section className="hero"><Link href="/" className="goshuincho-back">← 神社を探す</Link><h1>神社が見つかりませんでした</h1></section></main>;

  return <main>
    <header className="site-header"><Link href="/" className="wordmark" style={{ textDecoration: "none" }}><span className="wordmark-torii" aria-hidden="true" />神社御縁</Link></header>
    <section className="hero shrine-detail-hero" style={shrine.images[0] ? { backgroundImage: `linear-gradient(90deg, rgba(20, 39, 25, .82), rgba(24, 43, 29, .46)), url("${shrine.images[0].url}")` } : undefined}>
      <Link href="/" className="goshuincho-back">← 神社を探す</Link>
      <p className="eyebrow">{shrine.prefecture} {shrine.municipality}</p>
      <h1>{shrine.name}</h1>
      <p>{shrine.reading || "読み不明"}</p>
      {!shrine.images.length && <span className="shrine-visual-caption">⛩ 鳥居をくぐり、神域へ</span>}
    </section>
    {shrine.images.length > 0 && <section className="section-pad"><div className="shrine-gallery">{shrine.images.map((image) => <figure key={image.url}><Image src={image.url} alt={image.alt} width={1200} height={800} unoptimized loading="lazy"/><figcaption>{image.credit}</figcaption></figure>)}</div></section>}
    <ShrinePhotoGallery shrineId={shrine.id} />
    <section className="section-pad"><h2>御祭神</h2>{shrine.deityRefs.length ? <div className="entity-list">{shrine.deityRefs.map((deity) => <Link key={deity.id} href={`/deities/${encodeURIComponent(deity.slug)}`} className="entity-card"><div className="motif-tile" aria-hidden="true"><DeityMotif deities={[deity.name]} /></div><div className="shrine-copy"><p className="eyebrow">{deity.roleLabel}</p><h3>{deity.name}</h3><p className="reading">{deity.reading || "読み不明"}</p></div></Link>)}</div> : <p className="unknown-value">御祭神情報は登録されていません。</p>}
      {shrine.figureRefs.length > 0 && <><h2>関連する人物</h2><div className="entity-list">{shrine.figureRefs.map((figure) => <Link key={figure.id} href={`/figures/detail?slug=${encodeURIComponent(figure.slug)}`} className="entity-card"><div className="shrine-copy"><h3>{figure.name}</h3><p>{figure.description}</p></div></Link>)}</div></>}
      {shrine.benefitRefs.length > 0 && <><h2>御利益</h2><div className="tags">{shrine.benefitRefs.map((benefit) => <span key={benefit.slug}>{benefit.name}</span>)}</div></>}
      <h2>由緒・歴史</h2><p className="history">{shrine.founded || "創建・由来は登録されていません。"}</p><p className="history">{shrine.history || "歴史は登録されていません。"}</p>
      <ShrineContributions shrineId={shrine.id} />
      {shrine.nameOrigin && <><h2>社名の由来</h2><p className="history">{shrine.nameOrigin}</p></>}
      {shrine.culturalProperties && <><h2>文化財</h2><p className="history">{shrine.culturalProperties}</p></>}
      <h2>参拝情報</h2><dl className="detail-meta"><div><dt>所在地</dt><dd>{shrine.address || "未登録"}</dd></div><div><dt>参拝時間</dt><dd>{shrine.worshipHours || "未登録"}</dd></div><div><dt>アクセス</dt><dd>{shrine.accessInfo || "未登録"}</dd></div><div><dt>駐車場</dt><dd>{shrine.parkingInfo || "未登録"}</dd></div></dl>
      {shrine.officialUrl && <p><a href={shrine.officialUrl} target="_blank" rel="noreferrer">公式サイト</a></p>}
      {shrine.sources.length > 0 && <><h2>情報源</h2><ul>{shrine.sources.map((source) => <li key={`${source.url}-${source.fieldName}`}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.name}</a> : source.name} — 確認日: {source.verifiedAt}</li>)}</ul></>}
    </section>
  </main>;
}
