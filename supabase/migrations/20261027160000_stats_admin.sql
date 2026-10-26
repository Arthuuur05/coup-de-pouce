-- Lot 14 : statistiques pour l'admin. Des nombres seulement, jamais de données personnelles.
create function public.stats_admin() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  if not (select public.est_admin()) then
    raise exception 'reserve_admin';
  end if;
  select jsonb_build_object(
    'etudiants', (select count(*) from public.profils),
    'etudiants_7j', (select count(*) from public.profils where cree_le > now() - interval '7 days'),
    'annonces_en_ligne', (select count(*) from public.annonces where statut = 'active' and expire_le > now()),
    'annonces_total', (select count(*) from public.annonces),
    'annonces_7j', (select count(*) from public.annonces where cree_le > now() - interval '7 days'),
    'par_categorie', coalesce((
      select jsonb_agg(jsonb_build_object('nom', categorie, 'nombre', n) order by n desc, categorie)
      from (select categorie, count(*) n from public.annonces where statut = 'active' and expire_le > now() group by categorie) c
    ), '[]'::jsonb),
    'par_campus', coalesce((
      select jsonb_agg(jsonb_build_object('nom', nom, 'nombre', n) order by n desc, nom)
      from (select coalesce(nullif(campus, ''), 'Non précisé') nom, count(*) n
            from public.annonces where statut = 'active' and expire_le > now() group by 1) c
    ), '[]'::jsonb),
    'par_type', jsonb_build_object(
      'propose', (select count(*) from public.annonces where statut = 'active' and expire_le > now() and type = 'propose'),
      'cherche', (select count(*) from public.annonces where statut = 'active' and expire_le > now() and type = 'cherche')
    ),
    'demandes', jsonb_build_object(
      'total', (select count(*) from public.demandes),
      'en_attente', (select count(*) from public.demandes where statut = 'en_attente'),
      'acceptees', (select count(*) from public.demandes where statut in ('acceptee', 'retiree')),
      'refusees', (select count(*) from public.demandes where statut = 'refusee'),
      'delai_moyen_heures', (select round((avg(extract(epoch from (repondu_le - cree_le))) / 3600)::numeric, 1)
                             from public.demandes where repondu_le is not null)
    ),
    'avis', jsonb_build_object(
      'total', (select count(*) from public.avis),
      'moyenne', (select round(avg(note)::numeric, 1) from public.avis)
    ),
    'messages', (select count(*) from public.messages),
    'signalements_ouverts', (select count(*) from public.signalements where statut = 'ouvert')
  ) into r;
  return r;
end;
$$;
revoke execute on function public.stats_admin() from public, anon;
grant execute on function public.stats_admin() to authenticated;
