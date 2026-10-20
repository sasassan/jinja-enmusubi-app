"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useVisits, deleteVisit, type Visit } from "@/lib/visits";
import { VisitRecordForm } from "@/components/visits/VisitRecordForm";
import { DeityMotif } from "@/components/motifs/DeityMotifs";
import { MyShrinePhotos } from "@/components/photos/MyShrinePhotos";
import type { Shrine } from "@/lib/types";

function groupVisitsByMonth(visits: Visit[]): { label: string; items: Visit[] }[] {
  const groups = new Map<string, Visit[]>();
  for (const visit of visits) {
    const key = visit.visitedAt.slice(0, 7); // YYYY-MM
    const list = groups.get(key) ?? [];
    list.push(visit);
    groups.set(key, list);
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => {
      const [year, month] = key.split("-");
      return {
        label: `${year}年${Number(month)}月`,
        items: items.sort((a, b) => b.visitedAt.localeCompare(a.visitedAt)),
      };
    });
}

function VisitCard({
  visit,
  shrine,
  onEdit,
  onDelete,
}: {
  visit: Visit;
  shrine: Shrine | undefined;
  onEdit: (v: Visit) => void;
  onDelete: (v: Visit) => void;
}) {
  return (
    <article className="visit-card">
      <div className="visit-card-header">
        <time dateTime={visit.visitedAt}>{visit.visitedAt.replace(/-/g, "/")}</time>
        <div className="visit-card-actions">
          <button className="text-button" onClick={() => onEdit(visit)}>編集</button>
          <button className="text-button danger" onClick={() => onDelete(visit)}>削除</button>
        </div>
      </div>
      {shrine ? (
        <Link href={`/shrines/detail?slug=${encodeURIComponent(shrine.slug)}`} className="visit-card-shrine">
          {shrine.name}
        </Link>
      ) : (
        <p className="visit-card-shrine">{visit.shrineName}</p>
      )}
      {visit.memo && <p className="visit-card-memo">{visit.memo}</p>}
    </article>
  );
}

export default function VisitsPage() {
  const { user } = useAuth();
  const { visits, isLoading, reload } = useVisits(user);
  const [editing, setEditing] = useState<Visit | null>(null);
  const [deleting, setDeleting] = useState<Visit | null>(null);

  const grouped = groupVisitsByMonth(visits);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteVisit(deleting.id);
      await reload();
    } finally {
      setDeleting(null);
    }
  };

  if (!user) {
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
          <p className="eyebrow">VISITS</p>
          <h1>参拝記録</h1>
        </section>
        <section className="section-pad">
          <div className="empty-state">
            <DeityMotif />
            <strong>ログインが必要です</strong>
            <p>参拝記録を見るには、ログインしてください。</p>
            <Link href="/login" className="primary-button">
              ログイン / 新規登録
            </Link>
          </div>
        </section>
      </main>
    );
  }

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
        <p className="eyebrow">VISITS</p>
        <h1>参拝記録</h1>
        <p>神社詳細から記録した参拝の一覧です。</p>
      </section>

      <MyShrinePhotos userId={user.id} />
      <section className="section-pad">
        {isLoading ? (
          <p className="auth-note">読み込み中…</p>
        ) : grouped.length === 0 ? (
          <div className="empty-state">
            <DeityMotif />
            <strong>まだ参拝記録がありません</strong>
            <p>神社の詳細画面から「参拝を記録」で、大切な参拝を残していきましょう。</p>
            <Link href="/" className="primary-button">
              神社を探す
            </Link>
          </div>
        ) : (
          <div className="visit-list">
            {grouped.map((group) => (
              <section key={group.label} className="visit-group">
                <h2 className="visit-group-title">{group.label}</h2>
                <div className="visit-group-items">
                  {group.items.map((visit) => (
                    <VisitCard
                      key={visit.id}
                      visit={visit}
                      shrine={undefined}
                      onEdit={setEditing}
                      onDelete={setDeleting}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      {editing && (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="参拝記録を編集" onClick={() => setEditing(null)}>
          <article className="detail-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="close" aria-label="閉じる" onClick={() => setEditing(null)}>
              ×
            </button>
            <VisitRecordForm
              shrine={{
                id: editing.shrineId,
                name: editing.shrineName,
                slug: editing.shrineSlug,
              } as Shrine}
              existingVisit={editing}
              onSaved={() => {
                reload();
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          </article>
        </div>
      )}

      {deleting && (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="削除の確認" onClick={() => setDeleting(null)}>
          <article className="detail-sheet confirm-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>参拝記録を削除しますか？</h2>
            <p>{deleting.shrineName}（{deleting.visitedAt.replace(/-/g, "/")}）の記録を削除します。</p>
            <div className="sheet-actions">
              <button className="outline-button" onClick={() => setDeleting(null)}>
                キャンセル
              </button>
              <button className="primary-button" style={{ background: "var(--danger)" }} onClick={handleDelete}>
                削除する
              </button>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
