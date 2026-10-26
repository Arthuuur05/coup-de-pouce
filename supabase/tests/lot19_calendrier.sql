-- Test du lot 19 : rendez-vous après accord, notifications, rappel la veille, et rien pour les autres.
-- À lancer dans Supabase › SQL Editor (comptes Arthur et Sirown). Tout est annulé à la fin.
-- Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare arthur uuid; sirown uuid; n int; a1 uuid; d1 uuid; r record;
begin
  select id into arthur from auth.users where email = 'paul.arthur17270@gmail.com';
  select id into sirown from auth.users where email = 'sirown17@gmail.com';
  -- Libère la limite de 5 annonces en ligne : les annonces existantes (et leurs demandes) sont retirées, mais tout est annulé à la fin.
  delete from public.annonces where auteur in (arthur, sirown);
  delete from public.notifications where personne in (arthur, sirown);

  -- Arthur propose, Sirown demande (pas encore d'accord)
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description)
    values ('propose', 'Photo', 'Je fais des photos', 'Annonce pour tester le calendrier.') returning id into a1;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.demandes (annonce, message) values (a1, 'Bonjour') returning id into d1;
  begin
    insert into public.rendez_vous (demande, quand) values (d1, now() + interval '3 days');
    insert into resultats (test, resultat) values ('Rendez-vous avant l''accord (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Rendez-vous avant l''accord (attendu : refusé)', 'refusé');
  end;

  -- Arthur accepte
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.demandes set statut = 'acceptee' where id = d1;

  -- Sirown fixe un rendez-vous dans 3 jours
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.rendez_vous (demande, quand) values (d1, now() - interval '1 hour');
    insert into resultats (test, resultat) values ('Rendez-vous dans le passé (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Rendez-vous dans le passé (attendu : refusé)', 'refusé');
  end;
  begin
    insert into public.rendez_vous (demande, quand) values (d1, now() + interval '2 years');
    insert into resultats (test, resultat) values ('Rendez-vous dans deux ans (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Rendez-vous dans deux ans (attendu : refusé)', 'refusé');
  end;
  insert into public.rendez_vous (demande, quand, lieu) values (d1, now() + interval '3 days', '  Bibliothèque  ');
  select * into r from public.rendez_vous where demande = d1;
  insert into resultats (test, resultat) values ('Rendez-vous fixé, lieu nettoyé (attendu Bibliothèque)', r.lieu);
  insert into resultats (test, resultat) values ('Rappel pas encore envoyé : dans 3 jours (attendu false)', r.rappel_envoye);
  begin
    insert into public.rendez_vous (demande, quand) values (d1, now() + interval '4 days');
    insert into resultats (test, resultat) values ('Deux rendez-vous pour le même accord (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when unique_violation then
    insert into resultats (test, resultat) values ('Deux rendez-vous pour le même accord (attendu : refusé)', 'refusé');
  end;
  begin
    update public.rendez_vous set propose_par = arthur where demande = d1;
    insert into resultats (test, resultat) values ('Changer l''auteur du rendez-vous (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Changer l''auteur du rendez-vous (attendu : refusé)', 'refusé');
  end;
  select count(*) into n from public.notifications where type = 'rdv_fixe';
  insert into resultats (test, resultat) values ('Sirown, qui a fixé, n''est pas notifié (attendu 0)', n);

  -- Arthur voit le rendez-vous et est prévenu ; il le déplace : toujours une seule notification non lue
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.mes_rendez_vous();
  insert into resultats (test, resultat) values ('Arthur voit le rendez-vous (attendu 1)', n);
  select count(*) into n from public.notifications where type = 'rdv_fixe' and lue_le is null;
  insert into resultats (test, resultat) values ('Arthur prévenu du rendez-vous (attendu 1)', n);
  select public.rappels_rdv() into n;
  insert into resultats (test, resultat) values ('Pas de rappel à 3 jours (attendu 0)', n);
  update public.rendez_vous set quand = now() + interval '5 days', lieu = 'Salle B12' where demande = d1;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.notifications where type = 'rdv_fixe' and lue_le is null;
  insert into resultats (test, resultat) values ('Sirown prévenu du déplacement, une seule notification (attendu 1)', n);

  -- Rappel la veille : le rendez-vous passe sous 24 h sans que le rappel soit parti
  reset role;
  update public.rendez_vous set quand = now() + interval '20 hours' where demande = d1;
  select rappel_envoye into r from public.rendez_vous where demande = d1;
  insert into resultats (test, resultat) values ('Date changée à moins de 24 h : pas de rappel superflu (attendu true)', r.rappel_envoye);
  update public.rendez_vous set rappel_envoye = false where demande = d1;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select public.rappels_rdv() into n;
  insert into resultats (test, resultat) values ('Arthur ouvre l''appli : 1 rappel créé (attendu 1)', n);
  select count(*) into n from public.notifications where type = 'rdv_rappel';
  insert into resultats (test, resultat) values ('Arthur a son rappel (attendu 1)', n);
  select public.rappels_rdv() into n;
  insert into resultats (test, resultat) values ('Deuxième ouverture : pas de doublon (attendu 0)', n);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.notifications where type = 'rdv_rappel';
  insert into resultats (test, resultat) values ('Sirown a aussi son rappel (attendu 1)', n);

  -- Annuler : l'autre est prévenu
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.rendez_vous where demande = d1;
  select count(*) into n from public.rendez_vous;
  insert into resultats (test, resultat) values ('Rendez-vous annulé (attendu 0)', n);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.notifications where type = 'rdv_annule';
  insert into resultats (test, resultat) values ('Sirown prévenu de l''annulation (attendu 1)', n);

  -- Accord retiré : le rendez-vous disparaît de l'écran
  insert into public.rendez_vous (demande, quand) values (d1, now() + interval '2 days');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.demandes set statut = 'retiree' where id = d1;
  select count(*) into n from public.mes_rendez_vous();
  insert into resultats (test, resultat) values ('Accord retiré : plus de rendez-vous dans la liste (attendu 0)', n);
  select count(*) into n from public.rendez_vous;
  insert into resultats (test, resultat) values ('Accord retiré : plus de rendez-vous lisible (attendu 0)', n);

  -- Sans connexion : refusé
  reset role;
  set local role anon;
  begin
    perform public.rappels_rdv();
    insert into resultats (test, resultat) values ('Visiteur non connecté : rappels (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Visiteur non connecté : rappels (attendu : refusé)', 'refusé');
  end;
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
