-- Clôture du lot 4 : photos, favoris, « Pour toi » côté base, recherche sans accents, profil public.
-- Ne supprime aucune donnée et ne change pas les règles existantes : ajoute des colonnes, une table et des règles.

-- 1. Photos : un dossier par personne dans un espace « photos » privé (lisible seulement par les connectés).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Photos visibles par les connectés" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos');

create policy "Ajouter ses photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Remplacer ses photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Supprimer ses photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Le chemin d'une photo commence toujours par l'id de son propriétaire.
alter table public.profils add column photo text not null default ''
  check (photo = '' or photo like id::text || '/%');
grant update (photo) on public.profils to authenticated;

alter table public.annonces add column photo text not null default ''
  check (photo = '' or photo like auteur::text || '/%');
grant insert (photo), update (photo) on public.annonces to authenticated;

-- 2. « Pour toi » et recherche : la filière de l'auteur et un texte sans accents, rangés avec l'annonce.
alter table public.annonces add column filiere text not null default '';
alter table public.annonces add column texte_recherche text not null default '';

create function public.sans_accents(texte text) returns text
language sql immutable set search_path = '' as $$
  select translate(lower(texte), 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy');
$$;

create or replace function public.verifier_annonce() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    select coalesce(p.campus, ''), coalesce(p.filiere, '') into new.campus, new.filiere
      from public.profils p where p.id = new.auteur;
    new.campus := coalesce(new.campus, '');
    new.filiere := coalesce(new.filiere, '');
    new.cree_le := now();
    new.expire_le := now() + interval '30 days';
  else
    new.modifie_le := now();
    new.expire_le := least(new.expire_le, now() + interval '30 days');
  end if;
  new.texte_recherche := public.sans_accents(new.titre || ' ' || new.description);

  if new.statut = 'active' and new.expire_le > now()
     and (tg_op = 'INSERT' or old.statut <> 'active' or old.expire_le <= now())
     and (select count(*) from public.annonces
          where auteur = new.auteur and id <> new.id and statut = 'active' and expire_le > now()) >= 5 then
    raise exception 'limite_annonces' using hint = 'Cinq annonces en ligne au maximum.';
  end if;
  return new;
end;
$$;

-- Les annonces déjà publiées reçoivent leur filière et leur texte de recherche.
update public.annonces a
  set filiere = coalesce(p.filiere, ''), texte_recherche = public.sans_accents(a.titre || ' ' || a.description)
  from public.profils p where p.id = a.auteur;

-- 3. Favoris : chacun ne voit et ne gère que les siens. Personne ne sait qui a mis quoi en favori.
create table public.favoris (
  personne uuid not null default auth.uid() references public.profils (id) on delete cascade,
  annonce uuid not null references public.annonces (id) on delete cascade,
  ajoute_le timestamptz not null default now(),
  primary key (personne, annonce)
);
create index favoris_annonce on public.favoris (annonce);
alter table public.favoris enable row level security;

create policy "Voir ses favoris" on public.favoris
  for select to authenticated using (personne = (select auth.uid()));
create policy "Ajouter un favori" on public.favoris
  for insert to authenticated with check (personne = (select auth.uid()));
create policy "Retirer un favori" on public.favoris
  for delete to authenticated using (personne = (select auth.uid()));

revoke all on public.favoris from anon, authenticated;
grant select, insert, delete on public.favoris to authenticated;

-- Mes favoris, y compris ceux qui ne sont plus en ligne (affichés grisés).
create function public.mes_favoris()
returns table (id uuid, type text, categorie text, titre text, disponible boolean, ajoute_le timestamptz)
language sql stable security definer set search_path = '' as $$
  select a.id, a.type, a.categorie, a.titre, (a.statut = 'active' and a.expire_le > now()), f.ajoute_le
  from public.favoris f join public.annonces a on a.id = f.annonce
  where f.personne = (select auth.uid())
  order by f.ajoute_le desc;
$$;
revoke execute on function public.mes_favoris() from public, anon;
grant execute on function public.mes_favoris() to authenticated;

-- 4. Profil public : la photo, à côté du prénom, de la filière, de l'année et du campus. Jamais le nom ni l'e-mail.
create function public.photos_profils(ids uuid[])
returns table (id uuid, photo text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.photo
  from public.profils p
  where p.id = any (ids) and p.photo <> '' and (select auth.uid()) is not null;
$$;
revoke execute on function public.photos_profils(uuid[]) from public, anon;
grant execute on function public.photos_profils(uuid[]) to authenticated;
