-- Trackify - Migração 010: alertas do administrador
--
-- O admin publica avisos para o workspace; os colaboradores recebem no sininho.
-- Cada pessoa tem seu próprio "lido/não lido".
--
-- Idempotente. Rode no SQL Editor do Supabase.

-- =========================================================
-- Tabelas
-- =========================================================

create table if not exists public.workspace_alerts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  message text not null default '',
  created_at timestamptz not null default now()
);

-- Marca de leitura por pessoa: o mesmo alerta pode estar lido para um e não
-- para outro.
create table if not exists public.alert_reads (
  alert_id uuid not null references public.workspace_alerts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (alert_id, user_id)
);

create index if not exists workspace_alerts_ws_idx
  on public.workspace_alerts (workspace_id, created_at desc);

-- =========================================================
-- RLS: todo membro LÊ os avisos; só o admin PUBLICA.
-- =========================================================

alter table public.workspace_alerts enable row level security;
alter table public.alert_reads enable row level security;

drop policy if exists "alerts_select" on public.workspace_alerts;
create policy "alerts_select" on public.workspace_alerts for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "alerts_insert" on public.workspace_alerts;
create policy "alerts_insert" on public.workspace_alerts for insert
  with check (public.is_workspace_admin(workspace_id));

drop policy if exists "alerts_update" on public.workspace_alerts;
create policy "alerts_update" on public.workspace_alerts for update
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

drop policy if exists "alerts_delete" on public.workspace_alerts;
create policy "alerts_delete" on public.workspace_alerts for delete
  using (public.is_workspace_admin(workspace_id));

-- Cada um só mexe na PRÓPRIA marca de leitura.
drop policy if exists "alert_reads_select" on public.alert_reads;
create policy "alert_reads_select" on public.alert_reads for select
  using (user_id = auth.uid());

drop policy if exists "alert_reads_insert" on public.alert_reads;
create policy "alert_reads_insert" on public.alert_reads for insert
  with check (user_id = auth.uid());

drop policy if exists "alert_reads_delete" on public.alert_reads;
create policy "alert_reads_delete" on public.alert_reads for delete
  using (user_id = auth.uid());

-- =========================================================
-- Leitura: alertas + se EU já li, numa única ida ao banco.
-- =========================================================

create or replace function public.my_alerts()
returns table (
  id uuid,
  title text,
  message text,
  created_at timestamptz,
  is_read boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select
    a.id,
    a.title,
    a.message,
    a.created_at,
    (r.user_id is not null) as is_read
  from public.workspace_alerts a
  left join public.alert_reads r
    on r.alert_id = a.id and r.user_id = auth.uid()
  where public.is_workspace_member(a.workspace_id)
  order by a.created_at desc
  limit 50;
$$;

grant execute on function public.my_alerts() to authenticated;

-- Marca como lidos todos os alertas do workspace do usuário.
create or replace function public.mark_alerts_read()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.alert_reads (alert_id, user_id)
  select a.id, auth.uid()
  from public.workspace_alerts a
  where public.is_workspace_member(a.workspace_id)
  on conflict (alert_id, user_id) do nothing;
$$;

grant execute on function public.mark_alerts_read() to authenticated;
