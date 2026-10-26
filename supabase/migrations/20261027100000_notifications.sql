-- Lot 8 : notifications des demandes (demande reçue, réponse, avis reçu).
-- Une notification ne contient jamais de coordonnées : seulement le type, la personne concernée et le titre de l'annonce.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  personne uuid not null references public.profils (id) on delete cascade,
  type text not null check (type in ('demande_recue', 'acceptee', 'sans_suite', 'avis_recu')),
  acteur uuid not null references public.profils (id) on delete cascade,
  demande uuid references public.demandes (id) on delete cascade,
  titre text not null default '',
  cree_le timestamptz not null default now(),
  lue_le timestamptz
);
create index notifications_personne on public.notifications (personne, cree_le desc);
alter table public.notifications enable row level security;

create policy "Voir ses notifications" on public.notifications
  for select to authenticated using (personne = (select auth.uid()));
create policy "Marquer ses notifications comme lues" on public.notifications
  for update to authenticated
  using (personne = (select auth.uid()))
  with check (personne = (select auth.uid()));
create policy "Effacer ses notifications" on public.notifications
  for delete to authenticated using (personne = (select auth.uid()));

-- Personne ne crée de notification à la main : seuls les déclencheurs ci-dessous le font.
revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (lue_le) on public.notifications to authenticated;

create function public.notifier_demande() returns trigger
language plpgsql security definer set search_path = '' as $$
declare t text;
begin
  select titre into t from public.annonces where id = new.annonce;
  if tg_op = 'INSERT' then
    insert into public.notifications (personne, type, acteur, demande, titre)
    values (new.auteur, 'demande_recue', new.demandeur, new.id, coalesce(t, ''));
  elsif old.statut = 'en_attente' and new.statut in ('acceptee', 'refusee') then
    insert into public.notifications (personne, type, acteur, demande, titre)
    values (new.demandeur, case new.statut when 'acceptee' then 'acceptee' else 'sans_suite' end,
            new.auteur, new.id, coalesce(t, ''));
  end if;
  return null;
end;
$$;
revoke execute on function public.notifier_demande() from public, anon, authenticated;

create trigger notifier_demande_insert
  after insert on public.demandes
  for each row execute function public.notifier_demande();
create trigger notifier_demande_reponse
  after update of statut on public.demandes
  for each row when (new.statut is distinct from old.statut)
  execute function public.notifier_demande();

create function public.notifier_avis() returns trigger
language plpgsql security definer set search_path = '' as $$
declare t text;
begin
  select a.titre into t from public.demandes d join public.annonces a on a.id = d.annonce where d.id = new.demande;
  insert into public.notifications (personne, type, acteur, demande, titre)
  values (new.cible, 'avis_recu', new.auteur, new.demande, coalesce(t, ''));
  return null;
end;
$$;
revoke execute on function public.notifier_avis() from public, anon, authenticated;

create trigger notifier_avis
  after insert on public.avis
  for each row execute function public.notifier_avis();
