-- mendos/supabase/migrations/001_core_schema.sql

-- Profiles (auto-created on signup)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  preferences jsonb default '{}',
  created_at timestamptz default now()
);

-- Habits
create table if not exists public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  frequency text not null default 'daily',
  color text not null default '#3b82f6',
  target_streak int not null default 0,
  created_at timestamptz default now()
);

-- Habit logs
create table if not exists public.habit_logs (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references public.habits on delete cascade not null,
  user_id uuid references auth.users not null,
  date date not null,
  completed boolean not null default false,
  unique(habit_id, date)
);

-- Daily scores
create table if not exists public.daily_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  productivity_score int check (productivity_score between 0 and 100),
  focus_minutes int default 0,
  sleep_hours numeric(3,1),
  sleep_quality int check (sleep_quality between 1 and 5),
  notes text,
  unique(user_id, date)
);

-- Quick notes (one per user)
create table if not exists public.quick_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  content text not null default '',
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Daily goals
create table if not exists public.daily_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  text text not null,
  date date not null,
  completed boolean not null default false,
  order_index int not null default 0
);

-- AI insights cache
create table if not exists public.ai_insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  content text not null,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.daily_scores enable row level security;
alter table public.quick_notes enable row level security;
alter table public.daily_goals enable row level security;
alter table public.ai_insights enable row level security;

-- RLS Policies
create policy "Users own their profile"
  on public.profiles for all using (id = auth.uid());

create policy "Users own their habits"
  on public.habits for all using (user_id = auth.uid());

create policy "Users own their habit logs"
  on public.habit_logs for all using (user_id = auth.uid());

create policy "Users own their daily scores"
  on public.daily_scores for all using (user_id = auth.uid());

create policy "Users own their quick notes"
  on public.quick_notes for all using (user_id = auth.uid());

create policy "Users own their daily goals"
  on public.daily_goals for all using (user_id = auth.uid());

create policy "Users own their ai insights"
  on public.ai_insights for all using (user_id = auth.uid());

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
