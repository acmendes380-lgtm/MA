-- mendos/supabase/migrations/005_school_schema.sql

create table if not exists public.subjects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  color text not null default '#8b5cf6',
  created_at timestamptz default now()
);

create table if not exists public.assignments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  subject_id uuid references public.subjects on delete cascade not null,
  title text not null,
  due_date date not null,
  status text not null default 'pending'
    check (status in ('pending','submitted','graded')),
  grade numeric(5,2),
  notes text
);

create table if not exists public.exams (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  subject_id uuid references public.subjects on delete cascade not null,
  title text not null,
  date date not null,
  status text not null default 'upcoming'
    check (status in ('upcoming','completed')),
  grade numeric(5,2),
  notes text
);

create table if not exists public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  subject_id uuid references public.subjects on delete cascade not null,
  duration_minutes int not null,
  notes text,
  date date not null default current_date
);

alter table public.subjects enable row level security;
alter table public.assignments enable row level security;
alter table public.exams enable row level security;
alter table public.study_sessions enable row level security;

create policy "Users own their subjects" on public.subjects for all using (user_id = auth.uid());
create policy "Users own their assignments" on public.assignments for all using (user_id = auth.uid());
create policy "Users own their exams" on public.exams for all using (user_id = auth.uid());
create policy "Users own their study sessions" on public.study_sessions for all using (user_id = auth.uid());
