-- Lot 17 : badges et niveaux. Les badges se calculent à partir de chiffres (jamais de données personnelles) ;
-- la base garde seulement quels badges la personne a déjà « fêtés », pour ne célébrer chaque palier qu'une fois.

-- Coups de pouce rendus : redéfini ici (identique au lot 12) pour que ce lot ne dépende pas de l'ordre d'exécution.
create or replace function public.coups_de_pouce(personne uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::int
  from public.demandes d
  join public.annonces a on a.id = d.annonce
  where d.statut in ('acceptee', 'retiree')
    and ((a.type = 'propose' and d.auteur = personne) or (a.type = 'cherche' and d.demandeur = personne));
$$;
revoke execute on function public.coups_de_pouce(uuid) from public, anon;
grant execute on function public.coups_de_pouce(uuid) to authenticated;

-- Les chiffres derrière les badges d'une personne : des nombres seulement.
create function public.stats_badges(personne uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when (select auth.uid()) is null then null else jsonb_build_object(
    'coups', (select public.coups_de_pouce(personne)),
    'annonces', (select count(*) from public.annonces where auteur = personne),
    'avis', (select count(*) from public.avis where cible = personne),
    'note', (select round(avg(note)::numeric, 1) from public.avis where cible = personne),
    'competences', (select count(*) from public.competences where competences.personne = stats_badges.personne),
    'profil_complet', coalesce((
      select p.photo <> '' and p.filiere <> '' and p.campus <> ''
             and exists (select 1 from public.competences c where c.personne = p.id)
      from public.profils p where p.id = personne), false)
  ) end;
$$;
revoke execute on function public.stats_badges(uuid) from public, anon;
grant execute on function public.stats_badges(uuid) to authenticated;

-- Les badges que j'ai déjà fêtés (animation vue).
create table public.badges_vus (
  personne uuid not null default auth.uid() references public.profils (id) on delete cascade,
  badge text not null check (char_length(badge) between 2 and 40),
  vu_le timestamptz not null default now(),
  primary key (personne, badge)
);
alter table public.badges_vus enable row level security;

create policy "Voir mes badges fêtés" on public.badges_vus
  for select to authenticated using (personne = (select auth.uid()));
create policy "Fêter mes badges" on public.badges_vus
  for insert to authenticated with check (personne = (select auth.uid()));

revoke all on public.badges_vus from anon, authenticated;
grant select on public.badges_vus to authenticated;
grant insert (badge) on public.badges_vus to authenticated;
