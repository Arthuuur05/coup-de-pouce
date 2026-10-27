-- Lot 20 : badge « Prise ». À lancer avec les comptes réels (Arthur, Sirown). Lecture seule.
-- La fonction ne renvoie que des identifiants d'annonces, jamais de demandeur.
select pg_get_function_result('public.annonces_prises(uuid[])'::regprocedure) as retour; -- setof uuid
select has_function_privilege('anon', 'public.annonces_prises(uuid[])', 'execute') as anon_peut; -- false
select has_function_privilege('authenticated', 'public.annonces_prises(uuid[])', 'execute') as connecte_peut; -- true
