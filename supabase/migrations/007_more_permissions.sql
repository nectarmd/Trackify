-- Trackify - Migração 007: mais permissões, tudo desligado por padrão
--
-- Folgas, Atividade, Projetos, Clientes, Tags, Equipes, Aprovações e Quiosques
-- deixam de aparecer para o colaborador, a menos que o admin libere.
--
-- Idempotente. Rode no SQL Editor do Supabase.

-- =========================================================
-- 1. Novo padrão: só Planilha ligada (Rastreador é sempre acessível)
-- =========================================================

alter table public.workspaces
  alter column member_permissions set default '{
    "see_all_time": false,
    "timesheet": true,
    "calendar": false,
    "planner": false,
    "expenses": false,
    "time_off": false,
    "reports": false,
    "activity": false,
    "projects_view": false,
    "projects_manage": false,
    "clients_view": false,
    "tags_view": false,
    "tags_manage": false,
    "team_view": false,
    "approvals": false,
    "kiosks": false
  }'::jsonb;

-- Workspaces existentes: acrescenta as chaves NOVAS como false, preservando o
-- que o admin já tiver configurado nas antigas (|| mantém a chave da esquerda
-- quando ela já existe à direita — por isso o novo vem primeiro).
update public.workspaces
set member_permissions = '{
  "time_off": false,
  "activity": false,
  "projects_view": false,
  "clients_view": false,
  "tags_view": false,
  "team_view": false,
  "approvals": false,
  "kiosks": false
}'::jsonb || member_permissions;

-- =========================================================
-- 2. Equipes: sem 'team_view', o colaborador não enxerga os colegas.
--    A PRÓPRIA linha ele sempre lê — é ela que diz a qual workspace
--    ele pertence (sem isso o app não conseguiria nem carregar).
-- =========================================================

drop policy if exists "wm_select" on public.workspace_members;
create policy "wm_select" on public.workspace_members for select
  using (
    user_id = auth.uid()
    or public.is_workspace_admin(workspace_id)
    or public.member_can(workspace_id, 'team_view')
  );
