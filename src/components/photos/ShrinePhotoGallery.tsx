"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchShrinePhotos, uploadShrinePhoto, type ShrinePhoto } from "@/lib/shrinePhotos";

export function ShrinePhotoGallery({ shrineId }: { shrineId: string }) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ShrinePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<ShrinePhoto | null>(null);

  const reload = useCallback(async () => {
    try {
      setPhotos(await fetchShrinePhotos(shrineId));
      setError(null);
    } catch {
      setError("写真を読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }, [shrineId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await fetchShrinePhotos(shrineId);
        if (active) setPhotos(result);
      } catch {
        if (active) setError("写真を読み込めませんでした。");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [shrineId]);

  const handleUpload = async () => {
    if (!user || !selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const photographerName = String(user.user_metadata.display_name || user.email?.split("@")[0] || "参拝者");
      await uploadShrinePhoto({ file: selectedFile, shrineId, userId: user.id, photographerName, caption });
      setSelectedFile(null);
      setCaption("");
      const input = document.getElementById(`shrine-photo-input-${shrineId}`) as HTMLInputElement | null;
      if (input) input.value = "";
      await reload();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "写真を投稿できませんでした。");
    } finally {
      setUploading(false);
    }
  };

  return <section className="section-pad photo-section" aria-labelledby="shrine-photo-heading">
    <div className="section-heading"><h2 id="shrine-photo-heading">みんなの写真</h2><span>{photos.length}枚</span></div>
    <p className="photo-section-intro">この神社で出会った景色を共有しましょう。</p>
    {user ? <div className="photo-upload-panel">
      <label className="photo-file-label" htmlFor={`shrine-photo-input-${shrineId}`}>写真を選ぶ・撮影する</label>
      <input id={`shrine-photo-input-${shrineId}`} className="photo-file-input" type="file" accept="image/*" capture="environment" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
      {selectedFile && <>
        <p className="photo-selected-name">{selectedFile.name}</p>
        <label className="auth-field photo-caption-field"><span>キャプション（任意）</span><input value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={300} placeholder="写真についてひとこと" /></label>
        <button type="button" className="primary-button" onClick={() => void handleUpload()} disabled={uploading}>{uploading ? "写真を投稿中…" : "写真を投稿"}</button>
        {uploading && <div className="photo-progress" role="status"><span>画像を最適化してアップロードしています</span><progress aria-label="写真をアップロード中" /> </div>}
      </>}
    </div> : <p className="photo-login-prompt"><Link href="/login">ログインして写真を投稿</Link></p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {loading ? <p className="auth-note">写真を読み込み中…</p> : photos.length ? <div className="community-photo-grid">
      {photos.map((photo) => <button type="button" className="community-photo-card" key={photo.id} onClick={() => setActivePhoto(photo)} aria-label={`${photo.photographerName}の写真を拡大`}>
        <Image src={photo.url} alt={photo.caption || "参拝者が投稿した神社の写真"} width={600} height={600} unoptimized loading="lazy" />
      </button>)}
    </div> : <p className="photo-empty">まだ写真はありません。最初の一枚を投稿しませんか。</p>}
    {activePhoto && <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label="写真の詳細" onClick={() => setActivePhoto(null)}>
      <button type="button" className="photo-lightbox-close" aria-label="閉じる" onClick={() => setActivePhoto(null)}>×</button>
      <figure onClick={(event) => event.stopPropagation()}>
        <Image src={activePhoto.url} alt={activePhoto.caption || "参拝者が投稿した神社の写真"} width={1200} height={1200} unoptimized />
        <figcaption><strong>{activePhoto.photographerName}</strong><time>{activePhoto.takenAt ? new Date(activePhoto.takenAt).toLocaleString("ja-JP") : new Date(activePhoto.createdAt).toLocaleDateString("ja-JP")}</time>{activePhoto.caption && <p>{activePhoto.caption}</p>}</figcaption>
      </figure>
    </div>}
  </section>;
}
