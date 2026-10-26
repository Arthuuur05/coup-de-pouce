-- Test du lot 12 : le nombre de coups de pouce rendus compte les accords où la personne aidait, et rien d'autre.
-- À lancer dans Supabase › SQL Editor (comptes Arthur et Sirown). Tout est annulé à la fin.
-- Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare arthur uuid; sirown uuid; n int; a1 uuid; a2 uuid; d1 uuid; d2 uuid; avant_a int; avant_s int;
begin
  select id into arthur from auth.users where email = 'paul.arthur17270@gmail.com';
  select id into sirown from auth.users where email = 'sirown17@gmail.com';

  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select public.coups_de_pouce(arthur) into avant_a;
  select public.coups_de_pouce(sirown) into avant_s;

  -- Arthur propose (« Je propose »), Sirown demande : Arthur aide
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description)
    values ('propose', 'Photo', 'Je fais des photos', 'Annonce pour tester les coups de pouce.') returning id into a1;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.demandes (annonce, message) values (a1, 'Bonjour') returning id into d1;
  select public.coups_de_pouce(arthur) - avant_a into n;
  insert into resultats (test, resultat) values ('Demande en attente : pas encore de coup de pouce (attendu 0)', n);

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.demandes set statut = 'acceptee' where id = d1;
  select public.coups_de_pouce(arthur) - avant_a into n;
  insert into resultats (test, resultat) values ('Arthur après accord sur son annonce « Je propose » (attendu +1)', n);
  select public.coups_de_pouce(sirown) - avant_s into n;
  insert into resultats (test, resultat) values ('Sirown, lui, n''a rien gagné (attendu 0)', n);

  -- Sirown cherche (« Je cherche »), Arthur répond : Arthur aide encore
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description)
    values ('cherche', 'Photo', 'Je cherche un photographe', 'Annonce pour tester les coups de pouce.') returning id into a2;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.demandes (annonce, message) values (a2, 'Je peux t''aider') returning id into d2;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.demandes set statut = 'acceptee' where id = d2;
  select public.coups_de_pouce(arthur) - avant_a into n;
  insert into resultats (test, resultat) values ('Arthur après avoir répondu à une annonce « Je cherche » (attendu +2)', n);
  select public.coups_de_pouce(sirown) - avant_s into n;
  insert into resultats (test, resultat) values ('Sirown, qui cherchait, n''a rien gagné (attendu 0)', n);

  -- Un refus ne compte pas
  update public.demandes set statut = 'retiree' where id = d2;
  select public.coups_de_pouce(arthur) - avant_a into n;
  insert into resultats (test, resultat) values ('Accord retiré : le coup de pouce reste compté (attendu +2)', n);
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
