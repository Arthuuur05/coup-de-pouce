-- Rôle « intervenant » : une personne extérieure à la promo (pro, ancien, formateur) qui propose ou cherche un coup de main.
-- Ajoute une colonne et une fonction ; ne change aucune règle d'accès existante.

alter table public.profils
  add column role text not null default 'etudiant' check (role in ('etudiant', 'intervenant'));

-- Le rôle est choisi à l'inscription (jamais modifiable ensuite par la personne : seules 4 colonnes sont modifiables).
create or replace function public.creer_profil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profils (id, prenom, nom, filiere, annee, campus, role)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'prenom', ''), 40),
    left(coalesce(new.raw_user_meta_data ->> 'nom', ''), 60),
    left(coalesce(new.raw_user_meta_data ->> 'filiere', ''), 60),
    case when new.raw_user_meta_data ->> 'annee' in ('L1', 'L2', 'L3', 'M1', 'M2')
      then new.raw_user_meta_data ->> 'annee' end,
    case when new.raw_user_meta_data ->> 'campus' in ('Bordeaux', 'Lille', 'Lyon', 'Nantes', 'Paris', 'Toulouse', 'Autre')
      then new.raw_user_meta_data ->> 'campus' else '' end,
    case when new.raw_user_meta_data ->> 'role' = 'intervenant' then 'intervenant' else 'etudiant' end
  );
  return new;
end;
$$;
revoke execute on function public.creer_profil() from public, anon, authenticated;

-- Le rôle de quelques personnes (affiché sur les cartes et les profils publics).
create function public.roles_profils(ids uuid[])
returns table (id uuid, role text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.role from public.profils p
  where p.id = any (ids) and (select auth.uid()) is not null;
$$;
revoke execute on function public.roles_profils(uuid[]) from public, anon;
grant execute on function public.roles_profils(uuid[]) to authenticated;
