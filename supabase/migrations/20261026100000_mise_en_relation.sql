-- Lot 5 : la mise en relation. Règle d'or : mes coordonnées ne sont visibles qu'après mon accord.

-- 1. Demandes de contact : une par annonce et par personne, jamais sur sa propre annonce.
create table public.demandes (
  id uuid primary key default gen_random_uuid(),
  annonce uuid not null references public.annonces (id) on delete cascade,
  demandeur uuid not null default auth.uid() references public.profils (id) on delete cascade,
  auteur uuid not null references public.profils (id) on delete cascade,
  message text not null default '' check (char_length(message) <= 300),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'acceptee', 'refusee', 'retiree')),
  cree_le timestamptz not null default now(),
  repondu_le timestamptz,
  unique (annonce, demandeur)
);
create index demandes_auteur on public.demandes (auteur, statut);
create index demandes_demandeur on public.demandes (demandeur);
alter table public.demandes enable row level security;

create policy "Voir ses demandes, reçues ou envoyées" on public.demandes
  for select to authenticated
  using (demandeur = (select auth.uid()) or auteur = (select auth.uid()));
create policy "Demander en son nom" on public.demandes
  for insert to authenticated
  with check (demandeur = (select auth.uid()));
create policy "Répondre aux demandes reçues" on public.demandes
  for update to authenticated
  using (auteur = (select auth.uid()))
  with check (auteur = (select auth.uid()));
create policy "Annuler sa demande en attente" on public.demandes
  for delete to authenticated
  using (demandeur = (select auth.uid()) and statut = 'en_attente');

revoke all on public.demandes from anon, authenticated;
grant select, delete on public.demandes to authenticated;
grant insert (annonce, message) on public.demandes to authenticated;
grant update (statut) on public.demandes to authenticated;

-- Avant chaque écriture : l'auteur vient de l'annonce, et le statut ne suit que les chemins prévus.
create function public.verifier_demande() returns trigger
language plpgsql set search_path = '' as $$
declare a record;
begin
  if tg_op = 'INSERT' then
    select auteur, statut, expire_le into a from public.annonces where id = new.annonce;
    if not found or a.statut <> 'active' or a.expire_le <= now() then
      raise exception 'annonce_indisponible';
    end if;
    if a.auteur = new.demandeur then
      raise exception 'propre_annonce';
    end if;
    new.auteur := a.auteur;
    new.statut := 'en_attente';
    new.cree_le := now();
    new.repondu_le := null;
  elsif new.statut is distinct from old.statut then
    if not ((old.statut = 'en_attente' and new.statut in ('acceptee', 'refusee'))
         or (old.statut = 'acceptee' and new.statut = 'retiree')) then
      raise exception 'statut_impossible';
    end if;
    new.repondu_le := now();
  end if;
  return new;
end;
$$;

create trigger verifier_demande
  before insert or update on public.demandes
  for each row execute function public.verifier_demande();

-- Une annonce réglée : ses demandes en attente disparaissent (les accords déjà donnés restent).
create function public.nettoyer_demandes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.demandes where annonce = new.id and statut = 'en_attente';
  return new;
end;
$$;
revoke execute on function public.nettoyer_demandes() from public, anon, authenticated;

create trigger nettoyer_demandes
  after update of statut on public.annonces
  for each row when (new.statut = 'reglee' and old.statut is distinct from 'reglee')
  execute function public.nettoyer_demandes();

-- 2. Coordonnées : visibles par soi-même, et par l'autre personne d'une demande acceptée. Personne d'autre.
create table public.coordonnees (
  personne uuid primary key default auth.uid() references public.profils (id) on delete cascade,
  email text not null default '' check (char_length(email) <= 120),
  telephone text not null default '' check (char_length(telephone) <= 30),
  instagram text not null default '' check (char_length(instagram) <= 40),
  modifie_le timestamptz not null default now()
);
alter table public.coordonnees enable row level security;

create policy "Voir ses coordonnées et celles d'un contact accepté" on public.coordonnees
  for select to authenticated
  using (
    personne = (select auth.uid())
    or exists (
      select 1 from public.demandes d
      where d.statut = 'acceptee'
        and ((d.demandeur = (select auth.uid()) and d.auteur = coordonnees.personne)
          or (d.auteur = (select auth.uid()) and d.demandeur = coordonnees.personne))
    )
  );
create policy "Créer ses coordonnées" on public.coordonnees
  for insert to authenticated
  with check (personne = (select auth.uid()));
create policy "Modifier ses coordonnées" on public.coordonnees
  for update to authenticated
  using (personne = (select auth.uid()))
  with check (personne = (select auth.uid()));

revoke all on public.coordonnees from anon, authenticated;
grant select on public.coordonnees to authenticated;
grant insert (personne, email, telephone, instagram), update (email, telephone, instagram, modifie_le)
  on public.coordonnees to authenticated;

-- 3. Mes demandes, reçues et envoyées, avec le titre de l'annonce même si elle n'est plus en ligne.
create function public.mes_demandes()
returns table (
  id uuid, annonce uuid, titre text, type text, categorie text, annonce_en_ligne boolean,
  sens text, autre uuid, message text, statut text, cree_le timestamptz, repondu_le timestamptz
)
language sql stable security definer set search_path = '' as $$
  select d.id, d.annonce, a.titre, a.type, a.categorie, (a.statut = 'active' and a.expire_le > now()),
         case when d.auteur = (select auth.uid()) then 'recue' else 'envoyee' end,
         case when d.auteur = (select auth.uid()) then d.demandeur else d.auteur end,
         d.message, d.statut, d.cree_le, d.repondu_le
  from public.demandes d join public.annonces a on a.id = d.annonce
  where d.auteur = (select auth.uid()) or d.demandeur = (select auth.uid())
  order by d.cree_le desc;
$$;
revoke execute on function public.mes_demandes() from public, anon;
grant execute on function public.mes_demandes() to authenticated;
