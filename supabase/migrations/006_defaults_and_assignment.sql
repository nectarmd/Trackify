-- Trackify - Migração 006: padrão restritivo + admin lança/planeja para a equipe
--
-- 1. Colaborador novo entra vendo só o BÁSICO: Rastreador e Planilha.
--    Tudo o mais fica desligado até o admin liberar.
-- 2. Colaborador só enxerga o PRÓPRIO tempo (no rastreador e na planilha).
-- 3. Admin pode criar entradas e planejamentos PARA um colaborador.
--
-- Idempotente. Rode no SQL Editor do Supabase.

-- =========================================================
-- 1. Padrão restritivo para workspaces novos
-- =========================================================

alter table public.workspaces
  alter column member_permissions set default '{
    "see_all_time": false,
    "reports": false,
    "timesheet": true,
    "calendar": false,
    "expenses": false,
    "planner": false,
    "projects_manage": false,
    "tags_manage": false
  }'::jsonb;

-- Aplica o padrão restritivo aos workspaces que ainda estão com o padrão
-- antigo (mais permissivo). Não mexe em quem já personalizou.
update public.workspaces
set member_permissions = '{
  "see_all_time": false,
  "reports": false,
  "timesheet": true,
  "calendar": false,
  "expenses": false,
  "planner": false,
  "projects_manage": false,
  "tags_manage": false
}'::jsonb
where member_permissions = '{
  "see_all_time": false,
  "reports": true,
  "timesheet": true,
  "calendar": true,
  "expenses": true,
  "planner": true,
  "projects_manage": false,
  "tags_manage": true
}'::jsonb;

-- =========================================================
-- 2. time_entries: o admin pode lançar tempo PARA um colaborador
--    (o membro só lança para si mesmo).
-- =========================================================

drop policy if exists "time_entries_ws_insert" on public.time_entries;
create policy "time_entries_ws_insert" on public.time_entries for insert
  with check (
    public.is_workspace_member(workspace_id)
    and (
      user_id = auth.uid()
      or public.is_workspace_admin(workspace_id)
    )
  );

-- (select/update/delete continuam como na 005: o membro só vê o próprio tempo
--  a menos que 'see_all_time' esteja ligado, e só edita/apaga o que é dele.)

-- =========================================================
-- 3. plans: planejamento é ATRIBUÍDO a alguém
-- =========================================================

alter table public.plans
  add column if not exists assignee_id uuid references auth.users(id) on delete cascade;

-- Planos antigos passam a ser de quem os criou.
update public.plans set assignee_id = user_id where assignee_id is null;

create index if not exists plans_assignee_idx on public.plans (assignee_id);

-- O colaborador vê/gerencia apenas os planos ATRIBUÍDOS A ELE.
-- O admin vê e gerencia os de todo mundo (é ele quem planeja para a equipe).
do $$
declare op text;
begin
  foreach op in array array['select', 'insert', 'update', 'delete'] loop
    execute format('drop policy if exists %I on public.plans', 'plans_ws_' || op);
  end loop;
end $$;

create policy "plans_ws_select" on public.plans for select
  using (
    public.member_can(workspace_id, 'planner')
    and (
      assignee_id = auth.uid()
      or public.is_workspace_admin(workspace_id)
    )
  );

create policy "plans_ws_insert" on public.plans for insert
  with check (
    public.member_can(workspace_id, 'planner')
    and (
      assignee_id = auth.uid()
      or public.is_workspace_admin(workspace_id)
    )
  );

create policy "plans_ws_update" on public.plans for update
  using (
    public.member_can(workspace_id, 'planner')
    and (assignee_id = auth.uid() or public.is_workspace_admin(workspace_id))
  )
  with check (
    public.member_can(workspace_id, 'planner')
    and (assignee_id = auth.uid() or public.is_workspace_admin(workspace_id))
  );

create policy "plans_ws_delete" on public.plans for delete
  using (
    public.member_can(workspace_id, 'planner')
    and (assignee_id = auth.uid() or public.is_workspace_admin(workspace_id))
  );
