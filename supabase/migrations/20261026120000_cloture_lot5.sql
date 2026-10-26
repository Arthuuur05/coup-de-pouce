-- Clôture du lot 5 : le demandeur peut aussi retirer l'accord, et 10 demandes en attente au plus à la fois.

-- Le demandeur peut lui aussi modifier sa demande… mais le déclencheur ne lui laisse que « retirer l'accord ».
alter policy "Répondre aux demandes reçues" on public.demandes
  using (auteur = (select auth.uid()) or demandeur = (select auth.uid()))
  with check (auteur = (select auth.uid()) or demandeur = (select auth.uid()));
alter policy "Répondre aux demandes reçues" on public.demandes rename to "Répondre à une demande reçue ou retirer son accord";

create or replace function public.verifier_demande() returns trigger
language plpgsql set search_path = '' as $$
declare a record; en_attente int;
begin
  if tg_op = 'INSERT' then
    select auteur, statut, expire_le into a from public.annonces where id = new.annonce;
    if not found or a.statut <> 'active' or a.expire_le <= now() then
      raise exception 'annonce_indisponible';
    end if;
    if a.auteur = new.demandeur then
      raise exception 'propre_annonce';
    end if;
    select count(*) into en_attente from public.demandes
      where demandeur = new.demandeur and statut = 'en_attente';
    if en_attente >= 10 then
      raise exception 'trop_de_demandes';
    end if;
    new.auteur := a.auteur;
    new.statut := 'en_attente';
    new.cree_le := now();
    new.repondu_le := null;
  elsif new.statut is distinct from old.statut then
    if (select auth.uid()) = old.demandeur then
      -- Le demandeur ne peut que retirer un accord déjà donné.
      if not (old.statut = 'acceptee' and new.statut = 'retiree') then
        raise exception 'statut_impossible';
      end if;
    elsif not ((old.statut = 'en_attente' and new.statut in ('acceptee', 'refusee'))
            or (old.statut = 'acceptee' and new.statut = 'retiree')) then
      raise exception 'statut_impossible';
    end if;
    new.repondu_le := now();
  end if;
  return new;
end;
$$;
