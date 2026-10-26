-- Lot 18 : classement amical du campus. Les étudiants les plus serviables du mois : des coups de pouce rendus, comptés par mois.
-- Chacun peut choisir de ne pas y apparaître (par défaut oui). On ne montre que le prénom, le campus et un nombre.

alter table public.profils add column classement boolean not null default true;
grant update (classement) on public.profils to authenticated;

-- decalage : 0 = ce mois-ci, 1 = le mois dernier (heure de Paris). campus : seulement ce campus, ou null pour tous.
-- Un coup de pouce du mois = un accord donné ce mois-ci où la personne aidait (l'auteur d'une annonce « Je propose »,
-- ou celui qui répond à une annonce « Je cherche »). Les accords retirés ensuite ne comptent plus.
create function public.classement_mensuel(decalage integer default 0, filtre_campus text default null)
returns table (personne uuid, prenom text, campus text, coups integer, rang integer, moi boolean)
language sql stable security definer set search_path = '' as $$
  with mois as (
    select date_trunc('month', now() at time zone 'Europe/Paris') - make_interval(months => least(greatest(decalage, 0), 1)) as debut
  ),
  aides as (
    select case when a.type = 'propose' then d.auteur else d.demandeur end as aidant
    from public.demandes d
    join public.annonces a on a.id = d.annonce, mois
    where d.statut = 'acceptee'
      and (d.repondu_le at time zone 'Europe/Paris') >= mois.debut
      and (d.repondu_le at time zone 'Europe/Paris') < mois.debut + interval '1 month'
  ),
  total as (
    select aidant, count(*)::int as coups from aides group by aidant
  )
  select p.id, p.prenom, p.campus, t.coups,
         (rank() over (order by t.coups desc))::int,
         p.id = (select auth.uid())
  from total t
  join public.profils p on p.id = t.aidant
  where (select auth.uid()) is not null
    and p.classement
    and (filtre_campus is null or p.campus = filtre_campus)
  order by t.coups desc, p.prenom
  limit 50;
$$;
revoke execute on function public.classement_mensuel(integer, text) from public, anon;
grant execute on function public.classement_mensuel(integer, text) to authenticated;
