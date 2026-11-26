-- Test du rôle super admin : seul le super admin lit le journal et le tableau de bord ; tout le monde peut y écrire (limité).
-- À lancer dans Supabase › SQL Editor (comptes lea.test@example.com et sam.test@example.com). Tout est annulé à la fin.
-- Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare lea uuid; sam uuid; n int; i int;
begin
  select id into lea from auth.users where email = 'lea.test@example.com';
  select id into sam from auth.users where email = 'sam.test@example.com';
  update public.profils set role = 'super_admin' where id = lea; -- rôle donné ici, en dehors de l'appli

  -- Sam (étudiant) écrit dans le journal et marque son activité, mais ne lit rien
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.journaliser('erreur', 'test', 'Une erreur de test', '/annonces');
  perform public.marquer_activite();
  select count(*) into n from public.journal;
  insert into resultats (test, resultat) values ('Sam lit le journal (attendu 0)', n);
  begin
    perform public.tableau_de_bord();
    insert into resultats (test, resultat) values ('Sam ouvre le tableau de bord (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Sam ouvre le tableau de bord (attendu : refusé)', 'refusé');
  end;
  begin
    insert into public.journal (niveau, message) values ('erreur', 'écrit en direct');
    insert into resultats (test, resultat) values ('Sam écrit directement dans le journal (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Sam écrit directement dans le journal (attendu : refusé)', 'refusé');
  end;
  begin
    update public.profils set role = 'super_admin' where id = sam;
    insert into resultats (test, resultat) values ('Sam se donne le rôle super admin (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Sam se donne le rôle super admin (attendu : refusé)', 'refusé');
  end;
  -- 100 lignes par heure au plus
  for i in 1..110 loop perform public.journaliser('info', 'boucle', 'ligne ' || i); end loop;

  -- Léa (super admin) lit le journal et le tableau de bord
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.journal where personne = sam;
  insert into resultats (test, resultat) values ('Léa voit les lignes de Sam, 100 au plus (attendu 100)', n);
  select (public.tableau_de_bord() ->> 'erreurs_24h')::int into n;
  insert into resultats (test, resultat) values ('Erreurs sur 24 h au tableau de bord (attendu 1)', n);
  select (public.tableau_de_bord() ->> 'connectes')::int into n;
  insert into resultats (test, resultat) values ('Connectés maintenant (attendu 1, Sam)', n);
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
