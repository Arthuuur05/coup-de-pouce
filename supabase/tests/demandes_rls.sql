-- Test du lot 5 : « avant accord, Léa ne reçoit pas les coordonnées de Sam », et les autres règles des demandes.
-- À lancer dans Supabase › SQL Editor. Tout est annulé à la fin (rollback), rien n'est modifié.
-- Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare lea uuid; sam uuid; a1 uuid; a2 uuid; d1 uuid; d2 uuid; n int;
begin
  select id into lea from auth.users where email = 'lea.test@example.com';
  select id into sam from auth.users where email = 'sam.test@example.com';

  -- Sam publie deux annonces et remplit ses coordonnées
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description)
    values ('propose', 'Photo', 'Photos pour ta soirée', 'Je couvre ta soirée avec mon reflex.') returning id into a1;
  insert into public.annonces (type, categorie, titre, description)
    values ('propose', 'Vidéo', 'Montage de ton clip', 'Je monte ton clip de deux minutes.') returning id into a2;
  insert into public.coordonnees (email, telephone, instagram) values ('sam@exemple.fr', '0600000000', 'sam.photo')
    on conflict (personne) do update set email = excluded.email, telephone = excluded.telephone, instagram = excluded.instagram;
  begin
    insert into public.demandes (annonce, message) values (a1, 'Je me demande à moi-même.');
    insert into resultats (test, resultat) values ('Sam demande le contact sur sa propre annonce (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Sam demande le contact sur sa propre annonce (attendu : refusé)', 'refusé');
  end;

  -- Léa remplit ses coordonnées et demande le contact
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.coordonnees (email, instagram) values ('lea@exemple.fr', 'lea.data')
    on conflict (personne) do update set email = excluded.email, instagram = excluded.instagram;
  insert into public.demandes (annonce, message) values (a1, 'Salut Sam, tu es dispo vendredi ?') returning id into d1;
  select count(*) into n from public.coordonnees where personne = sam;
  insert into resultats (test, resultat) values ('Avant accord, Léa reçoit les coordonnées de Sam (attendu 0)', n);
  begin
    insert into public.demandes (annonce, message) values (a1, 'Deuxième fois.');
    insert into resultats (test, resultat) values ('Léa demande deux fois sur la même annonce (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when unique_violation then
    insert into resultats (test, resultat) values ('Léa demande deux fois sur la même annonce (attendu : refusé)', 'refusé');
  end;
  begin
    insert into public.demandes (annonce, message) values (a2, repeat('x', 301));
    insert into resultats (test, resultat) values ('Message de 301 caractères (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when check_violation then
    insert into resultats (test, resultat) values ('Message de 301 caractères (attendu : refusé)', 'refusé');
  end;
  begin
    insert into public.demandes (annonce, demandeur, message) values (a2, sam, 'Au nom de Sam.');
    insert into resultats (test, resultat) values ('Léa envoie une demande au nom de Sam (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Léa envoie une demande au nom de Sam (attendu : refusé)', 'refusé');
  end;
  update public.demandes set statut = 'acceptee' where id = d1;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Léa accepte elle-même sa demande (attendu 0)', n);
  update public.coordonnees set email = 'pirate@exemple.fr' where personne = sam;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Léa modifie les coordonnées de Sam (attendu 0)', n);

  -- Sam voit la demande, mais pas encore les coordonnées de Léa
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.demandes where id = d1 and message like 'Salut Sam%';
  insert into resultats (test, resultat) values ('Sam reçoit la demande et son message (attendu 1)', n);
  select count(*) into n from public.coordonnees where personne = lea;
  insert into resultats (test, resultat) values ('Avant accord, Sam reçoit les coordonnées de Léa (attendu 0)', n);

  -- Sam accepte : chacun voit l'autre
  update public.demandes set statut = 'acceptee' where id = d1;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Sam accepte (attendu 1)', n);
  select count(*) into n from public.coordonnees where personne = lea;
  insert into resultats (test, resultat) values ('Après accord, Sam voit les coordonnées de Léa (attendu 1)', n);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.coordonnees where personne = sam;
  insert into resultats (test, resultat) values ('Après accord, Léa voit les coordonnées de Sam (attendu 1)', n);

  -- Sam retire son accord : tout redevient caché, et Léa ne peut pas redemander
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.demandes set statut = 'retiree' where id = d1;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.coordonnees where personne = sam;
  insert into resultats (test, resultat) values ('Après retrait de l''accord, Léa voit les coordonnées de Sam (attendu 0)', n);
  begin
    insert into public.demandes (annonce, message) values (a1, 'Je réessaie.');
    insert into resultats (test, resultat) values ('Léa redemande après le retrait (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when unique_violation then
    insert into resultats (test, resultat) values ('Léa redemande après le retrait (attendu : refusé)', 'refusé');
  end;

  -- Léa demande sur la 2e annonce, puis annule tant que c'est en attente
  insert into public.demandes (annonce, message) values (a2, 'Pour mon clip ?') returning id into d2;
  delete from public.demandes where id = d2;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Léa annule sa demande en attente (attendu 1)', n);
  insert into public.demandes (annonce, message) values (a2, 'Finalement oui.') returning id into d2;

  -- Sam règle la 2e annonce : la demande en attente disparaît
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.annonces set statut = 'reglee' where id = a2;
  select count(*) into n from public.demandes where id = d2;
  insert into resultats (test, resultat) values ('Demande en attente sur une annonce réglée (attendu 0)', n);

  -- Visiteur non connecté
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  begin
    select count(*) into n from public.coordonnees;
    insert into resultats (test, resultat) values ('Un visiteur lit des coordonnées (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Un visiteur lit des coordonnées (attendu : refusé)', 'refusé');
  end;
  begin
    select count(*) into n from public.demandes;
    insert into resultats (test, resultat) values ('Un visiteur lit des demandes (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Un visiteur lit des demandes (attendu : refusé)', 'refusé');
  end;
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
