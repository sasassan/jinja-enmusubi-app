"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { deleteShrinePhoto, fetchMyShrinePhotos, type ShrinePhoto } from "@/lib/shrinePhotos";

export function MyShrinePhotos({ userId }: { userId: string }) {
  const [photos, setPhotos] = useState<ShrinePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setPhotos(await fetchMyShrinePhotos(userId));
      setError(null);
    } catch {
      setError("投稿写真を読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await fetchMyShrinePhotos(userId);
        if (active) setPhotos(result);
      } catch {
        if (active) setError("投稿写真を読み込めませんでした。");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [userId]);

  const removePhoto = async (photo: ShrinePhoto) => {
    if (!window.confirm("この写真を削除しますか？")) return;
    setDeleting(photo.id);
    setError(null);
    try {
      await deleteShrinePhoto(photo);
      await reload();
    } catch {
      setError("写真を削除できませんでした。時間をおいてお試しください。");
    } finally {
      setDeleting(null);
    }
  };

  return <section className="my-photos-section">
    <div className="section-heading"><h2>投稿した写真</h2><span>{photos.length}枚</span></div>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {loading ? <p className="auth-note">写真を読み込み中…</p> : photos.length ? <div className="my-photo-list">
      {photos.map((photo) => <article className="my-photo-card" key={photo.id}>
        <Link href={`/shrines/detail?slug=${encodeURIComponent(photo.shrineSlug || "")}`} className="my-photo-image" aria-label={`${photo.shrineName || "神社"}の詳細`}>
          <Image src={photo.url} alt={photo.caption || "投稿した写真"} width={300} height={300} unoptimized loading="lazy" />
        </Link>
        <div className="my-photo-copy"><strong>{photo.shrineName || "神社"}</strong><time>{new Date(photo.createdAt).toLocaleDateString("ja-JP")}</time>{photo.caption && <p>{photo.caption}</p>}</div>
        <button type="button" className="text-button danger" disabled={deleting === photo.id} onClick={() => void removePhoto(photo)}>{deleting === photo.id ? "削除中…" : "削除"}</button>
      </article>)}
    </div> : <p className="photo-empty">投稿した写真はまだありません。神社の詳細から写真を共有できます。</p>}
  </section>;
}
