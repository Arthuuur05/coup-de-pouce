-- Test du lot 17 : les chiffres des badges comptent juste, chacun ne fête que ses propres badges.
-- À lancer dans Supabase › SQL Editor (comptes Arthur et Sirown). Tout est annulé à la fin.
-- Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare arthur uuid; sirown uuid; n int; a1 uuid; d1 uuid; s jsonb;
begin
  select id into arthur from auth.users where email = 'paul.arthur17270@gmail.com';
  select id into sirown from auth.users where email = 'sirown17@gmail.com';
  -- Libère la limite de 5 annonces en ligne : les annonces existantes sont retirées, mais tout est annulé à la fin.
  delete from public.annonces where auteur in (arthur, sirown);
  delete from public.badges_vus where personne in (arthur, sirown);

  -- Arthur publie une annonce « Je propose », Sirown demande, Arthur accepte
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description)
    values ('propose', 'Photo', 'Je fais des photos', 'Annonce pour tester les badges.') returning id into a1;
  s := public.stats_badges(arthur);
  insert into resultats (test, resultat) values ('Arthur : 1 annonce publiée (attendu 1)', s ->> 'annonces');
  insert into resultats (test, resultat) values ('Arthur : aucun coup de pouce avant l''accord (attendu 0)', s ->> 'coups');

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.demandes (annonce, message) values (a1, 'Bonjour') returning id into d1;
  s := public.stats_badges(arthur);
  insert into resultats (test, resultat) values ('Demande en attente : toujours 0 coup de pouce pour Arthur (attendu 0)', s ->> 'coups');

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.demandes set statut = 'acceptee' where id = d1;
  s := public.stats_badges(arthur);
  insert into resultats (test, resultat) values ('Arthur après l''accord : 1 coup de pouce (attendu 1)', s ->> 'coups');
  s := public.stats_badges(sirown);
  insert into resultats (test, resultat) values ('Sirown, qui a demandé, n''a rien rendu (attendu 0)', s ->> 'coups');
  insert into resultats (test, resultat) values ('Sirown : pas d''avis, donc pas de note (attendu null)', coalesce(s ->> 'note', 'null'));

  -- Fêter un badge : seulement pour soi, une seule fois
  insert into public.badges_vus (badge) values ('premier-coup');
  select count(*) into n from public.badges_vus;
  insert into resultats (test, resultat) values ('Arthur a fêté 1 badge (attendu 1)', n);
  begin
    insert into public.badges_vus (badge) values ('premier-coup');
    insert into resultats (test, resultat) values ('Fêter deux fois le même badge (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when unique_violation then
    insert into resultats (test, resultat) values ('Fêter deux fois le même badge (attendu : refusé)', 'refusé');
  end;
  begin
    insert into public.badges_vus (personne, badge) values (sirown, 'coups-5');
    insert into resultats (test, resultat) values ('Fêter un badge au nom de Sirown (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege or check_violation then
    insert into resultats (test, resultat) values ('Fêter un badge au nom de Sirown (attendu : refusé)', 'refusé');
  end;

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.badges_vus;
  insert into resultats (test, resultat) values ('Sirown ne voit pas les badges fêtés d''Arthur (attendu 0)', n);

  -- Sans connexion : pas de chiffres
  reset role;
  set local role anon;
  begin
    perform public.stats_badges(arthur);
    insert into resultats (test, resultat) values ('Visiteur non connecté lit les chiffres (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Visiteur non connecté lit les chiffres (attendu : refusé)', 'refusé');
  end;
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
