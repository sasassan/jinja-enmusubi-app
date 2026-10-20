create table if not exists public.deity_lineages (
  deity_id uuid not null references public.deities(id) on delete cascade,
  lineage_id uuid not null references public.lineages(id) on delete cascade,
  primary key (deity_id, lineage_id)
);

create table if not exists public.deity_benefits (
  deity_id uuid not null references public.deities(id) on delete cascade,
  benefit_id uuid not null references public.benefits(id) on delete cascade,
  primary key (deity_id, benefit_id)
);

alter table public.deity_lineages enable row level security;
alter table public.deity_benefits enable row level security;

grant select on public.deity_lineages to anon, authenticated;
grant select on public.deity_benefits to anon, authenticated;
grant insert, update, delete on public.deity_lineages to authenticated;
grant insert, update, delete on public.deity_benefits to authenticated;

create policy "public reads published deity lineages"
  on public.deity_lineages for select
  using (
    exists (select 1 from public.deities d where d.id = deity_id and d.is_published)
    and exists (select 1 from public.lineages l where l.id = lineage_id and l.is_published)
  );

create policy "admins manage deity lineages"
  on public.deity_lineages for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "public reads published deity benefits"
  on public.deity_benefits for select
  using (
    exists (select 1 from public.deities d where d.id = deity_id and d.is_published)
    and exists (select 1 from public.benefits b where b.id = benefit_id and b.is_published)
  );

create policy "admins manage deity benefits"
  on public.deity_benefits for all
  using (public.is_admin())
  with check (public.is_admin());
