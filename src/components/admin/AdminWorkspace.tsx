"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  clampAdminPage,
  getAdminBenefit,
  getAdminBenefitsPage,
  getAdminDeities,
  getAdminDeity,
  getAdminFigure,
  getAdminFigures,
  getAdminLineage,
  getAdminLineagesPage,
  getAdminShrine,
  getAdminShrines,
  getAdminSource,
  getAdminSources,
  getMunicipalities,
  getPageNumbers,
  getPrefectures,
  parseAdminPage,
  type Municipality,
  type Prefecture,
} from "@/lib/adminData";
import {
  createEntity,
  createShrine,
  deleteEntity,
  deleteShrine,
  updateEntity,
  updateShrine,
} from "@/lib/adminActions";
import { DeityRelationManager, ShrineRelationManager } from "@/components/admin/AdminRelationManager";

export type AdminEntity = "shrines" | "deities" | "historical_figures" | "lineages" | "benefits" | "sources";

const ENTITY: Record<AdminEntity, { path: string; label: string; fields: { name: string; label: string; type?: string; rows?: number }[] }> = {
  shrines: { path: "shrines", label: "神社", fields: [
    { name: "name", label: "神社名" }, { name: "reading", label: "読み" }, { name: "slug", label: "スラッグ" },
    { name: "prefecture_id", label: "都道府県" }, { name: "municipality_id", label: "市区町村" }, { name: "address", label: "住所" },
    { name: "latitude", label: "緯度", type: "number" }, { name: "longitude", label: "経度", type: "number" }, { name: "official_url", label: "公式URL", type: "url" },
    { name: "founding_description", label: "創建・由来", rows: 4 }, { name: "history", label: "歴史", rows: 4 }, { name: "name_origin", label: "名前の由来", rows: 3 },
    { name: "cultural_properties", label: "文化財", rows: 3 }, { name: "access_info", label: "アクセス", rows: 3 }, { name: "parking_info", label: "駐車場", rows: 2 }, { name: "worship_hours", label: "参拝時間", rows: 2 },
  ] },
  deities: { path: "deities", label: "神様", fields: [
    { name: "name", label: "名前" }, { name: "reading", label: "読み" }, { name: "slug", label: "スラッグ" }, { name: "aliases", label: "別名（カンマ区切り）" },
    { name: "summary", label: "概要", rows: 4 }, { name: "mythology", label: "神話", rows: 6 }, { name: "divinity", label: "神格" },
  ] },
  historical_figures: { path: "figures", label: "人物", fields: [
    { name: "name", label: "名前" }, { name: "reading", label: "読み" }, { name: "slug", label: "スラッグ" }, { name: "summary", label: "概要", rows: 4 },
    { name: "deification_description", label: "神格化の説明", rows: 6 },
  ] },
  lineages: { path: "lineages", label: "系統", fields: [
    { name: "name", label: "名前" }, { name: "reading", label: "読み" }, { name: "slug", label: "スラッグ" }, { name: "description", label: "説明", rows: 4 },
  ] },
  benefits: { path: "benefits", label: "御利益", fields: [
    { name: "name", label: "名前" }, { name: "slug", label: "スラッグ" }, { name: "description", label: "説明", rows: 4 },
  ] },
  sources: { path: "sources", label: "情報源", fields: [
    { name: "name", label: "名称" }, { name: "url", label: "URL", type: "url" }, { name: "source_type", label: "種別", type: "select" },
    { name: "last_verified_at", label: "確認日", type: "date" }, { name: "notes", label: "メモ", rows: 4 },
  ] },
};
const SOURCE_TYPES = [["official_site", "公式サイト"], ["shrine_association", "神社庁・協会"], ["government", "自治体・政府"], ["publication", "出版物"], ["other", "その他"]] as const;
const SOURCE_PATH_ENTITY: Record<string, AdminEntity> = { figures: "historical_figures", historical_figures: "historical_figures" };
function resolveEntity(value: string | null): AdminEntity | null {
  if (!value) return null;
  if (Object.hasOwn(SOURCE_PATH_ENTITY, value)) return SOURCE_PATH_ENTITY[value];
  return Object.hasOwn(ENTITY, value) ? value as AdminEntity : null;
}

export function AdminClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    if (!user) return;
    getSupabaseBrowserClient().rpc("is_admin").then(
      ({ data, error }) => { if (active) setAllowed(!error && Boolean(data)); },
      () => { if (active) setAllowed(false); }
    );
    return () => { active = false; };
  }, [user]);
  if (isLoading || (user && allowed === null)) return <p className="admin-note" role="status">管理者権限を確認しています…</p>;
  if (!user) return <div className="admin-unauthorized"><h1>管理画面</h1><p>管理画面にアクセスするにはログインが必要です。</p><div className="admin-actions"><Link href="/login?redirect=/admin" className="admin-button">ログイン</Link><Link href="/" className="admin-button secondary">トップへ戻る</Link></div></div>;
  if (!allowed) return <div className="admin-unauthorized"><h1>アクセス権限がありません</h1><p>このアカウントには管理画面へのアクセス権が設定されていません。</p><Link href="/" className="admin-button">神社を探す</Link></div>;
  const links = [["/admin", "ダッシュボード"], ["/admin/contributions", "投稿審査"], ["/admin/shrines", "神社"], ["/admin/deities", "神様"], ["/admin/figures", "人物"], ["/admin/lineages", "系統"], ["/admin/benefits", "御利益"], ["/admin/sources", "情報源"]];
  return <div className="admin-shell"><aside className="admin-sidebar" aria-label="管理画面ナビゲーション"><div className="admin-sidebar-header"><Link href="/admin" className="admin-logo">神社御縁<span>管理画面</span></Link></div><nav>{links.map(([href, label]) => <Link key={href} href={href} className="admin-nav-link">{label}</Link>)}</nav><div className="admin-sidebar-footer"><p className="admin-user">{user.email}</p><Link href="/" className="admin-nav-link">サイトトップへ</Link></div></aside><main className="admin-main"><p className="admin-ethics-note" role="note">情報は実在確認と出典を併記し、由緒・御利益は伝承・信仰として記述してください。効能を断定せず、未確認情報は公開しないでください。</p>{children}</main></div>;
}

export function AdminListPage({ entity: entityProp }: { entity?: AdminEntity }) {
  const params = useSearchParams();
  const router = useRouter();
  const entity = entityProp ?? resolveEntity(params.get("entity")) ?? "shrines";
  const pageParam = parseAdminPage(params.get("page") ?? undefined);
  const query = params.get("q") ?? "";
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [count, setCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<Prefecture[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const currentPage = clampAdminPage(pageParam, count, pageSize);
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  useEffect(() => {
    let active = true;
    const load = async () => {
      const result = entity === "shrines" ? await getAdminShrines(pageParam, query)
        : entity === "deities" ? await getAdminDeities(pageParam, query)
        : entity === "historical_figures" ? await getAdminFigures(pageParam, query)
        : entity === "lineages" ? await getAdminLineagesPage(pageParam, query)
        : entity === "benefits" ? await getAdminBenefitsPage(pageParam, query)
        : await getAdminSources(pageParam, query);
      if (!active) return;
      setData(result.data as unknown as Record<string, unknown>[]);
      setCount(result.count);
      setPageSize(result.pageSize);
      setLoading(false);
      if (entity === "shrines") {
        const [prefectures, allMunicipalities] = await Promise.all([getPrefectures(), getMunicipalities()]);
        if (active) { setPrefs(prefectures); setMunicipalities(allMunicipalities); }
      }
    };
    void load().catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [entity, pageParam, query]);
  function pageHref(page: number) {
    const next = new URLSearchParams(params.toString());
    if (page > 1) next.set("page", String(page)); else next.delete("page");
    return `/admin/${ENTITY[entity].path}${next.size ? `?${next}` : ""}`;
  }
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    router.push(`/admin/${ENTITY[entity].path}${term ? `?q=${encodeURIComponent(term)}` : ""}`);
  }
  const columns = entity === "shrines" ? ["名前", "読み", "地域", "公開状態"] : entity === "deities" ? ["名前", "読み", "別名", "公開状態"] : entity === "sources" ? ["名前", "URL", "確認日"] : ["名前", "読み", "公開状態"];
  return <><div className="admin-page-header"><h1>{ENTITY[entity].label}一覧</h1><Link href={`/admin/create?entity=${entity}`} className="admin-button">新規作成</Link></div><form onSubmit={search} className="admin-toolbar"><div className="admin-search"><input type="search" name="q" defaultValue={query} placeholder="名前で検索" aria-label="検索"/><button type="submit" className="admin-button secondary">検索</button></div></form>{loading ? <p className="admin-note" role="status">読み込み中…</p> : data.length === 0 ? <div className="admin-empty">該当するデータがありません。</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{data.map((row) => {
    const id = String(row.id);
    const path = `/admin/record?entity=${entity}&id=${encodeURIComponent(id)}`;
    const published = row.is_published ? <span className="admin-badge published">公開中</span> : <span className="admin-badge draft">下書き</span>;
    return <tr key={id}><td><Link href={path}>{String(row.name ?? "")}</Link></td>{entity === "sources" ? <><td>{String(row.url ?? "—")}</td><td>{String(row.last_verified_at ?? "—")}</td></> : <><td>{String(row.reading ?? "—")}</td>{entity === "shrines" && <td>{[prefs.find((item) => item.id === row.prefecture_id)?.name, municipalities.find((item) => item.id === row.municipality_id)?.name].filter(Boolean).join(" / ") || "—"}</td>}{entity === "deities" && <td>{Array.isArray(row.aliases) ? row.aliases.join("、") : "—"}</td>}<td>{published}</td></>}</tr>;
  })}</tbody></table></div>}{totalPages > 1 && <nav className="admin-pagination" aria-label="ページネーション">{getPageNumbers(currentPage, totalPages).map((number) => number === currentPage ? <span key={number} className="active" aria-current="page">{number}</span> : <Link key={number} href={pageHref(number)}>{number}</Link>)}</nav>}<p style={{ marginTop: "var(--sp-4)", color: "var(--muted)", fontSize: "14px" }}>全 {count} 件</p></>;
}

function EditField({ field, value }: { field: typeof ENTITY[AdminEntity]["fields"][number]; value: unknown }) {
  const common = { id: field.name, name: field.name, defaultValue: String(value ?? "") };
  if (field.name === "source_type") return <div className="admin-field"><label htmlFor={field.name}>{field.label}</label><select {...common}>{SOURCE_TYPES.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></div>;
  return <div className="admin-field"><label htmlFor={field.name}>{field.label}</label>{field.rows ? <textarea {...common} rows={field.rows}/> : <input {...common} type={field.type ?? "text"} step={field.type === "number" ? "any" : undefined}/>}</div>;
}

export function AdminRecordPage({ create = false, entity: entityProp }: { create?: boolean; entity?: AdminEntity }) {
  const params = useSearchParams();
  const router = useRouter();
  const entity = entityProp ?? resolveEntity(params.get("entity"));
  const id = create ? null : params.get("id");
  const [record, setRecord] = useState<Record<string, unknown> | null>(create ? {} : null);
  const [prefs, setPrefs] = useState<Prefecture[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!entity) return;
    let active = true;
    const load = async () => {
      if (entity === "shrines") {
        const [prefectures, allMunicipalities] = await Promise.all([getPrefectures(), getMunicipalities()]);
        if (active) { setPrefs(prefectures); setMunicipalities(allMunicipalities); }
      }
      if (create) { if (active) setRecord(entity === "sources" ? { source_type: "other", last_verified_at: new Date().toISOString().slice(0, 10) } : {}); return; }
      if (!id) { if (active) setError("対象のデータが指定されていません。"); return; }
      const found = entity === "shrines" ? await getAdminShrine(id)
        : entity === "deities" ? await getAdminDeity(id)
        : entity === "historical_figures" ? await getAdminFigure(id)
        : entity === "lineages" ? await getAdminLineage(id)
        : entity === "benefits" ? await getAdminBenefit(id)
        : await getAdminSource(id);
      if (active) { if (found) setRecord(found as unknown as Record<string, unknown>); else setError("対象のデータが見つかりませんでした。"); }
    };
    void load().catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "読み込みに失敗しました。"); });
    return () => { active = false; };
  }, [entity, id, create]);
  if (!entity) return <p className="admin-error">編集対象が正しく指定されていません。</p>;
  if (error) return <p className="admin-error" role="alert">{error}</p>;
  if (!record) return <p className="admin-note" role="status">読み込み中…</p>;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const form = new FormData(event.currentTarget);
      if (!entity) return;
      const result = id ? entity === "shrines" ? await updateShrine(id, form) : await updateEntity(entity, id, form)
        : entity === "shrines" ? await createShrine(form) : await createEntity(entity, form);
      if (!result.success) { setError(result.error); return; }
      const recordId = id ?? result.id;
      if (recordId) router.push(`/admin/record?entity=${entity}&id=${encodeURIComponent(recordId)}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "保存に失敗しました。"); }
    finally { setPending(false); }
  }
  async function remove() {
    if (!id || !entity || !window.confirm("このデータを削除しますか？この操作は元に戻せません。")) return;
    const result = entity === "shrines" ? await deleteShrine(id) : await deleteEntity(entity, id);
    if (result.success) router.push(`/admin/${ENTITY[entity].path}`); else setError(result.error);
  }
  const config = ENTITY[entity];
  return <><div className="admin-page-header"><h1>{id ? `${config.label}を編集: ${String(record.name ?? "")}` : `${config.label}を新規作成`}</h1>{id && <button type="button" className="admin-button danger" onClick={() => void remove()}>削除</button>}</div><form onSubmit={submit} className="admin-form">{error && <p className="admin-error" role="alert">{error}</p>}{config.fields.map((field) => {
    if (field.name === "prefecture_id" || field.name === "municipality_id") {
      const options = field.name === "prefecture_id" ? prefs : municipalities;
      return <div className="admin-field" key={field.name}><label htmlFor={field.name}>{field.label}</label><select id={field.name} name={field.name} defaultValue={String(record[field.name] ?? "")}><option value="">選択してください</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></div>;
    }
    const value = field.name === "aliases" && Array.isArray(record.aliases) ? record.aliases.join(", ") : record[field.name];
    return <EditField key={field.name} field={field} value={value}/>;
  })}{entity !== "sources" && <div className="admin-field checkbox"><input id="is_published" name="is_published" type="checkbox" defaultChecked={Boolean(record.is_published)}/><label htmlFor="is_published">公開する</label></div>}<div className="admin-form-actions"><button type="submit" className="admin-button" disabled={pending} aria-busy={pending}>{pending ? "保存中…" : id ? "更新" : "作成"}</button><Link href={`/admin/${config.path}`} className="admin-button secondary">一覧へ戻る</Link></div></form>{id && entity === "shrines" && <ShrineRelationManager id={id} />}{id && entity === "deities" && <DeityRelationManager id={id} />}</>;
}
