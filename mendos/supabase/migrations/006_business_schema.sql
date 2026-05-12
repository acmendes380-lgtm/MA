-- mendos/supabase/migrations/006_business_schema.sql

create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  company text,
  email text,
  status text not null default 'lead'
    check (status in ('lead','active','churned')),
  value numeric(10,2) not null default 0,
  notes text,
  last_contact date,
  created_at timestamptz default now()
);

create table if not exists public.pipeline_deals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  client_id uuid references public.clients on delete set null,
  title text not null,
  stage text not null default 'lead'
    check (stage in ('lead','contacted','proposal','won','lost')),
  value numeric(10,2) not null default 0,
  notes text,
  updated_at timestamptz default now()
);

create table if not exists public.business_services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  client_id uuid references public.clients on delete set null,
  title text not null,
  type text not null default 'automation'
    check (type in ('automation','chatbot','workflow','integration','other')),
  status text not null default 'active'
    check (status in ('active','paused','completed')),
  deadline date
);

create table if not exists public.business_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  category text not null default 'idea'
    check (category in ('idea','strategy','meeting','content','other')),
  title text not null,
  content text not null default '',
  created_at timestamptz default now()
);

create table if not exists public.business_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  status text not null default 'todo'
    check (status in ('todo','in_progress','done')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  deadline date,
  client_id uuid references public.clients on delete set null
);

create table if not exists public.business_chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.clients enable row level security;
alter table public.pipeline_deals enable row level security;
alter table public.business_services enable row level security;
alter table public.business_notes enable row level security;
alter table public.business_tasks enable row level security;
alter table public.business_chat_messages enable row level security;

create policy "Users own their clients" on public.clients for all using (user_id = auth.uid());
create policy "Users own their pipeline deals" on public.pipeline_deals for all using (user_id = auth.uid());
create policy "Users own their business services" on public.business_services for all using (user_id = auth.uid());
create policy "Users own their business notes" on public.business_notes for all using (user_id = auth.uid());
create policy "Users own their business tasks" on public.business_tasks for all using (user_id = auth.uid());
create policy "Users own their business chat" on public.business_chat_messages for all using (user_id = auth.uid());
