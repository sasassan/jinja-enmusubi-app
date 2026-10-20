-- 参照用マスタテーブルへの匿名 SELECT ポリシー
create policy "public reads prefectures"
  on public.prefectures for select using (true);

create policy "public reads municipalities"
  on public.municipalities for select using (true);

create policy "public reads published shrine lineages"
  on public.shrine_lineages for select
  using (exists (select 1 from public.shrines where id = shrine_id and is_published));

create policy "public reads published shrine benefits"
  on public.shrine_benefits for select
  using (exists (select 1 from public.shrines where id = shrine_id and is_published));

create policy "public reads published shrine figures"
  on public.shrine_figures for select
  using (exists (select 1 from public.shrines where id = shrine_id and is_published));

create policy "public reads published shrine images"
  on public.shrine_images for select
  using (exists (select 1 from public.shrines where id = shrine_id and is_published));

create policy "public reads published shrine sources"
  on public.shrine_sources for select
  using (exists (select 1 from public.shrines where id = shrine_id and is_published));

create policy "public reads published sources"
  on public.sources for select using (true);

create policy "public reads published historical figures"
  on public.historical_figures for select using (is_published);

-- profiles テーブルのポリシー
create policy "users read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);