-- mendos/supabase/migrations/002_projects_schema.sql

create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  category text not null default 'personal'
    check (category in ('personal','business','school','golf','gym','content')),
  status text not null default 'active'
    check (status in ('active','paused','completed','archived')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  deadline date,
  progress int not null default 0 check (progress between 0 and 100),
  color text not null default '#3b82f6',
  created_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  project_id uuid references public.projects on delete cascade,
  parent_task_id uuid references public.tasks on delete cascade,
  title text not null,
  status text not null default 'todo'
    check (status in ('todo','in_progress','done')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  deadline date,
  order_index int not null default 0
);

create table if not exists public.project_notes (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  user_id uuid references auth.users not null,
  content text not null default '',
  updated_at timestamptz default now(),
  unique(project_id)
);

create table if not exists public.project_resources (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  user_id uuid references auth.users not null,
  title text not null,
  url text not null,
  created_at timestamptz default now()
);

alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.project_notes enable row level security;
alter table public.project_resources enable row level security;

create policy "Users own their projects"
  on public.projects for all using (user_id = auth.uid());
create policy "Users own their tasks"
  on public.tasks for all using (user_id = auth.uid());
create policy "Users own their project notes"
  on public.project_notes for all using (user_id = auth.uid());
create policy "Users own their project resources"
  on public.project_resources for all using (user_id = auth.uid());
