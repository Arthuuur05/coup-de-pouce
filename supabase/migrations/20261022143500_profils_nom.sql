-- Lot 3 · Le nom de famille est demandé à l'inscription, mais n'est jamais affiché aux autres.
-- Seule la personne elle-même le voit (règle « Lire son profil »). Quand les autres pourront voir
-- les profils (lot 4), ils passeront par une vue qui ne contient pas cette colonne.

alter table public.profils
  add column nom text not null default '' check (char_length(nom) <= 60);

grant update (nom) on public.profils to authenticated;

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
    left(coalesce(new.raw_user_meta_data ->> 'campus', ''), 60)
  );
  return new;
end;
$$;

revoke execute on function public.creer_profil() from public, anon, authenticated;
