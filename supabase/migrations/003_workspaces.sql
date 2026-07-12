-- Trackify - Migração 003: Workspaces reais (multi-tenant)
--
-- O que muda: os dados deixam de pertencer a um USUÁRIO e passam a pertencer a
-- um WORKSPACE. Quem enxerga uma linha é quem for MEMBRO do workspace dela.
--
-- Seguro para rodar com o app no ar:
--  * workspace_id entra como NULLable e é preenchido por gatilho, então o
--    código antigo (que só envia user_id) continua funcionando.
--  * Idempotente: pode ser executado mais de uma vez.
--
-- Rode este arquivo inteiro no SQL Editor do Supabase.

-- =========================================================
-- 1. Tabelas de workspace
-- =========================================================

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Meu workspace',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- email/name ficam aqui de propósito: auth.users não é exposta ao cliente, e
-- sem isso a tela de Equipes não teria como mostrar quem é cada membro.
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

alter table public.workspace_members add column if not exists email text;
alter table public.workspace_members add column if not exists name text;

-- Convites por e-mail. Quem ainda não tem conta entra ao se cadastrar com o
-- e-mail convidado; quem já tem conta é vinculado no próximo acesso.
create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists workspace_members_user_idx
  on public.workspace_members (user_id);
create index if not exists workspace_invites_email_idx
  on public.workspace_invites (lower(email)) where status = 'pending';

-- =========================================================
-- 2. Funções de autorização
--
-- SECURITY DEFINER é ESSENCIAL: sem isso, uma policy de workspace_members que
-- consulta workspace_members entraria em recursão infinita de RLS.
-- =========================================================

create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(ws uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws
      and m.user_id = auth.uid()
      and m.role = 'admin'
  );
$$;

-- Aceita os convites pendentes do PRÓPRIO e-mail do chamador.
--
-- Precisa ser SECURITY DEFINER: o convidado ainda não é membro do workspace,
-- então o RLS o impediria de enxergar o convite e de se inserir como membro
-- (impasse de ovo e galinha). A função só olha convites que casam com o e-mail
-- do usuário autenticado, então não dá para reivindicar convite alheio.
create or replace function public.claim_my_invites()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  uid uuid := auth.uid();
  uemail text;
begin
  if uid is null then return; end if;
  select email into uemail from auth.users where id = uid;
  if uemail is null then return; end if;

  for inv in
    select * from public.workspace_invites
    where lower(email) = lower(uemail) and status = 'pending'
  loop
    insert into public.workspace_members (workspace_id, user_id, email, name, role)
    values (inv.workspace_id, uid, uemail, inv.name, inv.role)
    on conflict (workspace_id, user_id) do nothing;

    update public.workspace_invites
    set status = 'accepted', accepted_at = now()
    where id = inv.id;
  end loop;
end;
$$;

grant execute on function public.claim_my_invites() to authenticated;

-- Workspace padrão do usuário: o que ele possui; senão, o primeiro em que é membro.
create or replace function public.my_default_workspace()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select m.workspace_id
  from public.workspace_members m
  left join public.workspaces w on w.id = m.workspace_id
  where m.user_id = auth.uid()
  order by (w.owner_id = auth.uid()) desc, m.created_at asc
  limit 1;
$$;

-- =========================================================
-- 3. workspace_id nas tabelas de dados
-- =========================================================

alter table public.clients      add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.projects     add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.tags         add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.time_entries add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.expenses     add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.plans        add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

create index if not exists clients_ws_idx      on public.clients (workspace_id);
create index if not exists projects_ws_idx     on public.projects (workspace_id);
create index if not exists tags_ws_idx         on public.tags (workspace_id);
create index if not exists time_entries_ws_idx on public.time_entries (workspace_id, start_time desc);
create index if not exists expenses_ws_idx     on public.expenses (workspace_id, date desc);
create index if not exists plans_ws_idx        on public.plans (workspace_id, start_date desc);

-- =========================================================
-- 4. Backfill: cada usuário existente ganha seu workspace, e os dados dele
--    passam a pertencer a esse workspace.
-- =========================================================

insert into public.workspaces (name, owner_id)
select coalesce(split_part(u.email, '@', 1), 'Meu') || ' workspace', u.id
from auth.users u
where not exists (select 1 from public.workspaces w where w.owner_id = u.id);

insert into public.workspace_members (workspace_id, user_id, email, role)
select w.id, w.owner_id, u.email, 'admin'
from public.workspaces w
join auth.users u on u.id = w.owner_id
where not exists (
  select 1 from public.workspace_members m
  where m.workspace_id = w.id and m.user_id = w.owner_id
)
on conflict (workspace_id, user_id) do nothing;

-- preenche o e-mail de quem já era membro antes desta coluna existir
update public.workspace_members m
set email = u.email
from auth.users u
where u.id = m.user_id and m.email is null;

update public.clients      t set workspace_id = w.id from public.workspaces w where w.owner_id = t.user_id and t.workspace_id is null;
update public.projects     t set workspace_id = w.id from public.workspaces w where w.owner_id = t.user_id and t.workspace_id is null;
update public.tags         t set workspace_id = w.id from public.workspaces w where w.owner_id = t.user_id and t.workspace_id is null;
update public.time_entries t set workspace_id = w.id from public.workspaces w where w.owner_id = t.user_id and t.workspace_id is null;
update public.expenses     t set workspace_id = w.id from public.workspaces w where w.owner_id = t.user_id and t.workspace_id is null;
update public.plans        t set workspace_id = w.id from public.workspaces w where w.owner_id = t.user_id and t.workspace_id is null;

-- =========================================================
-- 5. Gatilho: preenche workspace_id sozinho quando não vier no INSERT.
--    É o que permite o código antigo continuar funcionando durante o deploy.
--    (BEFORE INSERT roda antes do WITH CHECK do RLS.)
-- =========================================================

create or replace function public.set_workspace_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.workspace_id is null then
    new.workspace_id := public.my_default_workspace();
  end if;
  return new;
end;
$$;

drop trigger if exists set_ws_clients      on public.clients;
drop trigger if exists set_ws_projects     on public.projects;
drop trigger if exists set_ws_tags         on public.tags;
drop trigger if exists set_ws_time_entries on public.time_entries;
drop trigger if exists set_ws_expenses     on public.expenses;
drop trigger if exists set_ws_plans        on public.plans;

create trigger set_ws_clients      before insert on public.clients      for each row execute function public.set_workspace_id();
create trigger set_ws_projects     before insert on public.projects     for each row execute function public.set_workspace_id();
create trigger set_ws_tags         before insert on public.tags         for each row execute function public.set_workspace_id();
create trigger set_ws_time_entries before insert on public.time_entries for each row execute function public.set_workspace_id();
create trigger set_ws_expenses     before insert on public.expenses     for each row execute function public.set_workspace_id();
create trigger set_ws_plans        before insert on public.plans        for each row execute function public.set_workspace_id();

-- =========================================================
-- 6. Novo usuário: se foi convidado, entra SÓ no workspace do convite.
--    Caso contrário, ganha o próprio workspace como admin.
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.workspace_invites%rowtype;
  ws_id uuid;
begin
  select * into inv
  from public.workspace_invites
  where lower(email) = lower(new.email) and status = 'pending'
  order by created_at asc
  limit 1;

  if found then
    -- Convidado: acessa APENAS o workspace para o qual foi convidado
    -- (não ganha workspace próprio).
    insert into public.workspace_members (workspace_id, user_id, email, name, role)
    values (inv.workspace_id, new.id, new.email, inv.name, inv.role)
    on conflict (workspace_id, user_id) do nothing;

    update public.workspace_invites
    set status = 'accepted', accepted_at = now()
    where id = inv.id;
  else
    -- Cadastro normal: nasce dono do próprio workspace.
    insert into public.workspaces (name, owner_id)
    values (coalesce(split_part(new.email, '@', 1), 'Meu') || ' workspace', new.id)
    returning id into ws_id;

    insert into public.workspace_members (workspace_id, user_id, email, role)
    values (ws_id, new.id, new.email, 'admin')
    on conflict (workspace_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================
-- 7. RLS — o coração da mudança.
--    Regra antiga: "sou dono da linha" (auth.uid() = user_id)
--    Regra nova:   "sou membro do workspace da linha"
-- =========================================================

alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invites enable row level security;

-- workspaces
drop policy if exists "ws_select" on public.workspaces;
create policy "ws_select" on public.workspaces for select
  using (public.is_workspace_member(id));
drop policy if exists "ws_insert" on public.workspaces;
create policy "ws_insert" on public.workspaces for insert
  with check (auth.uid() = owner_id);
drop policy if exists "ws_update" on public.workspaces;
create policy "ws_update" on public.workspaces for update
  using (public.is_workspace_admin(id)) with check (public.is_workspace_admin(id));
drop policy if exists "ws_delete" on public.workspaces;
create policy "ws_delete" on public.workspaces for delete
  using (auth.uid() = owner_id);

-- workspace_members: membros veem a equipe; só admin mexe.
drop policy if exists "wm_select" on public.workspace_members;
create policy "wm_select" on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));
drop policy if exists "wm_insert" on public.workspace_members;
create policy "wm_insert" on public.workspace_members for insert
  with check (public.is_workspace_admin(workspace_id));
drop policy if exists "wm_update" on public.workspace_members;
create policy "wm_update" on public.workspace_members for update
  using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));
drop policy if exists "wm_delete" on public.workspace_members;
create policy "wm_delete" on public.workspace_members for delete
  using (public.is_workspace_admin(workspace_id));

-- workspace_invites: só admin do workspace gerencia.
drop policy if exists "wi_select" on public.workspace_invites;
create policy "wi_select" on public.workspace_invites for select
  using (public.is_workspace_member(workspace_id));
drop policy if exists "wi_insert" on public.workspace_invites;
create policy "wi_insert" on public.workspace_invites for insert
  with check (public.is_workspace_admin(workspace_id));
drop policy if exists "wi_update" on public.workspace_invites;
create policy "wi_update" on public.workspace_invites for update
  using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));
drop policy if exists "wi_delete" on public.workspace_invites;
create policy "wi_delete" on public.workspace_invites for delete
  using (public.is_workspace_admin(workspace_id));

-- ---- Tabelas de dados: troca "dono da linha" por "membro do workspace" ----

do $$
declare t text;
begin
  foreach t in array array['clients', 'projects', 'tags', 'time_entries', 'expenses', 'plans']
  loop
    -- remove as policies antigas baseadas em user_id
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format('drop policy if exists %I on public.%I', 'Users manage own ' || t, t);

    execute format(
      'create policy %I on public.%I for select using (public.is_workspace_member(workspace_id))',
      t || '_ws_select', t);
    execute format(
      'create policy %I on public.%I for insert with check (public.is_workspace_member(workspace_id))',
      t || '_ws_insert', t);
    execute format(
      'create policy %I on public.%I for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id))',
      t || '_ws_update', t);
    execute format(
      'create policy %I on public.%I for delete using (public.is_workspace_member(workspace_id))',
      t || '_ws_delete', t);
  end loop;
end $$;

-- time_entry_tags não tem workspace_id: herda o acesso da entrada dona.
alter table public.time_entry_tags enable row level security;
drop policy if exists "time_entry_tags_select" on public.time_entry_tags;
drop policy if exists "time_entry_tags_insert" on public.time_entry_tags;
drop policy if exists "time_entry_tags_update" on public.time_entry_tags;
drop policy if exists "time_entry_tags_delete" on public.time_entry_tags;
drop policy if exists "tet_ws_all" on public.time_entry_tags;
create policy "tet_ws_all" on public.time_entry_tags for all
  using (
    exists (
      select 1 from public.time_entries e
      where e.id = time_entry_id and public.is_workspace_member(e.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.time_entries e
      where e.id = time_entry_id and public.is_workspace_member(e.workspace_id)
    )
  );

-- =========================================================
-- 8. A tabela team_members vira obsoleta (era só uma lista decorativa).
-- =========================================================
drop table if exists public.team_members;
