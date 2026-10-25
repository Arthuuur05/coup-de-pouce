-- Clôture du lot 3 : campus dans une liste fixe, et suppression de son propre compte.

-- Campus : une des villes de l'école, « Autre », ou vide (anciens comptes).
update public.profils set campus = '' where campus not in ('Bordeaux', 'Lille', 'Lyon', 'Nantes', 'Paris', 'Toulouse', 'Autre');
alter table public.profils drop constraint profils_campus_check;
alter table public.profils add constraint profils_campus_check
  check (campus in ('', 'Bordeaux', 'Lille', 'Lyon', 'Nantes', 'Paris', 'Toulouse', 'Autre'));

create or replace function public.creer_profil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profils (id, prenom, nom, filiere, annee, campus)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'prenom', ''), 40),
    left(coalesce(new.raw_user_meta_data ->> 'nom', ''), 60),
    left(coalesce(new.raw_user_meta_data ->> 'filiere', ''), 60),
    case when new.raw_user_meta_data ->> 'annee' in ('L1', 'L2', 'L3', 'M1', 'M2')
      then new.raw_user_meta_data ->> 'annee' end,
    case when new.raw_user_meta_data ->> 'campus' in ('Bordeaux', 'Lille', 'Lyon', 'Nantes', 'Paris', 'Toulouse', 'Autre')
      then new.raw_user_meta_data ->> 'campus' else '' end
  );
  return new;
end;
$$;

revoke execute on function public.creer_profil() from public, anon, authenticated;

-- Supprimer son compte : ne peut effacer que le compte de la personne connectée.
-- Le profil part avec (on delete cascade) ; plus tard, ses annonces et demandes aussi.
create function public.supprimer_mon_compte()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Non connecté';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;
