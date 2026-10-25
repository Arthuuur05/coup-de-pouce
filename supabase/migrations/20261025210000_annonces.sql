-- Lot 4 : les annonces.
-- Tout le monde connecté lit les annonces en ligne ; seul l'auteur crée, modifie, supprime les siennes.

create table public.annonces (
  id uuid primary key default gen_random_uuid(),
  auteur uuid not null default auth.uid() references public.profils (id) on delete cascade,
  type text not null check (type in ('propose', 'cherche')),
  categorie text not null check (categorie in (
    'Photo', 'Vidéo', 'Développement', 'Design', 'Réseaux sociaux', 'Cours et soutien',
    'Logement', 'Covoiturage', 'Événementiel', 'Autre')),
  titre text not null check (char_length(titre) between 3 and 60),
  description text not null check (char_length(description) between 10 and 500),
  contrepartie text not null default '' check (char_length(contrepartie) <= 60),
  quand text not null default '' check (char_length(quand) <= 60),
  campus text not null default '',
  statut text not null default 'active' check (statut in ('active', 'reglee')),
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  expire_le timestamptz not null default now() + interval '30 days'
);

create index annonces_fil on public.annonces (statut, expire_le, cree_le desc);
create index annonces_auteur on public.annonces (auteur);

alter table public.annonces enable row level security;

-- Lire : les annonces en ligne, plus toutes les siennes (réglées ou expirées comprises).
create policy "Lire les annonces en ligne et les siennes" on public.annonces
  for select to authenticated
  using ((statut = 'active' and expire_le > now()) or auteur = (select auth.uid()));

create policy "Publier en son nom" on public.annonces
  for insert to authenticated
  with check (auteur = (select auth.uid()));

create policy "Modifier ses annonces" on public.annonces
  for update to authenticated
  using (auteur = (select auth.uid()))
  with check (auteur = (select auth.uid()));

create policy "Supprimer ses annonces" on public.annonces
  for delete to authenticated
  using (auteur = (select auth.uid()));

-- Les visiteurs non connectés n'ont aucun accès ; les connectés ne remplissent que certains champs.
revoke all on public.annonces from anon, authenticated;
grant select, delete on public.annonces to authenticated;
grant insert (auteur, type, categorie, titre, description, contrepartie, quand) on public.annonces to authenticated;
grant update (type, categorie, titre, description, contrepartie, quand, statut, expire_le) on public.annonces to authenticated;

-- Avant chaque écriture : campus copié du profil, durée bornée à 30 jours, 5 annonces en ligne maximum.
create function public.verifier_annonce() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.campus := coalesce((select campus from public.profils where id = new.auteur), '');
    new.cree_le := now();
    new.expire_le := now() + interval '30 days';
  else
    new.modifie_le := now();
    new.expire_le := least(new.expire_le, now() + interval '30 days');
  end if;

  if new.statut = 'active' and new.expire_le > now()
     and (tg_op = 'INSERT' or old.statut <> 'active' or old.expire_le <= now())
     and (select count(*) from public.annonces
          where auteur = new.auteur and id <> new.id and statut = 'active' and expire_le > now()) >= 5 then
    raise exception 'limite_annonces' using hint = 'Cinq annonces en ligne au maximum.';
  end if;
  return new;
end;
$$;

create trigger verifier_annonce
  before insert or update on public.annonces
  for each row execute function public.verifier_annonce();

-- Ce que les autres voient d'un étudiant : prénom, filière, année, campus. Jamais le nom ni l'e-mail.
create function public.profils_publics(ids uuid[])
returns table (id uuid, prenom text, filiere text, annee text, campus text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.prenom, p.filiere, p.annee, p.campus
  from public.profils p
  where p.id = any (ids) and (select auth.uid()) is not null;
$$;

revoke execute on function public.profils_publics(uuid[]) from public, anon;
grant execute on function public.profils_publics(uuid[]) to authenticated;
