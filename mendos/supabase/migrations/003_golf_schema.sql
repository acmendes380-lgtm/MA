-- mendos/supabase/migrations/003_golf_schema.sql

create table if not exists public.golf_rounds (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null default current_date,
  course text not null,
  score int not null,
  fairways_hit int not null default 0,
  fairways_total int not null default 14,
  gir int not null default 0,
  putts int not null default 36,
  scrambling int,
  penalties int not null default 0,
  driving_distance int,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.golf_coach_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.golf_rounds enable row level security;
alter table public.golf_coach_messages enable row level security;

create policy "Users own their golf rounds"
  on public.golf_rounds for all using (user_id = auth.uid());
create policy "Users own their golf coach messages"
  on public.golf_coach_messages for all using (user_id = auth.uid());
