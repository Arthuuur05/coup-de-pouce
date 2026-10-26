-- Lot 6 : compétences, avis et CV.
-- Une compétence est « validée » quand d'autres étudiants, après une mise en relation acceptée, la confirment dans un avis.

-- 1. Compétences : 12 au plus par personne, lisibles par tous les étudiants connectés.
create table public.competences (
  id uuid primary key default gen_random_uuid(),
  personne uuid not null default auth.uid() references public.profils (id) on delete cascade,
  nom text not null check (char_length(nom) between 2 and 40),
  cree_le timestamptz not null default now()
);
create unique index competences_unique on public.competences (personne, lower(nom));
alter table public.competences enable row level security;

create policy "Voir les compétences" on public.competences
  for select to authenticated using (true);
create policy "Ajouter ses compétences" on public.competences
  for insert to authenticated with check (personne = (select auth.uid()));
create policy "Supprimer ses compétences" on public.competences
  for delete to authenticated using (personne = (select auth.uid()));

revoke all on public.competences from anon, authenticated;
grant select, delete on public.competences to authenticated;
grant insert (nom) on public.competences to authenticated;

create function public.verifier_competence() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.nom := btrim(regexp_replace(new.nom, '\s+', ' ', 'g'));
  new.cree_le := now();
  if (select count(*) from public.competences where personne = new.personne) >= 12 then
    raise exception 'trop_de_competences';
  end if;
  return new;
end;
$$;
create trigger verifier_competence
  before insert on public.competences
  for each row execute function public.verifier_competence();

-- 2. Avis : un seul par personne et par demande acceptée, sur l'autre personne de la demande.
create table public.avis (
  id uuid primary key default gen_random_uuid(),
  demande uuid references public.demandes (id) on delete set null,
  auteur uuid not null default auth.uid() references public.profils (id) on delete cascade,
  cible uuid not null references public.profils (id) on delete cascade,
  note smallint not null check (note between 1 and 5),
  commentaire text not null default '' check (char_length(commentaire) <= 300),
  competence uuid references public.competences (id) on delete set null,
  cree_le timestamptz not null default now(),
  unique (demande, auteur)
);
create index avis_cible on public.avis (cible, cree_le desc);
alter table public.avis enable row level security;

create policy "Voir les avis" on public.avis
  for select to authenticated using (true);
create policy "Donner un avis en son nom" on public.avis
  for insert to authenticated with check (auteur = (select auth.uid()));
create policy "Retirer son avis" on public.avis
  for delete to authenticated using (auteur = (select auth.uid()));

revoke all on public.avis from anon, authenticated;
grant select, delete on public.avis to authenticated;
grant insert (demande, note, commentaire, competence) on public.avis to authenticated;

create function public.verifier_avis() returns trigger
language plpgsql set search_path = '' as $$
declare d record;
begin
  select demandeur, auteur, statut into d from public.demandes where id = new.demande;
  if not found or d.statut not in ('acceptee', 'retiree') then
    raise exception 'avis_impossible';
  end if;
  if new.auteur = d.demandeur then
    new.cible := d.auteur;
  elsif new.auteur = d.auteur then
    new.cible := d.demandeur;
  else
    raise exception 'avis_impossible';
  end if;
  if new.competence is not null
     and not exists (select 1 from public.competences where id = new.competence and personne = new.cible) then
    raise exception 'competence_inconnue';
  end if;
  new.commentaire := btrim(new.commentaire);
  new.cree_le := now();
  return new;
end;
$$;
create trigger verifier_avis
  before insert on public.avis
  for each row execute function public.verifier_avis();

-- 3. CV : un PDF par personne, visible par elle et par ses contacts acceptés (comme les coordonnées).
create table public.cvs (
  personne uuid primary key default auth.uid() references public.profils (id) on delete cascade,
  chemin text not null,
  nom_fichier text not null default 'cv.pdf' check (char_length(nom_fichier) <= 120),
  modifie_le timestamptz not null default now()
);
alter table public.cvs enable row level security;

create policy "Voir son CV et celui d'un contact accepté" on public.cvs
  for select to authenticated
  using (
    personne = (select auth.uid())
    or exists (
      select 1 from public.demandes d
      where d.statut = 'acceptee'
        and ((d.demandeur = (select auth.uid()) and d.auteur = cvs.personne)
          or (d.auteur = (select auth.uid()) and d.demandeur = cvs.personne))
    )
  );
create policy "Ajouter son CV" on public.cvs
  for insert to authenticated with check (personne = (select auth.uid()));
create policy "Remplacer son CV" on public.cvs
  for update to authenticated
  using (personne = (select auth.uid())) with check (personne = (select auth.uid()));
create policy "Supprimer son CV" on public.cvs
  for delete to authenticated using (personne = (select auth.uid()));

revoke all on public.cvs from anon, authenticated;
grant select, delete on public.cvs to authenticated;
grant insert (personne, chemin, nom_fichier), update (chemin, nom_fichier, modifie_le) on public.cvs to authenticated;

-- Espace privé « cv » : PDF de 5 Mo au plus, un dossier par personne.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cv', 'cv', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

create policy "Lire son CV ou celui d'un contact accepté" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'cv'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.demandes d
        where d.statut = 'acceptee'
          and ((d.demandeur = (select auth.uid()) and d.auteur::text = (storage.foldername(name))[1])
            or (d.auteur = (select auth.uid()) and d.demandeur::text = (storage.foldername(name))[1]))
      )
    )
  );
create policy "Ajouter son CV" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cv' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Remplacer son CV" on storage.objects
  for update to authenticated
  using (bucket_id = 'cv' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Supprimer son CV" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cv' and (storage.foldername(name))[1] = (select auth.uid())::text);
