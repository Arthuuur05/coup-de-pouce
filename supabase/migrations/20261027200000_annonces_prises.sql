-- Badge « Prise » visible par tous : dit seulement si une demande a été acceptée sur l'annonce.
-- Rien sur la personne ni sur les demandes (pas de nombre, pas d'identité), uniquement l'état.
create function public.annonces_prises(ids uuid[])
returns setof uuid
language sql stable security definer set search_path = '' as $$
  select distinct d.annonce
  from public.demandes d
  where d.annonce = any (ids)
    and d.statut = 'acceptee'
    and (select auth.uid()) is not null;
$$;
revoke execute on function public.annonces_prises(uuid[]) from public, anon;
grant execute on function public.annonces_prises(uuid[]) to authenticated;
