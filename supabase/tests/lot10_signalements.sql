-- Test du lot 10 : chacun signale en son nom, une seule fois, jamais soi-même ; seule l'admin voit la file et la traite.
-- À lancer dans Supabase › SQL Editor (comptes Arthur et Sirown). Tout est annulé à la fin.
-- Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare arthur uuid; sirown uuid; n int; a uuid; s uuid;
begin
  select id into arthur from auth.users where email = 'paul.arthur17270@gmail.com';
  select id into sirown from auth.users where email = 'sirown17@gmail.com';
  update public.profils set est_admin = true where id = arthur; -- rôle donné ici, en dehors de l'appli

  -- Arthur publie une annonce
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description)
    values ('propose', 'Photo', 'Annonce à signaler', 'Une annonce pour tester le signalement.') returning id into a;

  -- Arthur se signale lui-même : refusé
  begin
    insert into public.signalements (annonce, motif) values (a, 'spam');
    insert into resultats (test, resultat) values ('Arthur signale sa propre annonce (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Arthur signale sa propre annonce (attendu : refusé)', 'refusé');
  end;

  -- Sirown signale l'annonce, une seule fois
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.signalements (annonce, motif, detail) values (a, 'arnaque', 'Ça sent l''arnaque') returning id into s;
  insert into resultats (test, resultat) values ('Sirown signale une annonce (attendu : accepté)', 'accepté');
  begin
    insert into public.signalements (annonce, motif) values (a, 'spam');
    insert into resultats (test, resultat) values ('Sirown signale deux fois la même annonce (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when unique_violation then
    insert into resultats (test, resultat) values ('Sirown signale deux fois la même annonce (attendu : refusé)', 'refusé');
  end;
  begin
    insert into public.signalements (annonce, motif) values (a, 'pirate');
    insert into resultats (test, resultat) values ('Motif inconnu (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when check_violation then
    insert into resultats (test, resultat) values ('Motif inconnu (attendu : refusé)', 'refusé');
  end;
  begin
    insert into public.signalements (annonce, profil, motif) values (a, arthur, 'autre');
    insert into resultats (test, resultat) values ('Une annonce et un profil à la fois (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when check_violation or unique_violation then
    insert into resultats (test, resultat) values ('Une annonce et un profil à la fois (attendu : refusé)', 'refusé');
  end;
  select count(*) into n from public.signalements;
  insert into resultats (test, resultat) values ('Sirown voit ses signalements (attendu 1)', n);
  update public.signalements set statut = 'classe' where id = s;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Sirown classe son signalement (attendu 0)', n);
  begin
    perform * from public.file_signalements();
    insert into resultats (test, resultat) values ('Sirown ouvre la file (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Sirown ouvre la file (attendu : refusé)', 'refusé');
  end;
  begin
    perform public.retirer_annonce_signalee(s);
    insert into resultats (test, resultat) values ('Sirown retire l''annonce (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Sirown retire l''annonce (attendu : refusé)', 'refusé');
  end;

  -- Arthur (admin) voit la file, traite, puis retire l'annonce
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.file_signalements() where annonce = a and statut = 'ouvert';
  insert into resultats (test, resultat) values ('Arthur (admin) voit le signalement ouvert (attendu 1)', n);
  update public.signalements set statut = 'traite' where id = s;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Arthur (admin) traite le signalement (attendu 1)', n);
  select public.signalements_ouverts() into n;
  insert into resultats (test, resultat) values ('Signalements ouverts après traitement (attendu 0)', n);
  perform public.retirer_annonce_signalee(s);
  select count(*) into n from public.annonces where id = a;
  insert into resultats (test, resultat) values ('Annonce après retrait (attendu 0)', n);
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
