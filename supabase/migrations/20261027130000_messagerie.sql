-- Lot 11 : messagerie interne après accord. Deux personnes dont la demande est acceptée peuvent s'écrire,
-- sans échanger leurs coordonnées. Si l'accord est retiré, la conversation se ferme et disparaît de l'écran.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  demande uuid not null references public.demandes (id) on delete cascade,
  auteur uuid not null default auth.uid() references public.profils (id) on delete cascade,
  texte text not null check (char_length(btrim(texte)) between 1 and 500),
  cree_le timestamptz not null default now(),
  lu_le timestamptz
);
create index messages_demande on public.messages (demande, cree_le);
alter table public.messages enable row level security;

-- Participer à une conversation : être l'une des deux personnes d'une demande acceptée.
create function public.dans_conversation(d uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.demandes
    where id = d and statut = 'acceptee'
      and (demandeur = (select auth.uid()) or auteur = (select auth.uid()))
  );
$$;
revoke execute on function public.dans_conversation(uuid) from public, anon;
grant execute on function public.dans_conversation(uuid) to authenticated;

create policy "Lire les messages de ses conversations" on public.messages
  for select to authenticated using ((select public.dans_conversation(demande)));
create policy "Écrire dans ses conversations" on public.messages
  for insert to authenticated
  with check (auteur = (select auth.uid()) and (select public.dans_conversation(demande)));
create policy "Marquer lus les messages reçus" on public.messages
  for update to authenticated
  using (auteur <> (select auth.uid()) and (select public.dans_conversation(demande)))
  with check (auteur <> (select auth.uid()) and (select public.dans_conversation(demande)));

revoke all on public.messages from anon, authenticated;
grant select on public.messages to authenticated;
grant insert (demande, texte) on public.messages to authenticated;
grant update (lu_le) on public.messages to authenticated;

-- Avant chaque message : texte nettoyé, 30 messages par heure au plus.
create function public.verifier_message() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if (select count(*) from public.messages where auteur = new.auteur and cree_le > now() - interval '1 hour') >= 30 then
      raise exception 'trop_de_messages';
    end if;
    new.texte := btrim(new.texte);
    new.cree_le := now();
    new.lu_le := null;
  end if;
  return new;
end;
$$;
create trigger verifier_message
  before insert or update on public.messages
  for each row execute function public.verifier_message();

-- Notifications : un « nouveau message » par conversation tant qu'il n'est pas lu (pas de pluie de notifications).
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('demande_recue', 'acceptee', 'sans_suite', 'avis_recu', 'message_recu'));

create function public.notifier_message() returns trigger
language plpgsql security definer set search_path = '' as $$
declare d record; destinataire uuid; t text;
begin
  select demandeur, auteur, annonce into d from public.demandes where id = new.demande;
  destinataire := case when new.auteur = d.demandeur then d.auteur else d.demandeur end;
  if not exists (
    select 1 from public.notifications
    where personne = destinataire and demande = new.demande and type = 'message_recu' and lue_le is null
  ) then
    select titre into t from public.annonces where id = d.annonce;
    insert into public.notifications (personne, type, acteur, demande, titre)
    values (destinataire, 'message_recu', new.auteur, new.demande, coalesce(t, ''));
  end if;
  return null;
end;
$$;
revoke execute on function public.notifier_message() from public, anon, authenticated;
create trigger notifier_message
  after insert on public.messages
  for each row execute function public.notifier_message();

-- Mes conversations : une par demande acceptée, avec le dernier message et le nombre de non lus.
create function public.mes_conversations()
returns table (
  demande uuid, annonce uuid, titre text, autre uuid,
  dernier_texte text, dernier_le timestamptz, dernier_auteur uuid, non_lus bigint
)
language sql stable security definer set search_path = '' as $$
  select d.id, d.annonce, a.titre,
         case when d.auteur = (select auth.uid()) then d.demandeur else d.auteur end,
         m.texte, m.cree_le, m.auteur,
         (select count(*) from public.messages x where x.demande = d.id and x.auteur <> (select auth.uid()) and x.lu_le is null)
  from public.demandes d
  join public.annonces a on a.id = d.annonce
  left join lateral (
    select texte, cree_le, auteur from public.messages where demande = d.id order by cree_le desc limit 1
  ) m on true
  where d.statut = 'acceptee' and (d.demandeur = (select auth.uid()) or d.auteur = (select auth.uid()))
  order by coalesce(m.cree_le, d.repondu_le, d.cree_le) desc;
$$;
revoke execute on function public.mes_conversations() from public, anon;
grant execute on function public.mes_conversations() to authenticated;

-- Pastille : nombre total de messages non lus.
create function public.messages_non_lus() returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.messages m
  where m.auteur <> (select auth.uid()) and m.lu_le is null and (select public.dans_conversation(m.demande));
$$;
revoke execute on function public.messages_non_lus() from public, anon;
grant execute on function public.messages_non_lus() to authenticated;
