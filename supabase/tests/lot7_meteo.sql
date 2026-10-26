-- Test du lot 7 : seule l'admin crée et relit les bulletins ; les autres ne voient que les bulletins publiés.
-- À lancer dans Supabase › SQL Editor (comptes lea.test@example.com et sam.test@example.com). Tout est annulé à la fin.
-- Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare lea uuid; sam uuid; n int; b uuid;
begin
  select id into lea from auth.users where email = 'lea.test@example.com';
  select id into sam from auth.users where email = 'sam.test@example.com';
  update public.profils set est_admin = true where id = lea; -- rôle donné ici, en dehors de l'appli

  -- Sam publie 2 « Je cherche » Photo et 1 Dev (pour le top)
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description) values
    ('cherche', 'Photo', 'Photographe pour un gala', 'Je cherche quelqu''un pour mon gala.'),
    ('cherche', 'Photo', 'Photos de classe', 'Une photo de classe svp, merci.'),
    ('cherche', 'Développement', 'Aide en Python', 'Bloqué sur un exercice de Python.');
  begin
    insert into public.bulletins (semaine, titre) values (current_date, 'Pirate');
    insert into resultats (test, resultat) values ('Sam (non admin) crée un bulletin (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Sam (non admin) crée un bulletin (attendu : refusé)', 'refusé');
  end;
  begin
    perform * from public.besoins_semaine();
    insert into resultats (test, resultat) values ('Sam calcule les besoins (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Sam calcule les besoins (attendu : refusé)', 'refusé');
  end;

  -- Léa (admin) calcule le top et crée un brouillon
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.besoins_semaine();
  insert into resultats (test, resultat) values ('Léa voit au moins 2 besoins (attendu 2 ou plus)', n);
  select categorie into strict b from (select categorie from public.besoins_semaine() limit 1) t; -- vérifie qu'il y en a un
  insert into public.bulletins (semaine, titre, texte, besoins)
    values (current_date, 'Le campus cherche : Photo', 'Texte', '[{"categorie":"Photo","nombre":2}]') returning id into b;
  begin
    insert into public.bulletins (semaine, besoins) values (current_date + 7, '[1,2,3,4]');
    insert into resultats (test, resultat) values ('Plus de 3 besoins (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Plus de 3 besoins (attendu : refusé)', 'refusé');
  end;

  -- Brouillon : Sam ne le voit pas
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.bulletins;
  insert into resultats (test, resultat) values ('Sam voit le brouillon (attendu 0)', n);

  -- Léa publie, Sam le voit, Sam ne peut pas le modifier
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.bulletins set statut = 'publie' where id = b;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.bulletins where publie_le is not null;
  insert into resultats (test, resultat) values ('Sam voit le bulletin publié (attendu 1)', n);
  update public.bulletins set titre = 'Piraté' where id = b;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Sam modifie le bulletin (attendu 0)', n);
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
