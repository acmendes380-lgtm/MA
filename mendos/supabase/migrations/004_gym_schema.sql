-- mendos/supabase/migrations/004_gym_schema.sql

create table if not exists public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null default current_date,
  type text not null default 'strength'
    check (type in ('strength','cardio','flexibility','other')),
  duration int not null default 60,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.workout_exercises (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts on delete cascade not null,
  name text not null,
  sets int not null default 3,
  reps int not null default 10,
  weight numeric(6,2),
  order_index int not null default 0
);

create table if not exists public.bodyweight_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  weight numeric(5,1) not null,
  unique(user_id, date)
);

create table if not exists public.cardio_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null default current_date,
  type text not null default 'run',
  duration int not null,
  distance numeric(5,2),
  calories int
);

alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.bodyweight_logs enable row level security;
alter table public.cardio_logs enable row level security;

create policy "Users own their workouts" on public.workouts for all using (user_id = auth.uid());
create policy "Users own their workout exercises" on public.workout_exercises for all
  using (workout_id in (select id from public.workouts where user_id = auth.uid()));
create policy "Users own their bodyweight logs" on public.bodyweight_logs for all using (user_id = auth.uid());
create policy "Users own their cardio logs" on public.cardio_logs for all using (user_id = auth.uid());
