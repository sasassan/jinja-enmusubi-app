-- Phase 1: 神様の関連リレーション + あいまい検索(表記ゆれ対応)のための拡張

create extension if not exists pg_trgm;

create table public.deity_relations (
  deity_id uuid not null references public.deities(id) on delete cascade,
  related_deity_id uuid not null references public.deities(id) on delete cascade,
  relation_type text not null,
  note text,
  primary key (deity_id, related_deity_id),
  check (deity_id <> related_deity_id)
);

alter table public.deity_relations enable row level security;

create policy "public reads deity relations"
  on public.deity_relations for select
  using (
    exists (select 1 from public.deities d where d.id = deity_id and d.is_published)
    and exists (select 1 from public.deities d2 where d2.id = related_deity_id and d2.is_published)
  );

grant select on public.deity_relations to anon;

-- 表記ゆれ・読み仮名のあいまい検索用インデックス
create index if not exists deities_name_trgm_idx on public.deities using gin (name gin_trgm_ops);
create index if not exists deities_reading_trgm_idx on public.deities using gin (reading gin_trgm_ops);
create index if not exists historical_figures_name_trgm_idx on public.historical_figures using gin (name gin_trgm_ops);
create index if not exists historical_figures_reading_trgm_idx on public.historical_figures using gin (reading gin_trgm_ops);
create index if not exists shrines_name_trgm_idx on public.shrines using gin (name gin_trgm_ops);
create index if not exists shrines_history_trgm_idx on public.shrines using gin (history gin_trgm_ops);
create index if not exists shrines_founding_trgm_idx on public.shrines using gin (founding_description gin_trgm_ops);
create index if not exists shrines_name_origin_trgm_idx on public.shrines using gin (name_origin gin_trgm_ops);
create index if not exists shrines_cultural_properties_trgm_idx on public.shrines using gin (cultural_properties gin_trgm_ops);

-- 系統・御利益検索用の補助インデックス(多対多の絞り込み高速化)
create index if not exists shrine_deities_deity_idx on public.shrine_deities (deity_id);
create index if not exists shrine_lineages_lineage_idx on public.shrine_lineages (lineage_id);
create index if not exists shrine_benefits_benefit_idx on public.shrine_benefits (benefit_id);
create index if not exists shrine_figures_figure_idx on public.shrine_figures (figure_id);
