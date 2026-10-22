-- NOIR GLOSS: run once in Supabase → SQL Editor.
-- Then create the owner's login in Authentication → Users → "Add user".

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date date not null,
  start_min int not null check (start_min between 0 and 1440),
  duration int not null check (duration > 0),
  services text[] not null default '{}',
  vehicle text not null,
  name text not null,
  phone text not null,
  car_model text,
  notes text,
  price int not null default 0,
  status text not null default 'new'
    check (status in ('new','confirmed','in_progress','done','cancelled','no_show')),
  source text not null default 'website'
    check (source in ('website','phone','walk_in','whatsapp','instagram','block')),
  locale text
);

create index if not exists bookings_date_idx on public.bookings (date);

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null
);

alter table public.bookings enable row level security;
alter table public.settings enable row level security;

-- Website visitors may only create new website bookings.
drop policy if exists "public can book" on public.bookings;
create policy "public can book" on public.bookings
  for insert to anon
  with check (status = 'new' and source = 'website');

-- The signed-in owner manages everything.
drop policy if exists "owner full access" on public.bookings;
create policy "owner full access" on public.bookings
  for all to authenticated using (true) with check (true);

drop policy if exists "settings readable" on public.settings;
create policy "settings readable" on public.settings
  for select to anon, authenticated using (true);

drop policy if exists "owner edits settings" on public.settings;
create policy "owner edits settings" on public.settings
  for all to authenticated using (true) with check (true);

-- Visitors see only occupied time, never names or phones.
create or replace function public.busy_slots(from_date date, to_date date)
returns table (date date, start_min int, duration int, status text)
language sql security definer set search_path = public as $$
  select b.date, b.start_min, b.duration, b.status
  from public.bookings b
  where b.date between from_date and to_date
    and b.status not in ('cancelled', 'no_show');
$$;

grant execute on function public.busy_slots(date, date) to anon, authenticated;
