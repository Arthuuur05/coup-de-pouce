-- Test du lot 6 : compétences (12 au plus), avis (seulement après un accord, un par demande) et CV.
-- À lancer dans Supabase › SQL Editor, avec les comptes lea.test@example.com et sam.test@example.com.
-- Tout est annulé à la fin (rollback), rien n'est modifié. Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare lea uuid; sam uuid; a uuid; d1 uuid; c uuid; n int; i int;
begin
  select id into lea from auth.users where email = 'lea.test@example.com';
  select id into sam from auth.users where email = 'sam.test@example.com';

  -- Sam publie une annonce et a une compétence ; Léa le demande, pas encore d'accord
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description)
    values ('propose', 'Photo', 'Photos de soirée', 'Je couvre ta soirée avec mon reflex.') returning id into a;
  insert into public.competences (nom) values ('  Photo   de soirée ') returning id into c;
  select count(*) into n from public.competences where nom = 'Photo de soirée';
  insert into resultats (test, resultat) values ('Le nom de la compétence est nettoyé (attendu 1)', n);
  begin
    insert into public.competences (nom) values ('photo de soirée');
    insert into resultats (test, resultat) values ('Même compétence deux fois (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when unique_violation then
    insert into resultats (test, resultat) values ('Même compétence deux fois (attendu : refusé)', 'refusé');
  end;
  for i in 1..11 loop insert into public.competences (nom) values ('Compétence ' || i); end loop;
  begin
    insert into public.competences (nom) values ('La treizième');
    insert into resultats (test, resultat) values ('13e compétence (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('13e compétence (attendu : refusé)', 'refusé');
  end;

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.demandes (annonce) values (a) returning id into d1;
  begin
    insert into public.avis (demande, note) values (d1, 5);
    insert into resultats (test, resultat) values ('Avis avant l''accord (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Avis avant l''accord (attendu : refusé)', 'refusé');
  end;
  begin
    delete from public.competences where id = c;
    get diagnostics n = row_count;
    insert into resultats (test, resultat) values ('Léa supprime la compétence de Sam (attendu 0)', n);
  end;

  -- Sam accepte
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.demandes set statut = 'acceptee' where id = d1;

  -- Léa donne son avis en confirmant la compétence de Sam
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.avis (demande, note, commentaire, competence) values (d1, 5, 'Super photos', c);
  select count(*) into n from public.avis where cible = sam and auteur = lea and competence = c;
  insert into resultats (test, resultat) values ('Léa publie un avis sur Sam, la cible est déduite (attendu 1)', n);
  begin
    insert into public.avis (demande, note) values (d1, 4);
    insert into resultats (test, resultat) values ('Deuxième avis de Léa sur la même demande (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when unique_violation then
    insert into resultats (test, resultat) values ('Deuxième avis de Léa sur la même demande (attendu : refusé)', 'refusé');
  end;
  begin
    insert into public.avis (demande, note) values (d1, 6);
    insert into resultats (test, resultat) values ('Note de 6 (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when check_violation or unique_violation then
    insert into resultats (test, resultat) values ('Note de 6 (attendu : refusé)', 'refusé');
  end;

  -- Sam peut répondre par un avis, mais pas confirmer une compétence de Léa qui n'existe pas
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.avis (demande, note, competence) values (d1, 5, c);
    insert into resultats (test, resultat) values ('Sam confirme une compétence à lui sur Léa (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Sam confirme une compétence à lui sur Léa (attendu : refusé)', 'refusé');
  end;
  select count(*) into n from public.avis where cible = sam;
  insert into resultats (test, resultat) values ('Sam voit l''avis reçu (attendu 1)', n);
  delete from public.avis where cible = sam;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Sam supprime l''avis que Léa a écrit (attendu 0)', n);

  -- CV : Sam ajoute le sien, Léa le voit (accord), un tiers non
  insert into public.cvs (chemin) values (sam || '/cv.pdf');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.cvs where personne = sam;
  insert into resultats (test, resultat) values ('Léa voit le CV de Sam après l''accord (attendu 1)', n);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.demandes set statut = 'retiree' where id = d1;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.cvs where personne = sam;
  insert into resultats (test, resultat) values ('Léa voit le CV de Sam après le retrait de l''accord (attendu 0)', n);
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
