-- Lot 10 : signalement et modération. Chacun peut signaler une annonce ou un profil ; seule l'admin voit la file et la traite.

create table public.signalements (
  id uuid primary key default gen_random_uuid(),
  auteur uuid not null default auth.uid() references public.profils (id) on delete cascade,
  annonce uuid references public.annonces (id) on delete cascade,
  profil uuid references public.profils (id) on delete cascade,
  motif text not null check (motif in ('spam', 'inapproprie', 'arnaque', 'harcelement', 'autre')),
  detail text not null default '' check (char_length(detail) <= 300),
  statut text not null default 'ouvert' check (statut in ('ouvert', 'traite', 'classe')),
  cree_le timestamptz not null default now(),
  traite_le timestamptz,
  check ((annonce is not null)::int + (profil is not null)::int = 1)
);
-- Un seul signalement par personne et par cible : pas de harcèlement par signalements répétés.
create unique index signalements_une_fois_annonce on public.signalements (auteur, annonce) where annonce is not null;
create unique index signalements_une_fois_profil on public.signalements (auteur, profil) where profil is not null;
create index signalements_statut on public.signalements (statut, cree_le desc);
alter table public.signalements enable row level security;

create policy "Voir ses signalements (ou tous si admin)" on public.signalements
  for select to authenticated
  using (auteur = (select auth.uid()) or (select public.est_admin()));
create policy "Signaler en son nom" on public.signalements
  for insert to authenticated with check (auteur = (select auth.uid()));
create policy "Traiter un signalement (admin)" on public.signalements
  for update to authenticated
  using ((select public.est_admin())) with check ((select public.est_admin()));

revoke all on public.signalements from anon, authenticated;
grant select on public.signalements to authenticated;
grant insert (annonce, profil, motif, detail) on public.signalements to authenticated;
grant update (statut) on public.signalements to authenticated;

create function public.verifier_signalement() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.profil = new.auteur
       or exists (select 1 from public.annonces where id = new.annonce and auteur = new.auteur) then
      raise exception 'signalement_de_soi';
    end if;
    if (select count(*) from public.signalements where auteur = new.auteur and cree_le > now() - interval '1 day') >= 10 then
      raise exception 'trop_de_signalements';
    end if;
    new.statut := 'ouvert';
    new.cree_le := now();
    new.traite_le := null;
    new.detail := btrim(new.detail);
  elsif new.statut is distinct from old.statut then
    new.traite_le := case when new.statut = 'ouvert' then null else now() end;
  end if;
  return new;
end;
$$;
create trigger verifier_signalement
  before insert or update on public.signalements
  for each row execute function public.verifier_signalement();

-- La file de l'admin : le signalement, la cible et les prénoms (jamais d'e-mail ni de nom de famille).
create function public.file_signalements()
returns table (
  id uuid, motif text, detail text, statut text, cree_le timestamptz, traite_le timestamptz,
  signaleur uuid, signaleur_prenom text,
  annonce uuid, annonce_titre text, annonce_statut text,
  profil uuid, cible uuid, cible_prenom text,
  autres_signalements bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (select public.est_admin()) then
    raise exception 'reserve_admin';
  end if;
  return query
  select s.id, s.motif, s.detail, s.statut, s.cree_le, s.traite_le,
         s.auteur, p_sig.prenom,
         s.annonce, a.titre, a.statut,
         s.profil, coalesce(s.profil, a.auteur), p_cib.prenom,
         (select count(*) from public.signalements o
           where o.id <> s.id and o.statut = 'ouvert'
             and ((s.annonce is not null and o.annonce = s.annonce) or (s.profil is not null and o.profil = s.profil)))
  from public.signalements s
  left join public.profils p_sig on p_sig.id = s.auteur
  left join public.annonces a on a.id = s.annonce
  left join public.profils p_cib on p_cib.id = coalesce(s.profil, a.auteur)
  order by (s.statut = 'ouvert') desc, s.cree_le desc
  limit 200;
end;
$$;
revoke execute on function public.file_signalements() from public, anon;
grant execute on function public.file_signalements() to authenticated;

-- Retirer l'annonce signalée (admin) : elle est supprimée, avec ses signalements.
create function public.retirer_annonce_signalee(signalement uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare cible uuid;
begin
  if not (select public.est_admin()) then
    raise exception 'reserve_admin';
  end if;
  select annonce into cible from public.signalements where id = signalement;
  if cible is null then
    raise exception 'pas_une_annonce';
  end if;
  delete from public.annonces where id = cible; -- ses signalements partent avec elle (on delete cascade)
end;
$$;
revoke execute on function public.retirer_annonce_signalee(uuid) from public, anon;
grant execute on function public.retirer_annonce_signalee(uuid) to authenticated;

-- Pastille de l'admin : nombre de signalements ouverts.
create function public.signalements_ouverts() returns integer
language sql stable security definer set search_path = '' as $$
  select case when (select public.est_admin()) then (select count(*)::int from public.signalements where statut = 'ouvert') else 0 end;
$$;
revoke execute on function public.signalements_ouverts() from public, anon;
grant execute on function public.signalements_ouverts() to authenticated;
