-- Trackify - Migração 002: Despesas, Planejador e Equipes
-- Rode este arquivo no SQL Editor do seu projeto Supabase.
-- Idempotente: pode ser executado mais de uma vez sem erro.

-- =========================================================
-- Tabelas
-- =========================================================

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

create index if not exists expenses_user_date_idx
  on public.expenses (user_id, date desc);

create index if not exists plans_user_start_idx
  on public.plans (user_id, start_date desc);

create index if not exists team_members_user_idx
  on public.team_members (user_id);

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.expenses enable row level security;
alter table public.plans enable row level security;
alter table public.team_members enable row level security;

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
