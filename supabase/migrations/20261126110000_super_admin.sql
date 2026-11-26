-- Rôle « super admin » : journal des erreurs, activité des personnes connectées et indicateurs clés.
-- Troisième rôle après étudiant et intervenant. Il n'est jamais choisi à l'inscription : on le donne dans la table profils.
-- N'ajoute que des tables et des fonctions ; ne change aucune règle d'accès existante.

alter table public.profils drop constraint profils_role_check;
alter table public.profils add constraint profils_role_check check (role in ('etudiant', 'intervenant', 'super_admin'));

create function public.est_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'super_admin' from public.profils where id = (select auth.uid())), false);
$$;
revoke execute on function public.est_super_admin() from public, anon;
grant execute on function public.est_super_admin() to authenticated;

-- 1. Journal : erreurs et alertes de l'appli. Lisible par le super admin seulement ; on y écrit par la fonction journaliser().
create table public.journal (
  id uuid primary key default gen_random_uuid(),
  niveau text not null check (niveau in ('erreur', 'alerte', 'info')),
  source text not null default '' check (char_length(source) <= 60),
  message text not null default '' check (char_length(message) <= 500),
  chemin text not null default '' check (char_length(chemin) <= 200),
  personne uuid references public.profils (id) on delete set null,
  cree_le timestamptz not null default now()
);
create index journal_recent on public.journal (cree_le desc);
alter table public.journal enable row level security;
create policy "Lire le journal (super admin)" on public.journal
  for select to authenticated using ((select public.est_super_admin()));
revoke all on public.journal from anon, authenticated;
grant select on public.journal to authenticated;

-- Écrire une ligne : au plus 100 par heure et par personne, pour qu'une boucle d'erreurs ne remplisse pas la base.
create function public.journaliser(niveau text, source text, message text, chemin text default '')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or niveau not in ('erreur', 'alerte', 'info') then
    return;
  end if;
  if (select count(*) from public.journal where personne = (select auth.uid()) and cree_le > now() - interval '1 hour') >= 100 then
    return;
  end if;
  insert into public.journal (niveau, source, message, chemin, personne)
  values (niveau, left(coalesce(source, ''), 60), left(coalesce(message, ''), 500), left(coalesce(chemin, ''), 200), (select auth.uid()));
end;
$$;
revoke execute on function public.journaliser(text, text, text, text) from public, anon;
grant execute on function public.journaliser(text, text, text, text) to authenticated;

-- 2. Activité : la dernière fois qu'une personne connectée a utilisé l'appli (mise à jour au plus toutes les 5 minutes).
create table public.activite (
  personne uuid primary key references public.profils (id) on delete cascade,
  vu_le timestamptz not null default now()
);
alter table public.activite enable row level security;
revoke all on public.activite from anon, authenticated;

create function public.marquer_activite() returns void
language sql security definer set search_path = '' as $$
  insert into public.activite (personne, vu_le)
  select (select auth.uid()), now() where (select auth.uid()) is not null
  on conflict (personne) do update set vu_le = now();
$$;
revoke execute on function public.marquer_activite() from public, anon;
grant execute on function public.marquer_activite() to authenticated;

-- 3. Tableau de bord : des nombres, et le prénom seulement des personnes connectées. Réservé au super admin.
create function public.tableau_de_bord() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  if not (select public.est_super_admin()) then
    raise exception 'reserve_super_admin';
  end if;
  select jsonb_build_object(
    'connectes', (select count(*) from public.activite where vu_le > now() - interval '5 minutes'),
    'actifs_24h', (select count(*) from public.activite where vu_le > now() - interval '24 hours'),
    'actifs_7j', (select count(*) from public.activite where vu_le > now() - interval '7 days'),
    'inscrits', (select count(*) from public.profils),
    'inscrits_7j', (select count(*) from public.profils where cree_le > now() - interval '7 days'),
    'annonces_en_ligne', (select count(*) from public.annonces where statut = 'active' and expire_le > now()),
    'annonces_7j', (select count(*) from public.annonces where cree_le > now() - interval '7 days'),
    'demandes_7j', (select count(*) from public.demandes where cree_le > now() - interval '7 days'),
    'acceptees_7j', (select count(*) from public.demandes where cree_le > now() - interval '7 days' and statut in ('acceptee', 'retiree')),
    'refusees_7j', (select count(*) from public.demandes where cree_le > now() - interval '7 days' and statut = 'refusee'),
    'erreurs_24h', (select count(*) from public.journal where niveau = 'erreur' and cree_le > now() - interval '24 hours'),
    'erreurs_7j', (select count(*) from public.journal where niveau = 'erreur' and cree_le > now() - interval '7 days'),
    'en_ligne', coalesce((
      select jsonb_agg(jsonb_build_object('prenom', p.prenom, 'role', p.role, 'vu_le', a.vu_le) order by a.vu_le desc)
      from (select * from public.activite where vu_le > now() - interval '15 minutes' order by vu_le desc limit 20) a
      join public.profils p on p.id = a.personne
    ), '[]'::jsonb)
  ) into r;
  return r;
end;
$$;
revoke execute on function public.tableau_de_bord() from public, anon;
grant execute on function public.tableau_de_bord() to authenticated;
