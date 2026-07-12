-- Trackify - Migração 004: bucket de avatares (foto de perfil)
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- Sem isso, tudo no Perfil funciona, MENOS o upload da foto.

-- Bucket público de leitura: a foto aparece no topo do app sem URL assinada.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Qualquer um pode LER (o bucket é público).
drop policy if exists "avatars_read" on storage.objects;
create policy "avatars_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- Só o dono ESCREVE na própria pasta: o arquivo tem que estar em <user_id>/...
-- É isso que impede alguém de sobrescrever a foto de outra pessoa.
drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
