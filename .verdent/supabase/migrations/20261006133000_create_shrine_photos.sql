create table if not exists public.shrine_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shrine_id uuid not null references public.shrines(id) on delete cascade,
  visit_id uuid references public.visits(id) on delete set null,
  storage_path text not null unique,
  caption text,
  taken_at timestamptz,
  photographer_name text not null default '参拝者',
  created_at timestamptz not null default now()
);

create index if not exists shrine_photos_shrine_created_idx
  on public.shrine_photos (shrine_id, created_at desc);

create index if not exists shrine_photos_user_created_idx
  on public.shrine_photos (user_id, created_at desc);

alter table public.shrine_photos enable row level security;

grant select on public.shrine_photos to anon, authenticated;
grant insert, delete on public.shrine_photos to authenticated;

drop policy if exists "public reads photos of published shrines" on public.shrine_photos;
create policy "public reads photos of published shrines"
  on public.shrine_photos for select
  using (
    exists (
      select 1 from public.shrines
      where shrines.id = shrine_photos.shrine_id
        and shrines.is_published = true
    )
  );

drop policy if exists "users upload own shrine photos" on public.shrine_photos;
create policy "users upload own shrine photos"
  on public.shrine_photos for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.shrines
      where shrines.id = shrine_photos.shrine_id
        and shrines.is_published = true
    )
    and (
      visit_id is null
      or exists (
        select 1 from public.visits
        where visits.id = shrine_photos.visit_id
          and visits.user_id = auth.uid()
          and visits.shrine_id = shrine_photos.shrine_id
      )
    )
  );

drop policy if exists "users delete own shrine photos" on public.shrine_photos;
create policy "users delete own shrine photos"
  on public.shrine_photos for delete to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shrine-photos',
  'shrine-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users upload own shrine photos" on storage.objects;
create policy "users upload own shrine photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'shrine-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete own shrine photos" on storage.objects;
create policy "users delete own shrine photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'shrine-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
