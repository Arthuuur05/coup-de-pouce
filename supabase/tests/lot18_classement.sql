-- Test du lot 18 : le classement du mois compte les coups de pouce rendus ce mois-ci, respecte le choix de ne pas apparaître,
-- et ne montre rien aux visiteurs non connectés.
-- À lancer dans Supabase › SQL Editor (comptes Arthur et Sirown). Tout est annulé à la fin.
-- Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare arthur uuid; sirown uuid; n int; a1 uuid; a2 uuid; d1 uuid; d2 uuid; l record;
begin
  select id into arthur from auth.users where email = 'paul.arthur17270@gmail.com';
  select id into sirown from auth.users where email = 'sirown17@gmail.com';
  -- Libère la limite de 5 annonces en ligne : les annonces existantes (et leurs demandes) sont retirées, mais tout est annulé à la fin.
  delete from public.annonces where auteur in (arthur, sirown);

  -- Arthur propose, Sirown demande, Arthur accepte : 1 coup de pouce pour Arthur
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description)
    values ('propose', 'Photo', 'Je fais des photos', 'Annonce pour tester le classement.') returning id into a1;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.demandes (annonce, message) values (a1, 'Bonjour') returning id into d1;
  select count(*) into n from public.classement_mensuel(0, null) where personne = arthur;
  insert into resultats (test, resultat) values ('Demande en attente : Arthur absent du classement (attendu 0)', n);

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.demandes set statut = 'acceptee' where id = d1;
  select coups into n from public.classement_mensuel(0, null) where personne = arthur;
  insert into resultats (test, resultat) values ('Arthur après un accord : 1 coup de pouce ce mois-ci (attendu 1)', n);

  -- Sirown cherche, Arthur répond, Sirown accepte : Arthur 2, Sirown rien
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description)
    values ('cherche', 'Photo', 'Je cherche un photographe', 'Annonce pour tester le classement.') returning id into a2;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.demandes (annonce, message) values (a2, 'Je peux t''aider') returning id into d2;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.demandes set statut = 'acceptee' where id = d2;
  select coups into n from public.classement_mensuel(0, null) where personne = arthur;
  insert into resultats (test, resultat) values ('Arthur a aussi répondu à une annonce « Je cherche » (attendu 2)', n);
  select count(*) into n from public.classement_mensuel(0, null) where personne = sirown;
  insert into resultats (test, resultat) values ('Sirown n''a rien rendu : absent du classement (attendu 0)', n);
  select count(*) into n from public.classement_mensuel(0, null) where personne = arthur and not moi;
  insert into resultats (test, resultat) values ('Sirown voit Arthur, sans le marquer comme lui (attendu 1)', n);

  select count(*) into n from public.classement_mensuel(1, null) where personne = arthur;
  insert into resultats (test, resultat) values ('Mois dernier : Arthur n''y est pas (attendu 0)', n);
  select count(*) into n from public.classement_mensuel(0, 'Campus inexistant') where personne = arthur;
  insert into resultats (test, resultat) values ('Campus inexistant : personne (attendu 0)', n);

  -- Arthur choisit de ne plus apparaître
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select (moi) into l from public.classement_mensuel(0, null) where personne = arthur;
  insert into resultats (test, resultat) values ('Arthur se voit marqué « toi » (attendu true)', l.moi);
  update public.profils set classement = false where id = arthur;
  select count(*) into n from public.classement_mensuel(0, null) where personne = arthur;
  insert into resultats (test, resultat) values ('Arthur a choisi de ne plus apparaître (attendu 0)', n);
  begin
    update public.profils set est_admin = true where id = arthur;
    insert into resultats (test, resultat) values ('Se donner le rôle admin (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Se donner le rôle admin (attendu : refusé)', 'refusé');
  end;

  -- Sans connexion : refusé
  reset role;
  set local role anon;
  begin
    perform public.classement_mensuel(0, null);
    insert into resultats (test, resultat) values ('Visiteur non connecté lit le classement (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Visiteur non connecté lit le classement (attendu : refusé)', 'refusé');
  end;
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
