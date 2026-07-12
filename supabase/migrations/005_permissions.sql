-- Trackify - Migração 005: permissões de colaborador
--
-- O admin define o que os MEMBROS do workspace podem acessar.
-- A regra vale no BANCO (RLS), não só na interface: esconder um menu não
-- impede ninguém de chamar a API direto.
--
-- Idempotente. Rode no SQL Editor do Supabase.

-- =========================================================
-- 1. Permissões no workspace
-- =========================================================

alter table public.workspaces
  add column if not exists member_permissions jsonb not null default '{
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
-- 2. Função de permissão
--    Admin pode tudo, sempre. Membro depende do que o admin liberou.
-- =========================================================

create or replace function public.member_can(ws uuid, perm text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select case
    when public.is_workspace_admin(ws) then true
    when not public.is_workspace_member(ws) then false
    else coalesce(
      (select (w.member_permissions ->> perm)::boolean
       from public.workspaces w where w.id = ws),
      false
    )
  end;
$$;

-- =========================================================
-- 3. RLS: as permissões passam a valer de verdade
-- =========================================================

-- ---- time_entries ----
-- Ver o tempo dos OUTROS depende de "see_all_time". O próprio tempo, sempre.
-- Editar/apagar: só as próprias entradas (admin pode todas).
drop policy if exists "time_entries_ws_select" on public.time_entries;
create policy "time_entries_ws_select" on public.time_entries for select
  using (
    public.is_workspace_member(workspace_id)
    and (
      user_id = auth.uid()
      or public.member_can(workspace_id, 'see_all_time')
    )
  );

drop policy if exists "time_entries_ws_insert" on public.time_entries;
create policy "time_entries_ws_insert" on public.time_entries for insert
  with check (
    public.is_workspace_member(workspace_id) and user_id = auth.uid()
  );

drop policy if exists "time_entries_ws_update" on public.time_entries;
create policy "time_entries_ws_update" on public.time_entries for update
  using (
    public.is_workspace_member(workspace_id)
    and (user_id = auth.uid() or public.is_workspace_admin(workspace_id))
  )
  with check (
    public.is_workspace_member(workspace_id)
    and (user_id = auth.uid() or public.is_workspace_admin(workspace_id))
  );

drop policy if exists "time_entries_ws_delete" on public.time_entries;
create policy "time_entries_ws_delete" on public.time_entries for delete
  using (
    public.is_workspace_member(workspace_id)
    and (user_id = auth.uid() or public.is_workspace_admin(workspace_id))
  );

-- ---- expenses: acesso total controlado pela permissão ----
do $$
declare op text;
begin
  foreach op in array array['select', 'insert', 'update', 'delete'] loop
    execute format('drop policy if exists %I on public.expenses', 'expenses_ws_' || op);
  end loop;
end $$;

create policy "expenses_ws_select" on public.expenses for select
  using (public.member_can(workspace_id, 'expenses'));
create policy "expenses_ws_insert" on public.expenses for insert
  with check (public.member_can(workspace_id, 'expenses'));
create policy "expenses_ws_update" on public.expenses for update
  using (public.member_can(workspace_id, 'expenses'))
  with check (public.member_can(workspace_id, 'expenses'));
create policy "expenses_ws_delete" on public.expenses for delete
  using (public.member_can(workspace_id, 'expenses'));

-- ---- plans (planejador) ----
do $$
declare op text;
begin
  foreach op in array array['select', 'insert', 'update', 'delete'] loop
    execute format('drop policy if exists %I on public.plans', 'plans_ws_' || op);
  end loop;
end $$;

create policy "plans_ws_select" on public.plans for select
  using (public.member_can(workspace_id, 'planner'));
create policy "plans_ws_insert" on public.plans for insert
  with check (public.member_can(workspace_id, 'planner'));
create policy "plans_ws_update" on public.plans for update
  using (public.member_can(workspace_id, 'planner'))
  with check (public.member_can(workspace_id, 'planner'));
create policy "plans_ws_delete" on public.plans for delete
  using (public.member_can(workspace_id, 'planner'));

-- ---- projects e clients: todos LEEM (precisa para apontar o tempo),
--      mas só quem tem 'projects_manage' ESCREVE ----
do $$
declare t text; op text;
begin
  foreach t in array array['projects', 'clients'] loop
    foreach op in array array['select', 'insert', 'update', 'delete'] loop
      execute format('drop policy if exists %I on public.%I', t || '_ws_' || op, t);
    end loop;

    execute format(
      'create policy %I on public.%I for select using (public.is_workspace_member(workspace_id))',
      t || '_ws_select', t);
    execute format(
      'create policy %I on public.%I for insert with check (public.member_can(workspace_id, ''projects_manage''))',
      t || '_ws_insert', t);
    execute format(
      'create policy %I on public.%I for update using (public.member_can(workspace_id, ''projects_manage'')) with check (public.member_can(workspace_id, ''projects_manage''))',
      t || '_ws_update', t);
    execute format(
      'create policy %I on public.%I for delete using (public.member_can(workspace_id, ''projects_manage''))',
      t || '_ws_delete', t);
  end loop;
end $$;

-- ---- tags: todos leem; escrever depende de 'tags_manage' ----
do $$
declare op text;
begin
  foreach op in array array['select', 'insert', 'update', 'delete'] loop
    execute format('drop policy if exists %I on public.tags', 'tags_ws_' || op);
  end loop;
end $$;

create policy "tags_ws_select" on public.tags for select
  using (public.is_workspace_member(workspace_id));
create policy "tags_ws_insert" on public.tags for insert
  with check (public.member_can(workspace_id, 'tags_manage'));
create policy "tags_ws_update" on public.tags for update
  using (public.member_can(workspace_id, 'tags_manage'))
  with check (public.member_can(workspace_id, 'tags_manage'));
create policy "tags_ws_delete" on public.tags for delete
  using (public.member_can(workspace_id, 'tags_manage'));
