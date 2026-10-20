"use client";

import Link from "next/link";
import { useClientSiteData } from "@/components/ClientSiteData";
import { DeityMotif } from "@/components/motifs/DeityMotifs";
import { NearbyShrineList } from "@/components/NearbyShrineList";
import { ROLE_LABELS } from "@/lib/types";

export function DeityDetailClient({ slug }: { slug: string }) {
  const { deities, shrines, isLoading } = useClientSiteData();
  const deity = deities.find((item) => item.slug === slug);

  if (isLoading) return <p className="auth-note" role="status">読み込み中…</p>;
  if (!deity) return <p className="empty-state" role="status">神様が見つかりませんでした。</p>;

  const relatedShrines = deity.shrineSlugs.flatMap((shrineSlug) => {
    const shrine = shrines.find((item) => item.slug === shrineSlug);
    if (!shrine) return [];
    const ref = shrine.deityRefs.find((item) => item.slug === deity.slug);
    return [{
      slug: shrine.slug,
      name: shrine.name,
      reading: shrine.reading,
      prefecture: shrine.prefecture,
      municipality: shrine.municipality,
      latitude: shrine.latitude,
      longitude: shrine.longitude,
      roleLabel: ref ? ref.roleLabel : "御祭神",
    }];
  });

  return (
    <main>
      <header className="site-header"><Link href="/" className="wordmark" style={{ textDecoration: "none" }}>神社御縁</Link></header>
      <section className="hero">
        <Link href="/deities" className="goshuincho-back">← 神様一覧</Link>
        <div className="detail-sheet-header" style={{ marginTop: 8 }}>
          <div className="detail-motif" aria-hidden="true" style={{ background: "#fff7ed" }}><DeityMotif deities={[deity.name, ...deity.aliases]} /></div>
          <div><h1 style={{ fontSize: 26, margin: 0 }}>{deity.name}</h1><p className="reading" style={{ color: "var(--ink-soft)" }}>{deity.reading || "読み不明"}</p></div>
        </div>
        {deity.aliases.length > 0 && <p style={{ marginTop: 12, color: "var(--on-accent-soft)", fontSize: 13 }}>別名: {deity.aliases.join("・")}</p>}
      </section>
      <section className="section-pad">
        <div className="detail-meta" style={{ marginTop: 0 }}><div><b>神格</b><p>{deity.divinity || "不明"}</p></div></div>
        <h3>概要</h3><p className="history">{deity.summary || "概要は登録されていません。"}</p>
        <h3>神話・由緒</h3><p className="history">{deity.mythology || "神話の詳細は登録されていません。"}</p>
        {deity.relatedDeities.length > 0 && <><h3>関連する神様</h3><div className="entity-list">{deity.relatedDeities.map((rel) => <Link href={`/deities/${encodeURIComponent(rel.slug)}`} key={rel.slug} className="entity-card"><div className="shrine-copy" style={{ padding: "16px" }}><p className="eyebrow">{rel.relationType}</p><h3>{rel.name}</h3>{rel.note && <p className="reading">{rel.note}</p>}</div></Link>)}</div></>}
        <h3>この神様を祀る神社（現在地から近い順に表示可能）</h3><NearbyShrineList shrines={relatedShrines} />
        <p className="unknown-value" style={{ marginTop: 24 }}>御祭神としての位置づけ: {Object.values(ROLE_LABELS).join(" / ")} のいずれかで神社に祀られます。</p>
      </section>
    </main>
  );
}

export function FigureDetailClient({ slug }: { slug: string }) {
  const { figures, shrines, isLoading } = useClientSiteData();
  const figure = figures.find((item) => item.slug === slug);

  if (isLoading) return <p className="auth-note" role="status">読み込み中…</p>;
  if (!figure) return <p className="empty-state" role="status">人物が見つかりませんでした。</p>;

  const relatedShrines = figure.shrineRefs.flatMap((ref) => {
    const shrine = shrines.find((item) => item.slug === ref.slug);
    return shrine ? [{
      slug: shrine.slug,
      name: shrine.name,
      reading: shrine.reading,
      prefecture: shrine.prefecture,
      municipality: shrine.municipality,
      latitude: shrine.latitude,
      longitude: shrine.longitude,
      roleLabel: "関連する人物として祀られる",
    }] : [];
  });

  return (
    <main>
      <header className="site-header"><Link href="/" className="wordmark" style={{ textDecoration: "none" }}>神社御縁</Link></header>
      <section className="hero">
        <Link href="/figures" className="goshuincho-back">← 人物一覧</Link>
        <div className="detail-sheet-header" style={{ marginTop: 8 }}>
          <div className="detail-motif" aria-hidden="true" style={{ background: "#fff7ed" }}><DeityMotif deities={[figure.name]} /></div>
          <div><h1 style={{ fontSize: 26, margin: 0 }}>{figure.name}</h1><p className="reading" style={{ color: "var(--ink-soft)" }}>{figure.reading || "読み不明"}</p></div>
        </div>
      </section>
      <section className="section-pad">
        <h3>概要</h3><p className="history">{figure.summary || "概要は登録されていません。"}</p>
        <h3>神格化された経緯</h3><p className="history">{figure.deificationDescription || "神格化の由緒は登録されていません。"}</p>
        <h3>この人物を祀る神社</h3><NearbyShrineList shrines={relatedShrines} />
      </section>
    </main>
  );
}
