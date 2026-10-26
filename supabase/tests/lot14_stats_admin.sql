-- Test du lot 14 : seule l'admin lit les statistiques, et les nombres suivent les données.
-- À lancer dans Supabase › SQL Editor (comptes Arthur et Sirown). Tout est annulé à la fin.
-- Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare arthur uuid; sirown uuid; avant jsonb; apres jsonb; n int;
begin
  select id into arthur from auth.users where email = 'paul.arthur17270@gmail.com';
  select id into sirown from auth.users where email = 'sirown17@gmail.com';
  update public.profils set est_admin = true where id = arthur; -- rôle donné ici, en dehors de l'appli
  update public.profils set est_admin = false where id = sirown;

  -- Sirown (pas admin) : refusé
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.stats_admin();
    insert into resultats (test, resultat) values ('Sirown (non admin) lit les statistiques (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Sirown (non admin) lit les statistiques (attendu : refusé)', 'refusé');
  end;

  -- Arthur (admin) lit, publie, relit
  reset role;
  -- Libère la limite de 5 annonces en ligne : les annonces existantes d'Arthur sont retirées, mais tout est annulé à la fin.
  delete from public.annonces where auteur = arthur;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  avant := public.stats_admin();
  insert into resultats (test, resultat) values ('Arthur (admin) a le nombre d''étudiants (attendu : au moins 2)', case when (avant ->> 'etudiants')::int >= 2 then 'au moins 2' else 'moins de 2 (problème)' end);
  insert into public.annonces (type, categorie, titre, description)
    values ('cherche', 'Photo', 'Annonce de statistiques', 'Pour vérifier que les statistiques bougent.');
  apres := public.stats_admin();
  n := (apres ->> 'annonces_en_ligne')::int - (avant ->> 'annonces_en_ligne')::int;
  insert into resultats (test, resultat) values ('Annonces en ligne après publication (attendu +1)', n);
  n := (apres -> 'par_type' ->> 'cherche')::int - (avant -> 'par_type' ->> 'cherche')::int;
  insert into resultats (test, resultat) values ('Annonces « Je cherche » après publication (attendu +1)', n);
  n := (select coalesce(sum((c ->> 'nombre')::int), 0) from jsonb_array_elements(apres -> 'par_categorie') c)
     - (select coalesce(sum((c ->> 'nombre')::int), 0) from jsonb_array_elements(avant -> 'par_categorie') c);
  insert into resultats (test, resultat) values ('Total par catégorie après publication (attendu +1)', n);
  insert into resultats (test, resultat) values ('Le total par campus égale les annonces en ligne (attendu oui)',
    case when (select sum((c ->> 'nombre')::int) from jsonb_array_elements(apres -> 'par_campus') c) = (apres ->> 'annonces_en_ligne')::int then 'oui' else 'non (problème)' end);
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
