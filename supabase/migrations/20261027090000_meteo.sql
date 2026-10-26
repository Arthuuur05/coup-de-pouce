-- Lot 7 : la météo du campus. Un bulletin par semaine, relu et publié par l'administratrice.

-- Qui est admin ? (fonction à part : un profil n'est lisible que par son propriétaire)
create function public.est_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select est_admin from public.profils where id = (select auth.uid())), false);
$$;
revoke execute on function public.est_admin() from public, anon;
grant execute on function public.est_admin() to authenticated;

create table public.bulletins (
  id uuid primary key default gen_random_uuid(),
  semaine date not null unique, -- le lundi de la semaine
  titre text not null default '' check (char_length(titre) <= 80),
  texte text not null default '' check (char_length(texte) <= 600),
  besoins jsonb not null default '[]'::jsonb, -- [{ "categorie": "Photo", "nombre": 4 }, …] (3 au plus)
  statut text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  publie_le timestamptz
);
alter table public.bulletins enable row level security;

create policy "Lire les bulletins publiés (ou tous si admin)" on public.bulletins
  for select to authenticated
  using (statut = 'publie' or (select public.est_admin()));
create policy "Créer un bulletin (admin)" on public.bulletins
  for insert to authenticated with check ((select public.est_admin()));
create policy "Modifier un bulletin (admin)" on public.bulletins
  for update to authenticated
  using ((select public.est_admin())) with check ((select public.est_admin()));

revoke all on public.bulletins from anon, authenticated;
grant select on public.bulletins to authenticated;
grant insert (semaine, titre, texte, besoins, statut) on public.bulletins to authenticated;
grant update (titre, texte, besoins, statut) on public.bulletins to authenticated;

create function public.verifier_bulletin() returns trigger
language plpgsql set search_path = '' as $$
begin
  if jsonb_typeof(new.besoins) <> 'array' or jsonb_array_length(new.besoins) > 3 then
    raise exception 'besoins_invalides';
  end if;
  if tg_op = 'INSERT' then
    new.cree_le := now();
    new.publie_le := case when new.statut = 'publie' then now() end;
  else
    if new.statut = 'publie' and old.statut <> 'publie' then new.publie_le := now(); end if;
    if new.statut = 'brouillon' then new.publie_le := null; end if;
  end if;
  new.modifie_le := now();
  return new;
end;
$$;
create trigger verifier_bulletin
  before insert or update on public.bulletins
  for each row execute function public.verifier_bulletin();

-- Les 3 catégories les plus cherchées ces 7 derniers jours (réservé à l'admin).
create function public.besoins_semaine()
returns table (categorie text, nombre bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (select public.est_admin()) then
    raise exception 'reserve_admin';
  end if;
  return query
    select a.categorie, count(*)
    from public.annonces a
    where a.type = 'cherche' and a.cree_le > now() - interval '7 days'
    group by a.categorie
    order by count(*) desc, a.categorie
    limit 3;
end;
$$;
revoke execute on function public.besoins_semaine() from public, anon;
grant execute on function public.besoins_semaine() to authenticated;
