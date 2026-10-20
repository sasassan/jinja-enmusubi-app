-- セキュリティ修正: admin_allowlist の RLS 有効化 + digital_goshuin_settings のポリシー追加
--
-- 問題1: admin_allowlist は RLS 無効(rowsecurity=false)かつ authenticated に
--        INSERT/SELECT/UPDATE/DELETE が付与されており、任意の認証済みユーザーが
--        管理者リストを読み書きできる状態だった。
-- 対応 : authenticated/anon への権限を全て REVOKE し、RLS を有効化する。
--        ポリシーは追加しない(default deny)。管理者リストの読み書きは
--        service_role(バックエンド/ダッシュボード経由)に限定する。
--        管理者判定は SECURITY DEFINER 関数 public.is_admin() を介してのみ許可し、
--        アプリからは admin_allowlist の行を直接参照できないようにする。

revoke all on public.admin_allowlist from authenticated, anon;
alter table public.admin_allowlist enable row level security;

-- 管理者判定用ヘルパー関数(SECURITY DEFINER でテーブル所有者権限で実行し、
-- admin_allowlist に対する RLS の影響を受けずに判定できるようにする)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_allowlist a
    where a.email = (auth.jwt() ->> 'email')
      and a.is_active
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- 問題2: digital_goshuin_settings は RLS 有効だがポリシーが1件も無く、
--        default deny のため誰も読み書きできない(使えない)状態だった。
-- 対応 : 公開済み神社の設定は誰でも閲覧可能(公開SELECT)、
--        読み書き(発行設定の管理)は管理者のみ(is_admin())に限定する。

grant select on public.digital_goshuin_settings to anon;

create policy "public reads digital goshuin settings for published shrines"
  on public.digital_goshuin_settings for select
  using (exists (
    select 1 from public.shrines s
    where s.id = shrine_id and s.is_published
  ));

create policy "admins manage digital goshuin settings"
  on public.digital_goshuin_settings for all
  using (public.is_admin())
  with check (public.is_admin());
