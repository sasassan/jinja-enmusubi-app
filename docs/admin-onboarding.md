# 管理画面（CMS）管理者オンボーディング手順

Phase 4 の `/admin` 管理画面を利用するための手順です。

## 前提

- Supabase Auth でログイン済みで、Auth ユーザーのメールアドレスが `public.admin_allowlist` に `is_active = true` で登録されている必要があります。
- サーバーの管理者判定は `is_admin()` RPC、Server Actions の個別ガード、各CMSテーブルのRLSポリシーで二重化しています。画面側でも管理者状態を確認します。
- `admin_allowlist` は RLS 有効でアプリから直接読み書きできません。登録作業は管理者権限の Supabase Dashboard SQL Editor で行い、アプリからの登録UIは設けていません。

## 管理者の登録

1. 対象のメールアドレスで Supabase Auth アカウントを用意します。
2. Supabase Dashboard の SQL Editor を開き、Auth のメールアドレスと同じ小文字表記で次の SQL を実行します。

```sql
insert into public.admin_allowlist (email, is_active)
values ('admin@example.com', true)
on conflict (email) do update set is_active = true;
```

複数人を登録する場合:

```sql
insert into public.admin_allowlist (email, is_active)
values
  ('admin-a@example.com', true),
  ('admin-b@example.com', true)
on conflict (email) do update set is_active = true;
```

権限を一時停止する場合:

```sql
update public.admin_allowlist
set is_active = false
where email = 'admin@example.com';
```

登録を完全に取り消す場合:

```sql
delete from public.admin_allowlist
where email = 'admin@example.com';
```

`is_admin()` は JWT のメールアドレスと allowlist のメールを完全一致で比較します。登録したメールでログイン後、`/admin` にアクセスしてください。DB登録作業はこの手順を案内するだけで、本実装では実施していません。

## 管理画面の機能

| メニュー | 対象 | 操作 |
| --- | --- | --- |
| 神社 | `shrines` | 一覧、検索、ページング、作成、詳細・編集・物理削除。御祭神（role/表示順）、人物、系統、御利益、出典、写真URLの紐付け |
| 神様 | `deities` | 一覧、検索、ページング、作成、編集、物理削除。系統・御利益の紐付け |
| 人物 | `historical_figures` | 一覧、検索、ページング、作成、編集、物理削除 |
| 系統 | `lineages` | マスタ一覧、作成、編集、物理削除 |
| 御利益 | `benefits` | マスタ一覧、作成、編集、物理削除 |
| 情報源 | `sources` | 一覧、検索、ページング、作成、編集、物理削除（タイトル・URL・種別・確認日・メモ） |

各エンティティの公開フラグがオフの場合、一般ユーザー向けに公開されません。出典はタイトル・URL・確認日を記録し、神社詳細に関連付けることで根拠項目を記録できます。写真は現時点では画像URLとクレジットを管理し、ファイルアップロードは行いません。

## データ入力ガイド

- 実在確認できる情報だけを登録し、根拠となる出典と確認日を記録してください。架空の神社・神様・人物を作成しないでください。
- 由緒・御利益は「〜と伝えられます」「〜と信仰されています」などとし、効能を事実として断定しないでください。
- 外部URLには `http` または `https` のみ使用してください。
- 削除は物理削除で、確認ダイアログが表示されます。神社・神様等を削除すると外部キーのカスケードにより関係レコードも削除される場合があります。

管理画面は `robots: noindex, nofollow` です。未ログインの場合はログイン導線を、allowlist にないログインユーザーにはアクセス拒否と一般機能への導線を表示します。
