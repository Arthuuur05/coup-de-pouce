-- Test du lot 13 : une alerte prévient de la bonne annonce, une seule fois, jamais l'auteur ; chacun ne voit que ses alertes.
-- À lancer dans Supabase › SQL Editor (comptes Arthur et Sirown). Tout est annulé à la fin.
-- Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare arthur uuid; sirown uuid; n int; i int;
begin
  select id into arthur from auth.users where email = 'paul.arthur17270@gmail.com';
  select id into sirown from auth.users where email = 'sirown17@gmail.com';

  -- Sirown crée des alertes
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.alertes;
  insert into public.alertes (categorie, mot) values ('Photo', 'Portrait'); -- le mot est rangé sans accents ni majuscules
  select count(*) into n from public.alertes where mot = 'portrait';
  insert into resultats (test, resultat) values ('Le mot de l''alerte est rangé en minuscules (attendu 1)', n);
  insert into public.alertes (type) values ('propose'); -- 2e alerte qui correspond aussi : on ne doit être prévenu qu'une fois
  begin
    insert into public.alertes (categorie, mot) values ('Photo', 'portrait');
    insert into resultats (test, resultat) values ('Même alerte deux fois (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when unique_violation then
    insert into resultats (test, resultat) values ('Même alerte deux fois (attendu : refusé)', 'refusé');
  end;
  begin
    insert into public.alertes (mot) values ('   ');
    insert into resultats (test, resultat) values ('Alerte sans critère (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception or check_violation then
    insert into resultats (test, resultat) values ('Alerte sans critère (attendu : refusé)', 'refusé');
  end;
  begin
    insert into public.alertes (categorie) values ('Design');
    insert into public.alertes (categorie) values ('Logement');
    insert into public.alertes (categorie) values ('Covoiturage');
    insert into public.alertes (categorie) values ('Autre'); -- la 6e
    insert into resultats (test, resultat) values ('Plus de 5 alertes (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Plus de 5 alertes (attendu : refusé)', 'refusé');
  end;

  -- Arthur publie : une annonce qui correspond (Photo + portrait), une qui ne correspond pas
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.alertes (categorie) values ('Photo'); -- l'alerte d'Arthur ne doit pas le prévenir de sa propre annonce
  select count(*) into n from public.alertes;
  insert into resultats (test, resultat) values ('Arthur ne voit que ses alertes (attendu 1)', n);
  insert into public.annonces (type, categorie, titre, description)
    values ('propose', 'Photo', 'Séance portrait au campus', 'Je fais des portraits en extérieur.');
  insert into public.annonces (type, categorie, titre, description)
    values ('cherche', 'Cours et soutien', 'Cherche cours de maths', 'Un coup de main en analyse svp.');

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.notifications where type = 'alerte' and titre = 'Séance portrait au campus';
  insert into resultats (test, resultat) values ('Sirown prévenu de l''annonce qui correspond, une seule fois malgré 2 alertes ? (attendu 1)', n);
  select count(*) into n from public.notifications where type = 'alerte' and titre = 'Cherche cours de maths';
  insert into resultats (test, resultat) values ('Sirown prévenu de l''annonce qui ne correspond pas (attendu 0, aucune de ses alertes ne correspond)', n);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.notifications where type = 'alerte';
  insert into resultats (test, resultat) values ('Arthur prévenu de ses propres annonces (attendu 0)', n);
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
