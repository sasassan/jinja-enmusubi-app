"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CONTRIBUTION_LABELS,
  CONTRIBUTION_TYPES,
  MAX_CONTRIBUTION_LENGTH,
  fetchShrineContributions,
  createShrineContribution,
  deleteShrineContribution,
  updateShrineContribution,
  type ContributionType,
  type ShrineContribution,
} from "@/lib/shrineContributions";

type EditorMode = "manual" | "ocr";

export function ShrineContributions({ shrineId }: { shrineId: string }) {
  const { user } = useAuth();
  const [contributions, setContributions] = useState<ShrineContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);
  const [editing, setEditing] = useState<ShrineContribution | null>(null);
  const [contributionType, setContributionType] = useState<ContributionType>("history");
  const [content, setContent] = useState("");
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setContributions(await fetchShrineContributions(shrineId));
      setError(null);
    } catch {
      setError("参拝者からの情報を読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }, [shrineId]);

  useEffect(() => {
    let active = true;
    fetchShrineContributions(shrineId)
      .then((rows) => { if (active) setContributions(rows); })
      .catch(() => { if (active) setError("参拝者からの情報を読み込めませんでした。"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [shrineId]);

  const closeEditor = () => {
    setEditorMode(null);
    setEditing(null);
    setContributionType("history");
    setContent("");
    setSourceImage(null);
    setError(null);
  };

  const startEditor = (mode: EditorMode) => {
    setEditing(null);
    setEditorMode(mode);
    setContributionType(mode === "ocr" ? "photo_ocr" : "history");
    setContent("");
    setSourceImage(null);
    setError(null);
  };

  const recognizeImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください。");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("画像は10MB以下を選択してください。");
      return;
    }

    setSourceImage(file);
    setContent("");
    setOcrRunning(true);
    setError(null);
    let worker: Awaited<ReturnType<typeof import("tesseract.js").createWorker>> | null = null;
    try {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("jpn");
      const { data } = await worker.recognize(file);
      setContent(data.text.trim());
      if (!data.text.trim()) setError("文字を読み取れませんでした。写真を撮り直すか、テキストを入力してください。");
    } catch {
      setError("OCRを実行できませんでした。通信状態を確認し、テキストで入力してください。");
    } finally {
      if (worker) await worker.terminate();
      setOcrRunning(false);
    }
  };

  const beginEdit = (contribution: ShrineContribution) => {
    setEditing(contribution);
    setEditorMode(contribution.contributionType === "photo_ocr" ? "ocr" : "manual");
    setContributionType(contribution.contributionType);
    setContent(contribution.content);
    setSourceImage(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const updated = await updateShrineContribution({
          id: editing.id,
          userId: user.id,
          contributionType,
          content,
        });
        setContributions((rows) => rows.map((row) => row.id === updated.id ? updated : row));
      } else {
        await createShrineContribution({
          shrineId,
          userId: user.id,
          contributionType,
          content,
          sourceImage,
        });
        await reload();
      }
      closeEditor();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "投稿を保存できませんでした。");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contribution: ShrineContribution) => {
    if (!user || !window.confirm("この投稿を削除しますか？")) return;
    setError(null);
    try {
      await deleteShrineContribution(contribution, user.id);
      setContributions((rows) => rows.filter((row) => row.id !== contribution.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "投稿を削除できませんでした。");
    }
  };

  return <section className="section-pad contributions-section" aria-labelledby="contributions-heading">
    <div className="section-heading"><h2 id="contributions-heading">参拝者からの情報</h2><span>{contributions.length}件</span></div>
    <p className="contributions-intro">由緒書きや参拝で見つけた情報を共有してください。</p>
    {user ? <div className="contribution-actions">
      <button type="button" className="primary-button" onClick={() => startEditor("ocr")}>由緒書きを撮影</button>
      <button type="button" className="outline-button" onClick={() => startEditor("manual")}>情報を追加</button>
    </div> : <p className="photo-login-prompt"><Link href="/login">ログインして神社の情報を追加</Link></p>}

    {editorMode && <div className="contribution-editor" aria-label={editing ? "投稿を編集" : editorMode === "ocr" ? "由緒書きを読み取る" : "神社情報を追加"}>
      <div className="section-heading"><h3>{editing ? "投稿を編集" : editorMode === "ocr" ? "由緒書きを撮影・読み取り" : "神社情報を追加"}</h3><button type="button" className="contribution-close" onClick={closeEditor} aria-label="入力を閉じる">×</button></div>
      {editorMode === "ocr" && !editing && <>
        <label className="photo-file-label" htmlFor={`contribution-image-${shrineId}`}>カメラ・ギャラリーから選ぶ</label>
        <input id={`contribution-image-${shrineId}`} className="photo-file-input" type="file" accept="image/*" capture="environment" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void recognizeImage(file);
          event.currentTarget.value = "";
        }} />
        {sourceImage && <p className="photo-selected-name">選択中: {sourceImage.name}</p>}
        {ocrRunning && <div className="photo-progress" role="status"><span>日本語の文字を読み取っています…初回は言語データの読み込みに時間がかかります。</span><progress aria-label="OCR実行中" /></div>}
      </>}
      {editorMode === "manual" && <label className="auth-field"><span>情報の種類</span><select value={contributionType} onChange={(event) => setContributionType(event.target.value as ContributionType)}>
        {CONTRIBUTION_TYPES.filter((type) => type !== "photo_ocr").map((type) => <option value={type} key={type}>{CONTRIBUTION_LABELS[type]}</option>)}
      </select></label>}
      {editorMode === "ocr" && <p className="contribution-kind">投稿の種類: {CONTRIBUTION_LABELS.photo_ocr}</p>}
      <label className="auth-field contribution-content"><span>{editorMode === "ocr" ? "読み取り結果（確認・修正できます）" : "追加する情報"}</span><textarea value={content} onChange={(event) => setContent(event.target.value)} rows={editorMode === "ocr" ? 10 : 7} maxLength={MAX_CONTRIBUTION_LENGTH} placeholder={editorMode === "ocr" ? "写真を選ぶと日本語OCRを実行します。ここに直接入力もできます。" : "御祭神、由緒、御利益などの情報を入力してください。"} /></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="contribution-editor-actions"><button type="button" className="primary-button" onClick={() => void handleSave()} disabled={saving || ocrRunning || !content.trim()}>{saving ? "保存中…" : editing ? "変更を保存" : "確認して投稿"}</button><button type="button" className="outline-button" onClick={closeEditor} disabled={saving}>キャンセル</button></div>
    </div>}

    {error && !editorMode && <p className="auth-error" role="alert">{error}</p>}
    {loading ? <p className="auth-note">情報を読み込み中…</p> : contributions.length ? <div className="contribution-list">
      {contributions.map((contribution) => <article className="contribution-card" key={contribution.id}>
        <div className="contribution-card-heading"><span className="contribution-type">{CONTRIBUTION_LABELS[contribution.contributionType]}</span><time dateTime={contribution.createdAt}>{new Date(contribution.createdAt).toLocaleDateString("ja-JP")}</time></div>
        <p className="contribution-content-text">{contribution.content}</p>
        {user && contribution.userId === user.id && <div className="contribution-item-actions"><button type="button" onClick={() => beginEdit(contribution)}>編集</button><button type="button" onClick={() => void handleDelete(contribution)}>削除</button></div>}
      </article>)}
    </div> : <p className="contributions-empty">まだ情報はありません。最初の情報を追加しませんか。</p>}
  </section>;
}
