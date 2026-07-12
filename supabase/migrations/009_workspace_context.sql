-- Trackify - Migração 009: uma chamada só para o contexto do workspace
--
-- PENDÊNCIA DA AUDITORIA: a cada carregamento de página o app fazia TRÊS idas
-- ao banco em série:
--   1. rpc claim_my_invites()          (vincular convites pendentes)
--   2. select workspace_members + workspaces  (qual é o meu workspace)
--   3. select workspaces.member_permissions   (o que eu posso)
--
-- São ~0,3s cada. Esta função devolve tudo de uma vez: 3 viagens → 1.
--
-- Idempotente. Rode no SQL Editor do Supabase.

create or replace function public.my_workspace()
returns table (
  id uuid,
  name text,
  role text,
  is_owner boolean,
  member_permissions jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Vincula convites pendentes deste e-mail (barato: índice em lower(email)
  -- filtrado por status='pending').
  perform public.claim_my_invites();

  return query
  select
    w.id,
    w.name,
    m.role,
    (w.owner_id = auth.uid()) as is_owner,
    w.member_permissions
  from public.workspace_members m
  join public.workspaces w on w.id = m.workspace_id
  where m.user_id = auth.uid()
  -- Preferência: o workspace que ele possui; senão, o primeiro em que é membro.
  order by (w.owner_id = auth.uid()) desc, m.created_at asc
  limit 1;
end;
$$;

grant execute on function public.my_workspace() to authenticated;
