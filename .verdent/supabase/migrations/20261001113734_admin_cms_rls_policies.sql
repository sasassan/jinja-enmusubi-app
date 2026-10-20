-- Phase 4 管理画面 CMS 用 RLS ポリシー
-- 管理者（is_admin()）に対し、神社・神様・人物・系統・御利益・出典・写真・
-- 各中間テーブルの全操作を許可する。

-- shrines
grant select, insert, update, delete on public.shrines to authenticated;
create policy "admins manage shrines"
  on public.shrines for all
  using (public.is_admin())
  with check (public.is_admin());

-- deities
grant select, insert, update, delete on public.deities to authenticated;
create policy "admins manage deities"
  on public.deities for all
  using (public.is_admin())
  with check (public.is_admin());

-- historical_figures
grant select, insert, update, delete on public.historical_figures to authenticated;
create policy "admins manage historical figures"
  on public.historical_figures for all
  using (public.is_admin())
  with check (public.is_admin());

-- lineages
grant select, insert, update, delete on public.lineages to authenticated;
create policy "admins manage lineages"
  on public.lineages for all
  using (public.is_admin())
  with check (public.is_admin());

-- benefits
grant select, insert, update, delete on public.benefits to authenticated;
create policy "admins manage benefits"
  on public.benefits for all
  using (public.is_admin())
  with check (public.is_admin());

-- sources
grant select, insert, update, delete on public.sources to authenticated;
create policy "admins manage sources"
  on public.sources for all
  using (public.is_admin())
  with check (public.is_admin());

-- shrine_deities
grant select, insert, update, delete on public.shrine_deities to authenticated;
create policy "admins manage shrine deities"
  on public.shrine_deities for all
  using (public.is_admin())
  with check (public.is_admin());

-- shrine_figures
grant select, insert, update, delete on public.shrine_figures to authenticated;
create policy "admins manage shrine figures"
  on public.shrine_figures for all
  using (public.is_admin())
  with check (public.is_admin());

-- shrine_lineages
grant select, insert, update, delete on public.shrine_lineages to authenticated;
create policy "admins manage shrine lineages"
  on public.shrine_lineages for all
  using (public.is_admin())
  with check (public.is_admin());

-- shrine_benefits
grant select, insert, update, delete on public.shrine_benefits to authenticated;
create policy "admins manage shrine benefits"
  on public.shrine_benefits for all
  using (public.is_admin())
  with check (public.is_admin());

-- shrine_sources
grant select, insert, update, delete on public.shrine_sources to authenticated;
create policy "admins manage shrine sources"
  on public.shrine_sources for all
  using (public.is_admin())
  with check (public.is_admin());

-- shrine_images
grant select, insert, update, delete on public.shrine_images to authenticated;
create policy "admins manage shrine images"
  on public.shrine_images for all
  using (public.is_admin())
  with check (public.is_admin());

-- digital_goshuin_settings （既存ポリシーは読み取りのみのため、管理者用 all ポリシーを追加）
grant select, insert, update, delete on public.digital_goshuin_settings to authenticated;
create policy "admins manage digital goshuin settings all"
  on public.digital_goshuin_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- prefectures / municipalities はマスター。管理者も既存 public read を使用。
-- ただし新規作成・更新を許可する場合は以下を有効化する（Phase 4 では読み取りのみ）。
-- grant insert, update, delete on public.prefectures to authenticated;
-- grant insert, update, delete on public.municipalities to authenticated;