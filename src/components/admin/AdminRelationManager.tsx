"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  getAdminBenefits,
  getAdminDeities,
  getAdminDeityRelations,
  getAdminFigures,
  getAdminLineages,
  getAdminShrineRelations,
  getAdminSources,
} from "@/lib/adminData";
import {
  addDeityBenefit,
  addDeityLineage,
  addShrineBenefit,
  addShrineDeity,
  addShrineFigure,
  addShrineImage,
  addShrineLineage,
  addShrineSource,
  removeDeityBenefit,
  removeDeityLineage,
  removeShrineBenefit,
  removeShrineDeity,
  removeShrineFigure,
  removeShrineImage,
  removeShrineLineage,
  removeShrineSource,
} from "@/lib/adminActions";
import type { ShrineDeityRole } from "@/lib/types";

type Result = { success: boolean; error?: string };
type Option = { id: string; name: string };
type Row = { key: string; label: string; detail?: string };
type Field = { name: string; label: string; type?: string; defaultValue?: string; options?: { value: string; label: string }[] };

function RelationPanel({
  title,
  rows,
  options = [],
  fields = [],
  onAdd,
  onRemove,
}: {
  title: string;
  rows: Row[];
  options?: Option[];
  fields?: Field[];
  onAdd: (form: FormData) => Promise<Result>;
  onRemove: (key: string) => Promise<Result>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const form = event.currentTarget;
      const result = await onAdd(new FormData(form));
      if (!result.success) setError(result.error ?? "保存に失敗しました。");
      else form.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存に失敗しました。");
    } finally {
      setPending(false);
    }
  }
  async function remove(key: string) {
    setPending(true);
    setError(null);
    try {
      const result = await onRemove(key);
      if (!result.success) setError(result.error ?? "削除に失敗しました。");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "削除に失敗しました。");
    } finally {
      setPending(false);
    }
  }
  return <section className="admin-section"><h2>{title}</h2><div className="admin-relation-list">{rows.map((row) => <div key={row.key} className="admin-relation-item"><div><div>{row.label}</div>{row.detail && <div className="admin-relation-meta">{row.detail}</div>}</div><button type="button" className="admin-button danger" disabled={pending} onClick={() => void remove(row.key)}>削除</button></div>)}{rows.length === 0 && <p className="hint">登録がありません。</p>}</div>{error && <p className="admin-error" role="alert">{error}</p>}<form onSubmit={add} className="admin-form"><div className="admin-field"><label htmlFor={`${title}-relation`}>{title}</label><select id={`${title}-relation`} name="relation_id" required defaultValue=""><option value="" disabled>選択してください</option>{options.filter((option) => !rows.some((row) => row.key === option.id)).map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></div>{fields.map((field) => <div className="admin-field" key={field.name}><label htmlFor={`${title}-${field.name}`}>{field.label}</label>{field.options ? <select id={`${title}-${field.name}`} name={field.name} defaultValue={field.defaultValue}>{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input id={`${title}-${field.name}`} name={field.name} type={field.type ?? "text"} defaultValue={field.defaultValue}/>}</div>)}<button type="submit" className="admin-button" disabled={pending}>{pending ? "処理中…" : "追加"}</button></form></section>;
}

export function ShrineRelationManager({ id }: { id: string }) {
  const [relations, setRelations] = useState<Awaited<ReturnType<typeof getAdminShrineRelations>>>(null);
  const [deities, setDeities] = useState<Option[]>([]);
  const [figures, setFigures] = useState<Option[]>([]);
  const [lineages, setLineages] = useState<Option[]>([]);
  const [benefits, setBenefits] = useState<Option[]>([]);
  const [sources, setSources] = useState<Option[]>([]);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    void Promise.all([getAdminShrineRelations(id), getAdminDeities(1), getAdminFigures(1), getAdminLineages(), getAdminBenefits(), getAdminSources(1)]).then(([nextRelations, deityRows, figureRows, lineageRows, benefitRows, sourceRows]) => {
      if (!active) return;
      setRelations(nextRelations);
      setDeities(deityRows.data.map(({ id, name }) => ({ id, name })));
      setFigures(figureRows.data.map(({ id, name }) => ({ id, name })));
      setLineages(lineageRows.map(({ id, name }) => ({ id, name })));
      setBenefits(benefitRows.map(({ id, name }) => ({ id, name })));
      setSources(sourceRows.data.map(({ id, name }) => ({ id, name })));
    }).catch(() => { if (active) setRelations(null); });
    return () => { active = false; };
  }, [id, version]);
  function withRefresh<T extends Result>(action: (form: FormData) => Promise<T>) {
    return async (form: FormData) => { const result = await action(form); if (result.success) setVersion((value) => value + 1); return result; };
  }
  function removeWithRefresh(action: (key: string) => Promise<Result>) {
    return async (key: string) => { const result = await action(key); if (result.success) setVersion((value) => value + 1); return result; };
  }
  if (!relations) return <p className="admin-note" role="status">関連情報を読み込み中…</p>;
  const roleOptions = [{ value: "principal", label: "主祭神" }, { value: "co_enshrined", label: "相殿神" }, { value: "enshrined", label: "配祀神" }, { value: "associated", label: "合祀神" }];
  const renderPanel = (title: string, values: { key: string; name: string | null; detail?: string | null }[], options: Option[], add: (relationId: string, form: FormData) => Promise<Result>, remove: (relationId: string) => Promise<Result>, fields: Field[] = []) => <RelationPanel key={title} title={title} rows={values.map((value) => ({ key: value.key, label: value.name ?? "不明", detail: value.detail ?? undefined }))} options={options} fields={fields} onAdd={withRefresh((form) => add(String(form.get("relation_id")), form))} onRemove={removeWithRefresh(remove)} />;
  return <>
    {renderPanel("御祭神", relations.deities.map((row) => ({ key: row.deity_id, name: row.deities?.name ?? null, detail: `${row.role} / 表示順 ${row.display_order}` })), deities, (deityId, form) => addShrineDeity(id, deityId, String(form.get("role")) as ShrineDeityRole, Number(form.get("display_order") ?? 0)), (deityId) => removeShrineDeity(id, deityId), [{ name: "role", label: "役割", options: roleOptions, defaultValue: "principal" }, { name: "display_order", label: "表示順", type: "number", defaultValue: "0" }])}
    {renderPanel("人物", relations.figures.map((row) => ({ key: row.figure_id, name: row.historical_figures?.name ?? null, detail: row.description })), figures, (figureId, form) => addShrineFigure(id, figureId, String(form.get("description") ?? "")), (figureId) => removeShrineFigure(id, figureId), [{ name: "description", label: "説明" }])}
    {renderPanel("系統", relations.lineages.map((row) => ({ key: row.lineage_id, name: row.lineages?.name ?? null })), lineages, (lineageId) => addShrineLineage(id, lineageId), (lineageId) => removeShrineLineage(id, lineageId))}
    {renderPanel("御利益", relations.benefits.map((row) => ({ key: row.benefit_id, name: row.benefits?.name ?? null, detail: row.description })), benefits, (benefitId, form) => addShrineBenefit(id, benefitId, String(form.get("description") ?? "")), (benefitId) => removeShrineBenefit(id, benefitId), [{ name: "description", label: "説明" }])}
    {renderPanel("出典", relations.sources.map((row) => ({ key: row.source_id, name: row.sources?.name ?? null, detail: row.field_name })), sources, (sourceId, form) => addShrineSource(id, sourceId, String(form.get("field_name") ?? "")), (sourceId) => removeShrineSource(id, sourceId), [{ name: "field_name", label: "項目名" }])}
    <ImageManager id={id} images={relations.images.map((image) => ({ key: image.id, label: image.image_url, detail: `alt: ${image.alt_text} / ${image.source_credit ?? ""} / 表示順 ${image.display_order}` }))} onRefresh={() => setVersion((value) => value + 1)} />
  </>;
}

function ImageManager({ id, images, onRefresh }: { id: string; images: Row[]; onRefresh: () => void }) {
  const [error, setError] = useState<string | null>(null);
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const result = await addShrineImage(id, String(form.get("image_url")), String(form.get("alt_text")), String(form.get("source_credit")), Number(form.get("display_order")));
    if (!result.success) setError(result.error ?? "保存できませんでした。"); else { setError(null); formElement.reset(); onRefresh(); }
  }
  return <section className="admin-section"><h2>写真</h2><div className="admin-relation-list">{images.map((image) => <div className="admin-relation-item" key={image.key}><div><div>{image.label}</div><div className="admin-relation-meta">{image.detail}</div></div><button type="button" className="admin-button danger" onClick={async () => { const result = await removeShrineImage(id, image.key); if (result.success) onRefresh(); else setError(result.error ?? "削除できませんでした。"); }}>削除</button></div>)}</div>{error && <p className="admin-error" role="alert">{error}</p>}<form className="admin-form" onSubmit={add}><label className="admin-field">画像URL<input type="url" name="image_url" required/></label><label className="admin-field">代替テキスト<input name="alt_text" required/></label><label className="admin-field">クレジット<input name="source_credit"/></label><label className="admin-field">表示順<input type="number" name="display_order" defaultValue="0"/></label><button className="admin-button" type="submit">画像を追加</button></form></section>;
}

export function DeityRelationManager({ id }: { id: string }) {
  const [relations, setRelations] = useState<Awaited<ReturnType<typeof getAdminDeityRelations>>>(null);
  const [lineages, setLineages] = useState<Option[]>([]);
  const [benefits, setBenefits] = useState<Option[]>([]);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    void Promise.all([getAdminDeityRelations(id), getAdminLineages(), getAdminBenefits()]).then(([nextRelations, lineageRows, benefitRows]) => {
      if (!active) return;
      setRelations(nextRelations);
      setLineages(lineageRows.map(({ id, name }) => ({ id, name })));
      setBenefits(benefitRows.map(({ id, name }) => ({ id, name })));
    }).catch(() => { if (active) setRelations(null); });
    return () => { active = false; };
  }, [id, version]);
  if (!relations) return <p className="admin-note" role="status">関連情報を読み込み中…</p>;
  const panel = (title: string, rows: { id: string; label: string }[], options: Option[], add: (key: string) => Promise<Result>, remove: (key: string) => Promise<Result>) => <RelationPanel key={title} title={title} rows={rows.map((row) => ({ key: row.id, label: row.label }))} options={options.filter((option) => !rows.some((row) => row.id === option.id))} onAdd={async (form) => { const result = await add(String(form.get("relation_id"))); if (result.success) setVersion((value) => value + 1); return result; }} onRemove={async (key) => { const result = await remove(key); if (result.success) setVersion((value) => value + 1); return result; }} />;
  return <>{panel("系統", relations.lineages.map((row) => ({ id: row.lineage_id, label: row.lineages?.name ?? "不明" })), lineages, (lineageId) => addDeityLineage(id, lineageId), (lineageId) => removeDeityLineage(id, lineageId))}{panel("御利益", relations.benefits.map((row) => ({ id: row.benefit_id, label: row.benefits?.name ?? "不明" })), benefits, (benefitId) => addDeityBenefit(id, benefitId), (benefitId) => removeDeityBenefit(id, benefitId))}</>;
}
