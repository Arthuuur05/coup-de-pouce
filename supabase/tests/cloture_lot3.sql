-- Test de clôture du lot 3 : liste des campus et suppression de compte, depuis le compte de Léa.
-- À lancer dans Supabase › SQL Editor. Tout est annulé à la fin (rollback) : Léa n'est pas vraiment supprimée.
-- Attendu : refusé · 1 · 0 · 0 · 1 · refusé

begin;
create temp table r (test text, resultat text);
grant all on r to authenticated, anon;
do $$
declare lea uuid; sam uuid; n int;
begin
  select id into lea from auth.users where email = 'lea.test@example.com';
  select id into sam from auth.users where email = 'sam.test@example.com';
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    update public.profils set campus = 'Marseille' where id = lea;
    insert into r values ('Campus hors liste', 'ACCEPTÉ (problème)');
  exception when check_violation then insert into r values ('Campus hors liste', 'refusé par la base'); end;
  update public.profils set campus = 'Lyon' where id = lea;
  get diagnostics n = row_count; insert into r values ('Campus Lyon (attendu 1)', n);
  perform public.supprimer_mon_compte();
  reset role;
  select count(*) into n from auth.users where id = lea; insert into r values ('Compte de Léa après suppression (attendu 0)', n);
  select count(*) into n from public.profils where id = lea; insert into r values ('Profil de Léa après suppression (attendu 0)', n);
  select count(*) into n from auth.users where id = sam; insert into r values ('Compte de Sam intact (attendu 1)', n);
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  begin
    perform public.supprimer_mon_compte();
    insert into r values ('Visiteur appelle la suppression', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then insert into r values ('Visiteur appelle la suppression', 'refusé par la base'); end;
  reset role;
end $$;
select * from r;
rollback;
