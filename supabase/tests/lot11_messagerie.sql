-- Test du lot 11 : on ne s'écrit qu'après un accord, personne ne peut écrire au nom d'un autre,
-- la conversation se ferme quand l'accord est retiré, et les notifications ne s'empilent pas.
-- À lancer dans Supabase › SQL Editor (comptes Arthur et Sirown). Tout est annulé à la fin.
-- Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare arthur uuid; sirown uuid; n int; a uuid; d uuid;
begin
  select id into arthur from auth.users where email = 'paul.arthur17270@gmail.com';
  select id into sirown from auth.users where email = 'sirown17@gmail.com';

  -- Arthur publie ; Sirown demande le contact
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description)
    values ('propose', 'Photo', 'Annonce de messagerie', 'Une annonce pour tester la messagerie.') returning id into a;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.demandes (annonce, message) values (a, 'Bonjour') returning id into d;

  -- Demande en attente : pas de messagerie
  begin
    insert into public.messages (demande, texte) values (d, 'Trop tôt');
    insert into resultats (test, resultat) values ('Sirown écrit avant l''accord (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Sirown écrit avant l''accord (attendu : refusé)', 'refusé');
  end;

  -- Arthur accepte
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.demandes set statut = 'acceptee' where id = d;

  -- Sirown écrit deux messages : Arthur n'a qu'une seule notification non lue
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.messages (demande, texte) values (d, 'Salut Arthur');
  insert into public.messages (demande, texte) values (d, 'Tu es dispo vendredi ?');
  insert into resultats (test, resultat) values ('Sirown écrit après l''accord (attendu : accepté)', 'accepté');
  begin
    insert into public.messages (demande, texte) values (d, '   ');
    insert into resultats (test, resultat) values ('Message vide (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when check_violation then
    insert into resultats (test, resultat) values ('Message vide (attendu : refusé)', 'refusé');
  end;
  begin
    insert into public.messages (demande, texte) values (d, repeat('a', 501));
    insert into resultats (test, resultat) values ('Message de 501 caractères (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when check_violation then
    insert into resultats (test, resultat) values ('Message de 501 caractères (attendu : refusé)', 'refusé');
  end;
  begin
    insert into public.messages (demande, texte, auteur) values (d, 'Faux', arthur);
    insert into resultats (test, resultat) values ('Sirown écrit au nom d''Arthur (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Sirown écrit au nom d''Arthur (attendu : refusé)', 'refusé');
  end;
  select public.messages_non_lus() into n;
  insert into resultats (test, resultat) values ('Sirown n''a aucun message non lu (attendu 0)', n);

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', arthur, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.notifications where type = 'message_recu' and lue_le is null;
  insert into resultats (test, resultat) values ('Arthur a 1 seule notification de message non lue (attendu 1)', n);
  select public.messages_non_lus() into n;
  insert into resultats (test, resultat) values ('Arthur a 2 messages non lus (attendu 2)', n);
  select non_lus into n from public.mes_conversations() where demande = d;
  insert into resultats (test, resultat) values ('Conversation d''Arthur : 2 non lus (attendu 2)', n);
  update public.messages set lu_le = now() where demande = d;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Arthur marque les messages reçus comme lus (attendu 2)', n);
  begin
    update public.messages set texte = 'Modifié' where demande = d;
    insert into resultats (test, resultat) values ('Arthur modifie le texte d''un message (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Arthur modifie le texte d''un message (attendu : refusé)', 'refusé');
  end;

  -- Arthur retire son accord : la conversation se ferme pour les deux
  update public.demandes set statut = 'retiree' where id = d;
  select count(*) into n from public.messages where demande = d;
  insert into resultats (test, resultat) values ('Arthur lit la conversation après retrait (attendu 0)', n);
  begin
    insert into public.messages (demande, texte) values (d, 'Encore là ?');
    insert into resultats (test, resultat) values ('Arthur écrit après retrait (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Arthur écrit après retrait (attendu : refusé)', 'refusé');
  end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sirown, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.messages where demande = d;
  insert into resultats (test, resultat) values ('Sirown lit la conversation après retrait (attendu 0)', n);
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
