-- Lot 3 · Comptes : un profil par compte, créé automatiquement à l'inscription.

create table public.profils (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text not null default '' check (char_length(prenom) <= 40),
  filiere text not null default '' check (char_length(filiere) <= 60),
  annee text check (annee in ('L1', 'L2', 'L3', 'M1', 'M2')),
  campus text not null default '' check (char_length(campus) <= 60),
  est_admin boolean not null default false,
  cree_le timestamptz not null default now()
);

-- Règle : chacun ne lit et ne modifie que son propre profil.
alter table public.profils enable row level security;

create policy "Lire son profil" on public.profils
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "Modifier son profil" on public.profils
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Personne ne peut se donner le rôle admin : seules ces 4 colonnes sont modifiables.
revoke insert, update, delete on public.profils from anon, authenticated;
grant update (prenom, filiere, annee, campus) on public.profils to authenticated;

-- Création du profil à l'inscription, avec les infos du formulaire.
create function public.creer_profil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profils (id, prenom, filiere, annee, campus)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'prenom', ''), 40),
    left(coalesce(new.raw_user_meta_data ->> 'filiere', ''), 60),
    case when new.raw_user_meta_data ->> 'annee' in ('L1', 'L2', 'L3', 'M1', 'M2')
      then new.raw_user_meta_data ->> 'annee' end,
    left(coalesce(new.raw_user_meta_data ->> 'campus', ''), 60)
  );
  return new;
end;
$$;

revoke execute on function public.creer_profil() from public, anon, authenticated;

create trigger creer_profil_a_l_inscription
  after insert on auth.users
  for each row execute function public.creer_profil();
