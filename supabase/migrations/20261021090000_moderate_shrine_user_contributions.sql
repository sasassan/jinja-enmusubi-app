-- Require review before new community contributions become public.
-- Existing published rows remain published; this changes only the default for new rows.
alter table public.shrine_user_contributions
  alter column status set default 'pending';

alter table public.shrine_user_contributions
  drop constraint if exists shrine_user_contributions_status_check;

alter table public.shrine_user_contributions
  add constraint shrine_user_contributions_status_check
  check (status in ('pending', 'published', 'hidden'));

-- Contributors can only submit pending content, regardless of client-supplied status.
drop policy if exists "users insert own shrine contributions" on public.shrine_user_contributions;
create policy "users insert own pending shrine contributions"
  on public.shrine_user_contributions for insert to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and exists (
      select 1 from public.shrines
      where shrines.id = shrine_user_contributions.shrine_id
        and shrines.is_published = true
    )
  );

-- Allow users to read their own pending contributions and receive INSERT ... RETURNING.
create policy "users read own shrine contributions"
  on public.shrine_user_contributions for select to authenticated
  using (auth.uid() = user_id);

-- Admins can review and publish submissions via the existing is_admin() role check.
create policy "admins manage shrine contributions"
  on public.shrine_user_contributions for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Contributors may edit only pending submissions. They cannot publish their own content
-- by changing the status field through the client-side Supabase API.
drop policy if exists "users update own shrine contributions" on public.shrine_user_contributions;
create policy "users update own pending shrine contributions"
  on public.shrine_user_contributions for update to authenticated
  using (auth.uid() = user_id and status = 'pending')
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and exists (
      select 1 from public.shrines
      where shrines.id = shrine_user_contributions.shrine_id
        and shrines.is_published = true
    )
  );
