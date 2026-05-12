-- mendos/supabase/migrations/007_life_coach_schema.sql

create table if not exists public.life_coach_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.life_coach_messages enable row level security;

create policy "Users own their life coach messages"
  on public.life_coach_messages for all using (user_id = auth.uid());
