-- Test de clôture du lot 4 : favoris, photos, « Pour toi » et recherche sans accents, depuis les comptes de Sam et Léa.
-- À lancer dans Supabase › SQL Editor. Tout est annulé à la fin (rollback), rien n'est modifié.
-- Chaque ligne affiche le résultat attendu entre parenthèses.

begin;
create temp table resultats (n serial, test text, resultat text);
grant all on resultats to authenticated, anon;
grant usage on sequence resultats_n_seq to authenticated, anon;
do $$
declare lea uuid; sam uuid; a_id uuid; n int; t text; i int;
begin
  select id into lea from auth.users where email = 'lea.test@example.com';
  select id into sam from auth.users where email = 'sam.test@example.com';

  -- Sam publie une annonce avec des accents
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.annonces (type, categorie, titre, description)
    values ('propose', 'Événementiel', 'Déco pour ton événement', 'Je prépare la déco de ta soirée étudiante.')
    returning id into a_id;
  select count(*) into n from public.annonces where id = a_id and texte_recherche like '%evenement%';
  insert into resultats (test, resultat) values ('« evenement » trouve « événement » (attendu 1)', n);
  select case when a.filiere = p.filiere then 'oui' else 'non' end into t
    from public.annonces a join public.profils p on p.id = a.auteur where a.id = a_id;
  insert into resultats (test, resultat) values ('La filière de l''annonce est celle de Sam (attendu : oui)', t);
  update public.annonces set expire_le = '2099-01-01' where id = a_id;
  select case when expire_le <= now() + interval '30 days' then 'oui' else 'non' end into t from public.annonces where id = a_id;
  insert into resultats (test, resultat) values ('Toujours 30 jours maximum (attendu : oui)', t);

  -- Léa met l'annonce de Sam en favori
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.annonces set titre = 'Piraté' where id = a_id;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Léa modifie l''annonce de Sam (attendu 0)', n);
  insert into public.favoris (annonce) values (a_id);
  select count(*) into n from public.mes_favoris() where disponible;
  insert into resultats (test, resultat) values ('Léa voit son favori, disponible (attendu 1)', n);
  begin
    insert into public.favoris (personne, annonce) values (sam, a_id);
    insert into resultats (test, resultat) values ('Léa ajoute un favori au nom de Sam (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Léa ajoute un favori au nom de Sam (attendu : refusé)', 'refusé');
  end;
  begin
    update public.profils set photo = sam::text || '/profil.webp' where id = lea;
    insert into resultats (test, resultat) values ('Léa prend la photo de Sam comme photo de profil (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when check_violation then
    insert into resultats (test, resultat) values ('Léa prend la photo de Sam comme photo de profil (attendu : refusé)', 'refusé');
  end;
  update public.profils set photo = lea::text || '/profil.webp' where id = lea;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Léa met sa propre photo de profil (attendu 1)', n);
  begin
    insert into storage.objects (bucket_id, name, owner_id) values ('photos', sam::text || '/pirate.webp', lea::text);
    insert into resultats (test, resultat) values ('Léa dépose une photo dans le dossier de Sam (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when others then
    insert into resultats (test, resultat) values ('Léa dépose une photo dans le dossier de Sam (attendu : refusé)', 'refusé');
  end;
  begin
    insert into storage.objects (bucket_id, name, owner_id) values ('photos', lea::text || '/essai.webp', lea::text);
    insert into resultats (test, resultat) values ('Léa dépose une photo dans son dossier (attendu : accepté)', 'accepté');
  exception when others then
    insert into resultats (test, resultat) values ('Léa dépose une photo dans son dossier (attendu : accepté)', 'REFUSÉ (problème) ' || sqlerrm);
  end;

  -- Sam ne sait pas qui a mis son annonce en favori ; il voit la photo de Léa
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', sam, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.favoris where annonce = a_id;
  insert into resultats (test, resultat) values ('Sam voit les favoris posés sur son annonce (attendu 0)', n);
  select count(*) into n from public.photos_profils(array[lea]);
  insert into resultats (test, resultat) values ('Sam voit la photo de profil de Léa (attendu 1)', n);
  select count(*) into n from storage.objects where bucket_id = 'photos' and name like lea::text || '/%';
  insert into resultats (test, resultat) values ('Sam voit le fichier photo de Léa (attendu 1)', n);
  update public.annonces set statut = 'reglee' where id = a_id;
  delete from public.annonces where auteur = sam and id <> a_id;
  for i in 1..5 loop
    insert into public.annonces (type, categorie, titre, description)
      values ('cherche', 'Autre', 'Annonce ' || i, 'Annonce de test numéro ' || i || '.');
  end loop;
  begin
    update public.annonces set statut = 'active' where id = a_id;
    insert into resultats (test, resultat) values ('Sam remet en ligne une 6e annonce (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when raise_exception then
    insert into resultats (test, resultat) values ('Sam remet en ligne une 6e annonce (attendu : refusé)', 'refusé');
  end;

  -- L'annonce réglée reste dans les favoris de Léa, grisée
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', lea, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.mes_favoris() where not disponible;
  insert into resultats (test, resultat) values ('Le favori réglé reste, marqué indisponible (attendu 1)', n);
  delete from public.favoris where annonce = a_id;
  get diagnostics n = row_count;
  insert into resultats (test, resultat) values ('Léa retire son favori (attendu 1)', n);

  -- Visiteur non connecté
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  begin
    perform public.mes_favoris();
    insert into resultats (test, resultat) values ('Un visiteur lit des favoris (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Un visiteur lit des favoris (attendu : refusé)', 'refusé');
  end;
  begin
    perform public.photos_profils(array[lea]);
    insert into resultats (test, resultat) values ('Un visiteur voit les photos de profil (attendu : refusé)', 'ACCEPTÉ (problème)');
  exception when insufficient_privilege then
    insert into resultats (test, resultat) values ('Un visiteur voit les photos de profil (attendu : refusé)', 'refusé');
  end;
  select count(*) into n from storage.objects where bucket_id = 'photos';
  insert into resultats (test, resultat) values ('Un visiteur voit les fichiers photo (attendu 0)', n);
  reset role;
end $$;
select test, resultat from resultats order by n;
rollback;
