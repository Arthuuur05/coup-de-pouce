-- Test du lot 3 : les règles de la table profils, vues depuis le compte de Léa.
-- À lancer dans Supabase › SQL Editor. Tout est annulé à la fin (rollback), rien n'est modifié.
-- Attendu : 1 · 0 · 1 · refusé · refusé · refusé · 0

begin;
create temp table resultats (test text, resultat text);
grant all on resultats to authenticated, anon;
do $$
declare lea uuid; sam uuid; n int;
begin
  select id into lea from auth.users where email = 'lea.test@example.com';
  select id into sam from auth.users where email = 'sam.test@example.com';
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.profils;
  insert into resultats values ('Léa voit combien de profils (attendu 1)', n);

  update public.profils set prenom = 'Piraté' where id = sam;
  get diagnostics n = row_count;
  insert into resultats values ('Léa modifie le profil de Sam (attendu 0 ligne)', n);

  update public.profils set filiere = 'Design' where id = lea;
  get diagnostics n = row_count;
  insert into resultats values ('Léa modifie son profil (attendu 1 ligne)', n);

  begin
    update public.profils set est_admin = true where id = lea;
    insert into resultats values ('Léa se donne le rôle admin', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats values ('Léa se donne le rôle admin', 'refusé par la base');
  end;

  begin
    insert into public.profils (id, prenom) values (gen_random_uuid(), 'Faux');
    insert into resultats values ('Léa crée un faux profil', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats values ('Léa crée un faux profil', 'refusé par la base');
  end;

  begin
    delete from public.profils where id = sam;
    insert into resultats values ('Léa supprime le profil de Sam', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats values ('Léa supprime le profil de Sam', 'refusé par la base');
  end;

  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  select count(*) into n from public.profils;
  insert into resultats values ('Visiteur non connecté voit combien de profils (attendu 0)', n);
  reset role;
end $$;
select * from resultats;
rollback;
