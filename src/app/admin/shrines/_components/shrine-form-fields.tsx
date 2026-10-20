import type { Prefecture, Municipality, AdminShrine } from "@/lib/adminData";

type ShrineFormFieldsProps = {
  prefectures: Prefecture[];
  municipalities: Municipality[];
  defaultValues?: Partial<AdminShrine>;
};

export default function ShrineFormFields({ prefectures, municipalities, defaultValues }: ShrineFormFieldsProps) {
  return (
    <>
      <div className="admin-field">
        <span className="label">入力上の注意</span>
        <p className="hint">
          由緒・御利益などの説明文は『〜と伝えられます』の形式を保ってください。
        </p>
      </div>

      <div className="admin-field">
        <label htmlFor="name">神社名</label>
        <input id="name" name="name" type="text" defaultValue={defaultValues?.name ?? ""} required />
      </div>

      <div className="admin-field">
        <label htmlFor="reading">読み</label>
        <input id="reading" name="reading" type="text" defaultValue={defaultValues?.reading ?? ""} />
      </div>

      <div className="admin-field">
        <label htmlFor="slug">スラッグ</label>
        <input id="slug" name="slug" type="text" defaultValue={defaultValues?.slug ?? ""} />
      </div>

      <div className="admin-field">
        <label htmlFor="prefecture_id">都道府県</label>
        <select id="prefecture_id" name="prefecture_id" defaultValue={defaultValues?.prefecture_id ?? ""}>
          <option value="">選択してください</option>
          {prefectures.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="admin-field">
        <label htmlFor="municipality_id">市区町村</label>
        <select id="municipality_id" name="municipality_id" defaultValue={defaultValues?.municipality_id ?? ""}>
          <option value="">選択してください</option>
          {municipalities.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="admin-field">
        <label htmlFor="address">住所</label>
        <input id="address" name="address" type="text" defaultValue={defaultValues?.address ?? ""} />
      </div>

      <div className="admin-field">
        <label htmlFor="latitude">緯度</label>
        <input id="latitude" name="latitude" type="number" step="any" defaultValue={defaultValues?.latitude ?? ""} />
      </div>

      <div className="admin-field">
        <label htmlFor="longitude">経度</label>
        <input id="longitude" name="longitude" type="number" step="any" defaultValue={defaultValues?.longitude ?? ""} />
      </div>

      <div className="admin-field">
        <label htmlFor="official_url">公式URL</label>
        <input id="official_url" name="official_url" type="url" defaultValue={defaultValues?.official_url ?? ""} />
      </div>

      <div className="admin-field">
        <label htmlFor="founding_description">創建・由来</label>
        <textarea id="founding_description" name="founding_description" rows={4} defaultValue={defaultValues?.founding_description ?? ""} />
      </div>

      <div className="admin-field">
        <label htmlFor="history">歴史</label>
        <textarea id="history" name="history" rows={4} defaultValue={defaultValues?.history ?? ""} />
      </div>

      <div className="admin-field">
        <label htmlFor="name_origin">名前の由来</label>
        <textarea id="name_origin" name="name_origin" rows={3} defaultValue={defaultValues?.name_origin ?? ""} />
      </div>

      <div className="admin-field">
        <label htmlFor="cultural_properties">文化財</label>
        <textarea id="cultural_properties" name="cultural_properties" rows={3} defaultValue={defaultValues?.cultural_properties ?? ""} />
      </div>

      <div className="admin-field">
        <label htmlFor="access_info">アクセス</label>
        <textarea id="access_info" name="access_info" rows={3} defaultValue={defaultValues?.access_info ?? ""} />
      </div>

      <div className="admin-field">
        <label htmlFor="parking_info">駐車場</label>
        <textarea id="parking_info" name="parking_info" rows={2} defaultValue={defaultValues?.parking_info ?? ""} />
      </div>

      <div className="admin-field">
        <label htmlFor="worship_hours">参拝時間</label>
        <textarea id="worship_hours" name="worship_hours" rows={2} defaultValue={defaultValues?.worship_hours ?? ""} />
      </div>

      <div className="admin-field checkbox">
        <input
          id="is_published"
          name="is_published"
          type="checkbox"
          defaultChecked={defaultValues?.is_published ?? false}
        />
        <label htmlFor="is_published">公開する</label>
      </div>
    </>
  );
}
