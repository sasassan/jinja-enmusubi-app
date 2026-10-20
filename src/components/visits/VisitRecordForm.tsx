"use client";

import { useState } from "react";
import { createVisit, updateVisit, type Visit } from "@/lib/visits";
import { uploadShrinePhoto, MAX_PHOTO_SIZE } from "@/lib/shrinePhotos";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Shrine } from "@/lib/types";

function formatDateForInput(date: Date): string {
  const tzOffset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - tzOffset);
  return local.toISOString().slice(0, 10);
}

type VisitRecordFormProps = {
  shrine: Shrine;
  existingVisit?: Visit | null;
  onSaved: () => void;
  onCancel: () => void;
};

export function VisitRecordForm({ shrine, existingVisit, onSaved, onCancel }: VisitRecordFormProps) {
  const [visitedAt, setVisitedAt] = useState(existingVisit?.visitedAt ?? formatDateForInput(new Date()));
  const [memo, setMemo] = useState(existingVisit?.memo ?? "");
  const [receivedPhysicalGoshuin, setReceivedPhysicalGoshuin] = useState(existingVisit?.receivedPhysicalGoshuin ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoCaption, setPhotoCaption] = useState("");
  const [savedVisitId, setSavedVisitId] = useState<string | null>(existingVisit?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const today = formatDateForInput(new Date());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    let visitSaved = false;
    try {
      if (!user) {
        setError("ログインが必要です。");
        return;
      }
      if (visitedAt > today) {
        setError("参拝日は今日以前の日付を選択してください。");
        return;
      }
      let visitId = savedVisitId;
      if (visitId) {
        await updateVisit(visitId, { visitedAt, memo, receivedPhysicalGoshuin });
      } else {
        visitId = await createVisit({ shrineId: shrine.id, visitedAt, memo, receivedPhysicalGoshuin }, user.id);
        setSavedVisitId(visitId);
      }
      visitSaved = true;
      const photographerName = String(user.user_metadata.display_name || user.email?.split("@")[0] || "参拝者");
      for (const file of photoFiles) {
        await uploadShrinePhoto({ file, shrineId: shrine.id, userId: user.id, photographerName, caption: photoCaption, visitId });
        setPhotoFiles((remaining) => remaining.filter((selected) => selected !== file));
      }
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "保存に失敗しました。もう一度お試しください。";
      setError(visitSaved ? `参拝記録は保存されましたが、写真を投稿できませんでした：${message}` : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="visit-form">
      <p className="visit-form-shrine">
        <strong>{shrine.name}</strong> の参拝記録
      </p>

      <label className="auth-field">
        <span>参拝日</span>
        <input
          type="date"
          value={visitedAt}
          onChange={(e) => setVisitedAt(e.target.value)}
          max={today}
          required
        />
      </label>

      <label className="auth-field">
        <span>御朱印</span>
        <span>
          <input
            type="checkbox"
            checked={receivedPhysicalGoshuin}
            onChange={(event) => setReceivedPhysicalGoshuin(event.target.checked)}
          />
          御朱印をいただいた
        </span>
      </label>

      <label className="auth-field">
        <span>メモ（任意）</span>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={4}
          placeholder="その日の印象や御朱印の有無など、ご自由にどうぞ"
          maxLength={2000}
        />
      </label>
      <p className="visit-form-count">{memo.length}/2000</p>

      <label className="auth-field photo-caption-field">
        <span>写真を添付（任意・各10MBまで）</span>
        <input type="file" accept="image/*" capture="environment" multiple onChange={(event) => {
          const selected = Array.from(event.target.files ?? []);
          const validFiles = selected.filter((file) => file.type.startsWith("image/") && file.size <= MAX_PHOTO_SIZE);
          setPhotoFiles((current) => [...current, ...validFiles]);
          if (validFiles.length !== selected.length) setError("写真は画像形式で、1枚10MB以下のファイルを選択してください。");
          event.target.value = "";
        }} />
      </label>
      {photoFiles.length > 0 && <>
        <ul className="visit-photo-selection">{photoFiles.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`}>{file.name} <button type="button" className="text-button danger" onClick={() => setPhotoFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}>外す</button></li>)}</ul>
        <label className="auth-field photo-caption-field"><span>写真のキャプション（任意）</span><input value={photoCaption} onChange={(event) => setPhotoCaption(event.target.value)} maxLength={300} placeholder="写真についてひとこと" /></label>
      </>}

      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      <div className="sheet-actions">
        <button type="submit" className="primary-button" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "保存中…" : existingVisit ? "更新する" : "参拝を記録する"}
        </button>
        <button type="button" className="outline-button" onClick={onCancel} disabled={isSubmitting}>
          キャンセル
        </button>
      </div>
    </form>
  );
}
