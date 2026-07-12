-- Trackify - schema do banco de dados (Supabase / Postgres)
-- Rode este arquivo no SQL Editor do seu projeto Supabase.

-- =========================================================
-- Tabelas
-- =========================================================

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  color text not null default '#03A9F4',
  billable_default boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  description text not null default '',
  start_time timestamptz not null,
  end_time timestamptz,
  billable boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.time_entry_tags (
  time_entry_id uuid not null references public.time_entries(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (time_entry_id, tag_id)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  date date not null default current_date,
  category text not null default '',
  description text not null default '',
  amount numeric(12, 2) not null default 0,
  billable boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  start_date date not null default current_date,
  end_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- =========================================================
-- Índices
-- =========================================================

create index if not exists time_entries_user_start_idx
  on public.time_entries (user_id, start_time desc);

-- Garante apenas um timer rodando (end_time null) por usuário.
create unique index if not exists one_running_timer
  on public.time_entries (user_id)
  where end_time is null;

create index if not exists expenses_user_date_idx
  on public.expenses (user_id, date desc);

create index if not exists plans_user_start_idx
  on public.plans (user_id, start_date desc);

create index if not exists team_members_user_idx
  on public.team_members (user_id);

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.tags enable row level security;
alter table public.time_entries enable row level security;
alter table public.time_entry_tags enable row level security;
alter table public.expenses enable row level security;
alter table public.plans enable row level security;
alter table public.team_members enable row level security;

-- clients
drop policy if exists "clients_select" on public.clients;
create policy "clients_select" on public.clients for select using (auth.uid() = user_id);
drop policy if exists "clients_insert" on public.clients;
create policy "clients_insert" on public.clients for insert with check (auth.uid() = user_id);
drop policy if exists "clients_update" on public.clients;
create policy "clients_update" on public.clients for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "clients_delete" on public.clients;
create policy "clients_delete" on public.clients for delete using (auth.uid() = user_id);

-- projects
drop policy if exists "projects_select" on public.projects;
create policy "projects_select" on public.projects for select using (auth.uid() = user_id);
drop policy if exists "projects_insert" on public.projects;
create policy "projects_insert" on public.projects for insert with check (auth.uid() = user_id);
drop policy if exists "projects_update" on public.projects;
create policy "projects_update" on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "projects_delete" on public.projects;
create policy "projects_delete" on public.projects for delete using (auth.uid() = user_id);

-- tags
drop policy if exists "tags_select" on public.tags;
create policy "tags_select" on public.tags for select using (auth.uid() = user_id);
drop policy if exists "tags_insert" on public.tags;
create policy "tags_insert" on public.tags for insert with check (auth.uid() = user_id);
drop policy if exists "tags_update" on public.tags;
create policy "tags_update" on public.tags for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "tags_delete" on public.tags;
create policy "tags_delete" on public.tags for delete using (auth.uid() = user_id);

-- time_entries
drop policy if exists "time_entries_select" on public.time_entries;
create policy "time_entries_select" on public.time_entries for select using (auth.uid() = user_id);
drop policy if exists "time_entries_insert" on public.time_entries;
create policy "time_entries_insert" on public.time_entries for insert with check (auth.uid() = user_id);
drop policy if exists "time_entries_update" on public.time_entries;
create policy "time_entries_update" on public.time_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "time_entries_delete" on public.time_entries;
create policy "time_entries_delete" on public.time_entries for delete using (auth.uid() = user_id);

-- time_entry_tags
drop policy if exists "time_entry_tags_select" on public.time_entry_tags;
create policy "time_entry_tags_select" on public.time_entry_tags for select using (auth.uid() = user_id);
drop policy if exists "time_entry_tags_insert" on public.time_entry_tags;
create policy "time_entry_tags_insert" on public.time_entry_tags for insert with check (auth.uid() = user_id);
drop policy if exists "time_entry_tags_delete" on public.time_entry_tags;
create policy "time_entry_tags_delete" on public.time_entry_tags for delete using (auth.uid() = user_id);

-- expenses
drop policy if exists "expenses_select" on public.expenses;
create policy "expenses_select" on public.expenses for select using (auth.uid() = user_id);
drop policy if exists "expenses_insert" on public.expenses;
create policy "expenses_insert" on public.expenses for insert with check (auth.uid() = user_id);
drop policy if exists "expenses_update" on public.expenses;
create policy "expenses_update" on public.expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "expenses_delete" on public.expenses;
create policy "expenses_delete" on public.expenses for delete using (auth.uid() = user_id);

-- plans
drop policy if exists "plans_select" on public.plans;
create policy "plans_select" on public.plans for select using (auth.uid() = user_id);
drop policy if exists "plans_insert" on public.plans;
create policy "plans_insert" on public.plans for insert with check (auth.uid() = user_id);
drop policy if exists "plans_update" on public.plans;
create policy "plans_update" on public.plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "plans_delete" on public.plans;
create policy "plans_delete" on public.plans for delete using (auth.uid() = user_id);

-- team_members
drop policy if exists "team_members_select" on public.team_members;
create policy "team_members_select" on public.team_members for select using (auth.uid() = user_id);
drop policy if exists "team_members_insert" on public.team_members;
create policy "team_members_insert" on public.team_members for insert with check (auth.uid() = user_id);
drop policy if exists "team_members_update" on public.team_members;
create policy "team_members_update" on public.team_members for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "team_members_delete" on public.team_members;
create policy "team_members_delete" on public.team_members for delete using (auth.uid() = user_id);
