-- Lot 12 : profil public enrichi. Le nombre de « coups de pouce rendus » : demandes acceptées où la personne était celle qui aidait
-- (l'auteur d'une annonce « Je propose », ou celui qui répond à une annonce « Je cherche »). Un nombre seulement, jamais les demandes.
create function public.coups_de_pouce(personne uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::int
  from public.demandes d
  join public.annonces a on a.id = d.annonce
  where d.statut in ('acceptee', 'retiree')
    and ((a.type = 'propose' and d.auteur = personne) or (a.type = 'cherche' and d.demandeur = personne));
$$;
revoke execute on function public.coups_de_pouce(uuid) from public, anon;
grant execute on function public.coups_de_pouce(uuid) to authenticated;
