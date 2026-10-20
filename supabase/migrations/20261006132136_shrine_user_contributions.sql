create table if not exists public.shrine_user_contributions (
  id uuid primary key default gen_random_uuid(),
  shrine_id uuid not null references public.shrines(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  contribution_type text not null check (contribution_type in ('deity', 'history', 'benefit', 'photo_ocr', 'other')),
  content text not null,
  source_image_path text,
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shrine_user_contributions_shrine_created_idx
  on public.shrine_user_contributions (shrine_id, created_at desc);

create or replace function public.set_shrine_user_contribution_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shrine_user_contributions_set_updated_at on public.shrine_user_contributions;
create trigger shrine_user_contributions_set_updated_at
  before update on public.shrine_user_contributions
  for each row execute function public.set_shrine_user_contribution_updated_at();

alter table public.shrine_user_contributions enable row level security;

grant select on public.shrine_user_contributions to anon, authenticated;
grant insert, update, delete on public.shrine_user_contributions to authenticated;

drop policy if exists "public reads published shrine contributions" on public.shrine_user_contributions;
create policy "public reads published shrine contributions"
  on public.shrine_user_contributions for select
  using (
    status = 'published'
    and exists (
      select 1 from public.shrines
      where shrines.id = shrine_user_contributions.shrine_id
        and shrines.is_published = true
    )
  );

drop policy if exists "users insert own shrine contributions" on public.shrine_user_contributions;
create policy "users insert own shrine contributions"
  on public.shrine_user_contributions for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.shrines
      where shrines.id = shrine_user_contributions.shrine_id
        and shrines.is_published = true
    )
  );

drop policy if exists "users update own shrine contributions" on public.shrine_user_contributions;
create policy "users update own shrine contributions"
  on public.shrine_user_contributions for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.shrines
      where shrines.id = shrine_user_contributions.shrine_id
        and shrines.is_published = true
    )
  );

drop policy if exists "users delete own shrine contributions" on public.shrine_user_contributions;
create policy "users delete own shrine contributions"
  on public.shrine_user_contributions for delete to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shrine-contribution-sources', 'shrine-contribution-sources', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users read own shrine contribution sources" on storage.objects;
create policy "users read own shrine contribution sources"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'shrine-contribution-sources'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users upload own shrine contribution sources" on storage.objects;
create policy "users upload own shrine contribution sources"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'shrine-contribution-sources'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete own shrine contribution sources" on storage.objects;
create policy "users delete own shrine contribution sources"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'shrine-contribution-sources'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
