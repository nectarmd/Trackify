-- Trackify - Migração 008: corrige vazamento de e-mails nos convites
--
-- ACHADO DA AUDITORIA: a policy de leitura de workspace_invites exigia apenas
-- "ser membro do workspace". Resultado: um colaborador COM 'team_view'
-- DESLIGADO — que não enxerga a lista de colegas — ainda conseguia listar os
-- E-MAILS de todos os convites chamando a API direto.
--
-- Incoerente com a 007, que fechou workspace_members. Aqui a leitura de
-- convites passa a exigir a MESMA permissão.
--
-- O convidado não precisa ler o próprio convite: quem o vincula é a função
-- claim_my_invites(), que é SECURITY DEFINER e ignora o RLS.
--
-- Idempotente. Rode no SQL Editor do Supabase.

drop policy if exists "wi_select" on public.workspace_invites;
create policy "wi_select" on public.workspace_invites for select
  using (public.member_can(workspace_id, 'team_view'));
