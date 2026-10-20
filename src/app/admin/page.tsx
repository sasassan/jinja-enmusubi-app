import Link from "next/link";

const sections = [
  { href: "/admin/shrines", label: "神社", desc: "神社データの作成・編集・削除、御祭神・系統・御利益・出典の紐付け" },
  { href: "/admin/deities", label: "神様", desc: "神様データの作成・編集・削除" },
  { href: "/admin/figures", label: "人物", desc: "歴史的人物データの作成・編集・削除" },
  { href: "/admin/lineages", label: "系統", desc: "神社系統マスタの管理" },
  { href: "/admin/benefits", label: "御利益", desc: "御利益マスタの管理" },
  { href: "/admin/sources", label: "情報源", desc: "URL・取得日付きの出典管理" },
];

export default function AdminDashboardPage() {
  return (
    <>
      <div className="admin-page-header">
        <h1>管理画面トップ</h1>
      </div>
      <p className="admin-note" style={{ marginBottom: "var(--sp-5)" }}>
        データの追加・修正・公開設定を行えます。公開設定がオフのデータは一般ユーザーに表示されません。
      </p>
      <div className="admin-two-col">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="admin-button secondary" style={{ alignItems: "flex-start", flexDirection: "column", padding: "var(--sp-4)" }}>
            <strong style={{ fontSize: 17, marginBottom: 4 }}>{s.label}</strong>
            <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 400 }}>{s.desc}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
