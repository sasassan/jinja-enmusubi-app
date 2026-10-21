"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Contribution = {
  id: string;
  shrine_id: string;
  contribution_type: string;
  content: string;
  status: "pending" | "published" | "hidden";
  created_at: string;
};

const labels: Record<Contribution["status"], string> = {
  pending: "承認待ち",
  published: "公開中",
  hidden: "非公開",
};

export default function AdminContributionsPage() {
  const [items, setItems] = useState<Contribution[]>([]);
  const [status, setStatus] = useState<Contribution["status"]>("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: loadError } = await getSupabaseBrowserClient()
      .from("shrine_user_contributions")
      .select("id, shrine_id, contribution_type, content, status, created_at")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(100);
    if (loadError) setError(loadError.message);
    else setItems((data ?? []) as Contribution[]);
    setLoading(false);
  }, [status]);

  useEffect(() => { void reload(); }, [reload]);

  async function moderate(id: string, nextStatus: Contribution["status"]) {
    if (!window.confirm(nextStatus === "published" ? "この投稿を公開しますか？" : "この投稿を非公開にしますか？")) return;
    setBusy(id);
    setError(null);
    const { error: updateError } = await getSupabaseBrowserClient()
      .from("shrine_user_contributions").update({ status: nextStatus }).eq("id", id);
    if (updateError) setError(updateError.message);
    else await reload();
    setBusy(null);
  }

  return (
    <section>
      <div className="admin-page-header"><h1>投稿の審査</h1></div>
      <p className="admin-note">投稿内容と出典を確認してから公開してください。最新100件を表示します。</p>
      <div className="admin-toolbar">
        <label htmlFor="contribution-status">表示状態</label>
        <select id="contribution-status" value={status} onChange={(event) => setStatus(event.target.value as Contribution["status"])}>
          <option value="pending">承認待ち</option>
          <option value="published">公開中</option>
          <option value="hidden">非公開</option>
        </select>
        <button className="admin-button secondary" onClick={() => void reload()} disabled={loading}>更新</button>
      </div>
      {error && <p role="alert" className="auth-error">{error}</p>}
      {loading ? <p role="status">読み込み中…</p> : items.length === 0 ? <p>該当する投稿はありません。</p> : (
        <div className="admin-table-wrap"><table className="admin-table">
          <thead><tr><th>投稿日時</th><th>内容</th><th>状態</th><th>操作</th></tr></thead>
          <tbody>{items.map((item) => (
            <tr key={item.id}>
              <td>{new Date(item.created_at).toLocaleString("ja-JP")}</td>
              <td style={{ maxWidth: 500, overflowWrap: "anywhere" }}>
                <strong>{item.contribution_type}</strong>
                <p style={{ whiteSpace: "pre-wrap" }}>{item.content}</p>
                <small>神社ID: {item.shrine_id}</small>
              </td>
              <td>{labels[item.status]}</td>
              <td><div className="admin-actions">
                {item.status !== "published" && <button className="admin-button" disabled={busy !== null} onClick={() => void moderate(item.id, "published")}>公開</button>}
                {item.status !== "hidden" && <button className="admin-button secondary" disabled={busy !== null} onClick={() => void moderate(item.id, "hidden")}>非公開</button>}
              </div></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </section>
  );
}
