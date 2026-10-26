-- Lot 13 : alertes. « Prévenez-moi quand une annonce correspond » : une recherche enregistrée (type, catégorie, campus, mot)
-- qui envoie une notification quand une nouvelle annonce y correspond.

create table public.alertes (
  id uuid primary key default gen_random_uuid(),
  personne uuid not null default auth.uid() references public.profils (id) on delete cascade,
  type text check (type in ('propose', 'cherche')),
  categorie text check (categorie in (
    'Photo', 'Vidéo', 'Développement', 'Design', 'Réseaux sociaux', 'Cours et soutien',
    'Logement', 'Covoiturage', 'Événementiel', 'Autre')),
  campus text check (char_length(campus) <= 60),
  mot text check (char_length(mot) <= 40),
  cree_le timestamptz not null default now(),
  -- une alerte doit avoir au moins un critère
  check (type is not null or categorie is not null or campus is not null or mot is not null)
);
create index alertes_personne on public.alertes (personne);
-- pas deux fois la même alerte
create unique index alertes_unique on public.alertes
  (personne, coalesce(type, ''), coalesce(categorie, ''), coalesce(campus, ''), coalesce(mot, ''));
alter table public.alertes enable row level security;

create policy "Voir ses alertes" on public.alertes
  for select to authenticated using (personne = (select auth.uid()));
create policy "Créer ses alertes" on public.alertes
  for insert to authenticated with check (personne = (select auth.uid()));
create policy "Supprimer ses alertes" on public.alertes
  for delete to authenticated using (personne = (select auth.uid()));

revoke all on public.alertes from anon, authenticated;
grant select, delete on public.alertes to authenticated;
grant insert (type, categorie, campus, mot) on public.alertes to authenticated;

-- 5 alertes au plus par personne ; le mot est rangé sans accents, comme la recherche des annonces.
create function public.verifier_alerte() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.alertes where personne = new.personne) >= 5 then
    raise exception 'trop_d_alertes';
  end if;
  new.mot := nullif(btrim(public.sans_accents(coalesce(new.mot, ''))), '');
  new.campus := nullif(btrim(coalesce(new.campus, '')), '');
  if new.type is null and new.categorie is null and new.campus is null and new.mot is null then
    raise exception 'alerte_vide';
  end if;
  new.cree_le := now();
  return new;
end;
$$;
create trigger verifier_alerte
  before insert on public.alertes
  for each row execute function public.verifier_alerte();

-- Les notifications peuvent maintenant pointer vers une annonce (type « alerte »), une seule par personne et par annonce.
alter table public.notifications add column annonce uuid references public.annonces (id) on delete cascade;
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('demande_recue', 'acceptee', 'sans_suite', 'avis_recu', 'message_recu', 'alerte'));
create unique index notifications_alerte_une_fois on public.notifications (personne, annonce) where type = 'alerte';

-- À chaque nouvelle annonce en ligne : prévenir les personnes dont une alerte correspond (jamais l'auteur).
create function public.notifier_alertes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.statut <> 'active' then
    return null;
  end if;
  insert into public.notifications (personne, type, acteur, annonce, titre)
  select distinct on (al.personne) al.personne, 'alerte', new.auteur, new.id, new.titre
  from public.alertes al
  where al.personne <> new.auteur
    and (al.type is null or al.type = new.type)
    and (al.categorie is null or al.categorie = new.categorie)
    and (al.campus is null or al.campus = new.campus)
    and (al.mot is null or position(al.mot in new.texte_recherche) > 0)
  on conflict do nothing;
  return null;
end;
$$;
revoke execute on function public.notifier_alertes() from public, anon, authenticated;
create trigger notifier_alertes
  after insert on public.annonces
  for each row execute function public.notifier_alertes();
