-- Lot 19 : calendrier. Après un accord, l'une des deux personnes fixe un rendez-vous (date, heure, lieu) ;
-- l'autre est prévenue, et les deux reçoivent un rappel la veille. Si l'accord est retiré, le rendez-vous disparaît de l'écran.

create table public.rendez_vous (
  id uuid primary key default gen_random_uuid(),
  demande uuid not null unique references public.demandes (id) on delete cascade,
  quand timestamptz not null,
  lieu text not null default '' check (char_length(lieu) <= 80),
  propose_par uuid not null default auth.uid() references public.profils (id) on delete cascade,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  rappel_envoye boolean not null default false
);
create index rendez_vous_quand on public.rendez_vous (quand);
alter table public.rendez_vous enable row level security;

-- Comme la messagerie : seules les deux personnes d'une demande acceptée voient et gèrent le rendez-vous.
create policy "Voir le rendez-vous de ses accords" on public.rendez_vous
  for select to authenticated using ((select public.dans_conversation(demande)));
create policy "Fixer un rendez-vous" on public.rendez_vous
  for insert to authenticated
  with check (propose_par = (select auth.uid()) and (select public.dans_conversation(demande)));
create policy "Modifier le rendez-vous" on public.rendez_vous
  for update to authenticated
  using ((select public.dans_conversation(demande)))
  with check ((select public.dans_conversation(demande)));
create policy "Annuler le rendez-vous" on public.rendez_vous
  for delete to authenticated using ((select public.dans_conversation(demande)));

revoke all on public.rendez_vous from anon, authenticated;
grant select, delete on public.rendez_vous to authenticated;
grant insert (demande, quand, lieu) on public.rendez_vous to authenticated;
grant update (quand, lieu) on public.rendez_vous to authenticated;

-- Avant chaque écriture : une date à venir (un an au plus), un lieu nettoyé ; le rappel repart à zéro si la date change.
create function public.verifier_rendez_vous() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.quand is distinct from old.quand then
    if new.quand <= now() then
      raise exception 'date_passee';
    end if;
    if new.quand > now() + interval '1 year' then
      raise exception 'date_trop_lointaine';
    end if;
    -- Moins de 24 h avant : pas de rappel (on vient de fixer la date).
    new.rappel_envoye := new.quand <= now() + interval '24 hours';
  end if;
  new.lieu := btrim(new.lieu);
  if tg_op = 'INSERT' then
    new.cree_le := now();
  else
    new.modifie_le := now();
  end if;
  return new;
end;
$$;
create trigger verifier_rendez_vous
  before insert or update on public.rendez_vous
  for each row execute function public.verifier_rendez_vous();

-- Notifications : fixé / modifié / annulé (une seule non lue par rendez-vous : pas de pluie), et rappel la veille.
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('demande_recue', 'acceptee', 'sans_suite', 'avis_recu', 'message_recu', 'alerte',
                  'rdv_fixe', 'rdv_annule', 'rdv_rappel'));

create function public.notifier_rendez_vous() returns trigger
language plpgsql security definer set search_path = '' as $$
declare dem uuid; d record; moi uuid; destinataire uuid; t text;
begin
  dem := case when tg_op = 'DELETE' then old.demande else new.demande end;
  select demandeur, auteur, annonce into d from public.demandes where id = dem;
  if not found then
    return null; -- la demande elle-même a été supprimée : rien à signaler
  end if;
  moi := (select auth.uid());
  if moi is null then
    return null;
  end if;
  destinataire := case when moi = d.demandeur then d.auteur else d.demandeur end;
  select titre into t from public.annonces where id = d.annonce;
  -- Les anciennes notifications de rendez-vous encore non lues sont remplacées par la dernière.
  delete from public.notifications
    where personne = destinataire and demande = dem and lue_le is null and type in ('rdv_fixe', 'rdv_annule', 'rdv_rappel');
  insert into public.notifications (personne, type, acteur, demande, titre)
  values (destinataire, case when tg_op = 'DELETE' then 'rdv_annule' else 'rdv_fixe' end, moi, dem, coalesce(t, ''));
  return null;
end;
$$;
revoke execute on function public.notifier_rendez_vous() from public, anon, authenticated;
create trigger notifier_rendez_vous
  after insert or delete on public.rendez_vous
  for each row execute function public.notifier_rendez_vous();
create trigger notifier_rendez_vous_modifie
  after update of quand, lieu on public.rendez_vous
  for each row when (old.quand is distinct from new.quand or old.lieu is distinct from new.lieu)
  execute function public.notifier_rendez_vous();

-- Rappel la veille : quand j'ouvre l'appli, les rendez-vous qui ont lieu dans moins de 24 h (et dont le rappel n'est pas parti)
-- préviennent les deux personnes. Une notification n'est de toute façon vue qu'à l'ouverture de l'appli.
create function public.rappels_rdv() returns integer
language plpgsql security definer set search_path = '' as $$
declare r record; n integer := 0;
begin
  if (select auth.uid()) is null then
    return 0;
  end if;
  for r in
    update public.rendez_vous v set rappel_envoye = true
    from public.demandes d
    where d.id = v.demande and d.statut = 'acceptee'
      and (d.demandeur = (select auth.uid()) or d.auteur = (select auth.uid()))
      and not v.rappel_envoye and v.quand > now() and v.quand <= now() + interval '24 hours'
    returning v.demande as demande, d.demandeur as demandeur, d.auteur as auteur, d.annonce as annonce
  loop
    insert into public.notifications (personne, type, acteur, demande, titre)
    select p.personne, 'rdv_rappel', p.autre, r.demande, coalesce((select titre from public.annonces where id = r.annonce), '')
    from (values (r.demandeur, r.auteur), (r.auteur, r.demandeur)) as p (personne, autre);
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke execute on function public.rappels_rdv() from public, anon;
grant execute on function public.rappels_rdv() to authenticated;

-- Mes rendez-vous (des accords en cours), avec le titre de l'annonce et l'autre personne.
create function public.mes_rendez_vous()
returns table (demande uuid, annonce uuid, titre text, autre uuid, sens text, quand timestamptz, lieu text, propose_par uuid)
language sql stable security definer set search_path = '' as $$
  select v.demande, d.annonce, a.titre,
         case when d.auteur = (select auth.uid()) then d.demandeur else d.auteur end,
         case when d.auteur = (select auth.uid()) then 'recue' else 'envoyee' end,
         v.quand, v.lieu, v.propose_par
  from public.rendez_vous v
  join public.demandes d on d.id = v.demande
  join public.annonces a on a.id = d.annonce
  where d.statut = 'acceptee' and (d.demandeur = (select auth.uid()) or d.auteur = (select auth.uid()))
  order by v.quand;
$$;
revoke execute on function public.mes_rendez_vous() from public, anon;
grant execute on function public.mes_rendez_vous() to authenticated;
