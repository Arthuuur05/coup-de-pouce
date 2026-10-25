-- Test du lot 4 : « Léa ne peut pas modifier l'annonce de Sam », et les autres règles de la table annonces.
-- À lancer dans Supabase › SQL Editor. Tout est annulé à la fin (rollback), rien n'est modifié.
-- Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare lea uuid; sam uuid; annonce uuid; n int; t text; i int;
begin
  select id into lea from auth.users where email = 'lea.test@example.com';
  select id into sam from auth.users where email = 'sam.test@example.com';

  -- Sam publie
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description)
    values ('propose', 'Photo', 'Photos pour ton événement', 'Je couvre ta soirée avec mon reflex, retouches comprises.')
    returning id into annonce;
  insert into resultats (test, resultat) values ('Sam publie une annonce (attendu : oui)', case when annonce is null then 'non' else 'oui' end);
  select case when a.campus = p.campus then 'oui' else 'non' end into t
    from public.annonces a join public.profils p on p.id = a.auteur where a.id = annonce;
  insert into resultats (test, resultat) values ('Le campus de l''annonce est celui de Sam (attendu : oui)', t);

  -- Léa regarde, puis essaie de toucher à l'annonce de Sam
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.annonces where id = annonce;
  insert into resultats (test, resultat) values ('Léa voit l''annonce de Sam (attendu 1)', n);
  update public.annonces set titre = 'Piraté' where id = annonce;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Léa modifie l''annonce de Sam (attendu 0)', n);
  update public.annonces set statut = 'reglee' where id = annonce;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Léa marque « C''est réglé » chez Sam (attendu 0)', n);
  delete from public.annonces where id = annonce;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Léa supprime l''annonce de Sam (attendu 0)', n);
  begin
    insert into public.annonces (auteur, type, categorie, titre, description)
      values (sam, 'cherche', 'Autre', 'Faux nom', 'Une annonce publiée au nom de Sam.');
    insert into resultats (test, resultat) values ('Léa publie au nom de Sam (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Léa publie au nom de Sam (attendu : refusé)', 'refusé');
  end;
  select count(*) into n from public.profils_publics(array[sam]);
  insert into resultats (test, resultat) values ('Léa voit le prénom de Sam (attendu 1)', n);
  select count(*) into n from public.profils_publics(array[sam]) p where to_jsonb(p) ? 'nom';
  insert into resultats (test, resultat) values ('Le nom de famille de Sam est visible (attendu 0)', n);

  -- Sam gère son annonce
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.annonces set titre = 'Photos pour ta soirée' where id = annonce;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Sam modifie son annonce (attendu 1)', n);
  update public.annonces set expire_le = '2099-01-01' where id = annonce;
  select case when expire_le <= now() + interval '30 days' then 'oui' else 'non' end into t from public.annonces where id = annonce;
  insert into resultats (test, resultat) values ('Une annonce ne dure jamais plus de 30 jours (attendu : oui)', t);
  update public.annonces set statut = 'reglee' where id = annonce;

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.annonces where id = annonce;
  insert into resultats (test, resultat) values ('Léa voit l''annonce réglée de Sam (attendu 0)', n);

  -- Limite de 5 annonces en ligne
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.annonces where id = annonce;
  insert into resultats (test, resultat) values ('Sam voit encore son annonce réglée (attendu 1)', n);
  delete from public.annonces where auteur = sam and id <> annonce;
  for i in 1..5 loop
    insert into public.annonces (type, categorie, titre, description)
      values ('cherche', 'Autre', 'Annonce ' || i, 'Annonce de test numéro ' || i || '.');
  end loop;
  begin
    insert into public.annonces (type, categorie, titre, description)
      values ('cherche', 'Autre', 'Une de trop', 'La sixième annonce en ligne.');
    insert into resultats (test, resultat) values ('Sam publie une 6e annonce en ligne (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Sam publie une 6e annonce en ligne (attendu : refusé)', 'refusé');
  end;
  begin
    update public.annonces set statut = 'active' where id = annonce;
    insert into resultats (test, resultat) values ('Sam remet en ligne une 6e annonce (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Sam remet en ligne une 6e annonce (attendu : refusé)', 'refusé');
  end;

  -- Annonce expirée
  update public.annonces set expire_le = now() - interval '1 day' where auteur = sam and titre = 'Annonce 1';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.annonces where auteur = sam;
  insert into resultats (test, resultat) values ('Léa voit les annonces en ligne de Sam, sans l''expirée (attendu 4)', n);

  -- Visiteur non connecté
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  begin
    select count(*) into n from public.annonces;
    insert into resultats (test, resultat) values ('Un visiteur lit les annonces (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Un visiteur lit les annonces (attendu : refusé)', 'refusé');
  end;
  begin
    select count(*) into n from public.profils_publics(array[sam]);
    insert into resultats (test, resultat) values ('Un visiteur lit les prénoms (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Un visiteur lit les prénoms (attendu : refusé)', 'refusé');
  end;
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
