alter table public.shrines
  add column if not exists latitude double precision generated always as (st_y(location::geometry)) stored,
  add column if not exists longitude double precision generated always as (st_x(location::geometry)) stored;