-- Test de la clôture du lot 5 : le demandeur peut retirer l'accord, et pas plus de 10 demandes en attente à la fois.
-- À lancer dans Supabase › SQL Editor. Tout est annulé à la fin (rollback), rien n'est modifié.
-- Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare lea uuid; sam uuid; a uuid; d1 uuid; n int; lot int; i int;
begin
  select id into lea from auth.users where email = 'lea.test@example.com';
  select id into sam from auth.users where email = 'sam.test@example.com';

  -- Sam publie, Léa demande, Sam accepte
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description)
    values ('propose', 'Photo', 'Photos pour ta soirée', 'Je couvre ta soirée avec mon reflex.') returning id into a;
  insert into public.coordonnees (email) values ('sam@exemple.fr')
    on conflict (personne) do update set email = excluded.email;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.demandes (annonce, message) values (a, 'Salut Sam !') returning id into d1;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.demandes set statut = 'acceptee' where id = d1;

  -- Léa ne peut pas « ré-accepter » ni refuser à la place de Sam, mais peut retirer l'accord
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    update public.demandes set statut = 'refusee' where id = d1;
    insert into resultats (test, resultat) values ('Léa refuse sa propre demande à la place de Sam (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Léa refuse sa propre demande à la place de Sam (attendu : refusé)', 'refusé');
  end;
  update public.demandes set statut = 'retiree' where id = d1;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Léa retire l''accord de son côté (attendu 1)', n);
  select count(*) into n from public.coordonnees where personne = sam;
  insert into resultats (test, resultat) values ('Après son retrait, Léa voit les coordonnées de Sam (attendu 0)', n);
  begin
    update public.demandes set statut = 'acceptee' where id = d1;
    insert into resultats (test, resultat) values ('Léa remet l''accord toute seule (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Léa remet l''accord toute seule (attendu : refusé)', 'refusé');
  end;

  -- 10 demandes en attente au plus : Sam publie par paquets de 5 (sa limite), qu'on fait expirer entre deux paquets
  for lot in 1..2 loop
    reset role;
    perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
    set local role authenticated;
    if lot = 1 then
      update public.annonces set statut = 'reglee' where id = a;
    end if;
    for i in 1..5 loop
      insert into public.annonces (type, categorie, titre, description)
        values ('propose', 'Photo', 'Cours numéro ' || lot || '-' || i, 'Un cours de test pour la limite.');
    end loop;
    reset role;
    perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
    set local role authenticated;
    for a in select id from public.annonces where auteur = sam and statut = 'active' and expire_le > now() loop
      insert into public.demandes (annonce) values (a);
    end loop;
    reset role;
    update public.annonces set expire_le = now() - interval '1 day' where auteur = sam and statut = 'active';
  end loop;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.demandes where demandeur = lea and statut = 'en_attente';
  insert into resultats (test, resultat) values ('Léa a 10 demandes en attente (attendu 10)', n);

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description)
    values ('propose', 'Photo', 'Une onzième annonce', 'Pour tester la onzième demande.') returning id into a;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.demandes (annonce) values (a);
    insert into resultats (test, resultat) values ('Léa envoie une 11e demande en attente (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Léa envoie une 11e demande en attente (attendu : refusé)', 'refusé');
  end;

  -- Les demandes d'une annonce expirée restent, et Sam peut encore y répondre
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.demandes set statut = 'acceptee'
    where id = (select id from public.demandes where auteur = sam and statut = 'en_attente' limit 1);
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Sam accepte une demande sur une annonce expirée (attendu 1)', n);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.demandes (annonce) values (a);
    insert into resultats (test, resultat) values ('Avec 9 en attente, Léa peut de nouveau demander (attendu : accepté)', 'accepté');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Avec 9 en attente, Léa peut de nouveau demander (attendu : accepté)', 'REFUSÉ (problème)');
  end;
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
