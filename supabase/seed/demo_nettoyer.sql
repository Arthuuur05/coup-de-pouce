-- Efface TOUTES les données de démonstration (comptes @demo.coupdepouce.test et tout ce qui leur est lié :
-- profils, annonces, demandes, avis, messages, favoris, notifications, activité…).
-- Les vrais comptes ne sont pas touchés. Les lignes du journal marquées « [démo] » sont aussi retirées.
delete from public.journal where message like '[démo]%';
delete from auth.users where email like '%@demo.coupdepouce.test';
