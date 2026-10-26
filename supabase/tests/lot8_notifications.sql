-- Test du lot 8 : chacun ne voit que ses notifications, personne n'en crée à la main, et elles suivent les demandes et les avis.
-- À lancer dans Supabase › SQL Editor (comptes lea.test@example.com et sam.test@example.com). Tout est annulé à la fin.
-- Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare lea uuid; sam uuid; n int; a uuid; d uuid;
begin
  select id into lea from auth.users where email = 'lea.test@example.com';
  select id into sam from auth.users where email = 'sam.test@example.com';

  -- Léa publie une annonce
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description)
    values ('propose', 'Photo', 'Photos de portrait', 'Je fais des portraits au campus.') returning id into a;

  -- Sam demande le contact : Léa est notifiée, pas Sam
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.demandes (annonce, message) values (a, 'Bonjour') returning id into d;
  select count(*) into n from public.notifications;
  insert into resultats (test, resultat) values ('Sam voit ses notifications juste après sa demande (attendu 0)', n);
  begin
    insert into public.notifications (personne, type, acteur, titre) values (sam, 'avis_recu', lea, 'Faux');
    insert into resultats (test, resultat) values ('Sam crée une notification à la main (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Sam crée une notification à la main (attendu : refusé)', 'refusé');
  end;

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.notifications where type = 'demande_recue' and lue_le is null and titre = 'Photos de portrait';
  insert into resultats (test, resultat) values ('Léa a 1 notification « demande reçue » non lue (attendu 1)', n);
  update public.notifications set lue_le = now() where personne = lea;
  select count(*) into n from public.notifications where lue_le is not null;
  insert into resultats (test, resultat) values ('Léa marque sa notification comme lue (attendu 1)', n);
  begin
    update public.notifications set type = 'acceptee';
    insert into resultats (test, resultat) values ('Léa change le type d''une notification (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Léa change le type d''une notification (attendu : refusé)', 'refusé');
  end;

  -- Léa accepte : Sam est notifié
  update public.demandes set statut = 'acceptee' where id = d;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.notifications where type = 'acceptee' and lue_le is null;
  insert into resultats (test, resultat) values ('Sam a 1 notification « acceptée » (attendu 1)', n);
  -- Sam ne peut pas lire ni effacer celles de Léa
  select count(*) into n from public.notifications where personne = lea;
  insert into resultats (test, resultat) values ('Sam voit les notifications de Léa (attendu 0)', n);
  delete from public.notifications where personne = lea;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Sam efface les notifications de Léa (attendu 0)', n);

  -- Sam donne un avis : Léa est notifiée
  insert into public.avis (demande, note, commentaire) values (d, 5, 'Top');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.notifications where type = 'avis_recu';
  insert into resultats (test, resultat) values ('Léa a 1 notification « avis reçu » (attendu 1)', n);
  delete from public.notifications where personne = lea;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Léa efface ses notifications (attendu 2)', n);
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
