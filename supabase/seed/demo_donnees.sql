-- Données de démonstration : l'appli « vit » (comptes, annonces, demandes, avis, messages, activité, journal).
-- À lancer dans Supabase › SQL Editor. Relançable : le script efface d'abord ses propres données de démo.
-- Tous les faux comptes ont une adresse @demo.coupdepouce.test et le mot de passe Demo1234!
-- Pour tout effacer ensuite : demo_nettoyer.sql. Les vrais comptes ne sont jamais touchés.
-- Prérequis : toutes les migrations (dont super_admin) sont appliquées.

delete from public.journal where message like '[démo]%';
delete from auth.users where email like '%@demo.coupdepouce.test';

do $demo$
declare
  u uuid[] := '{}';             -- les 14 faux comptes, dans l'ordre de la liste
  a uuid[] := '{}';             -- les annonces, dans l'ordre de la liste
  d uuid[] := '{}';             -- les demandes, dans l'ordre de la liste
  r record; id_ uuid; i int;
  pers jsonb := $j$[
    ["Léa","Martin","Communication digitale","L3","Paris","etudiant"],
    ["Sam","Dubois","Audiovisuel","M1","Lyon","etudiant"],
    ["Inès","Benali","Data & IA","M2","Paris","etudiant"],
    ["Hugo","Lefèvre","Développement web","L2","Bordeaux","etudiant"],
    ["Camille","Roux","Design graphique","L3","Nantes","etudiant"],
    ["Yanis","Morel","Marketing digital","M1","Lille","etudiant"],
    ["Chloé","Girard","Événementiel","L2","Toulouse","etudiant"],
    ["Noah","Petit","Data & IA","M1","Paris","etudiant"],
    ["Manon","Faure","Communication digitale","L1","Lyon","etudiant"],
    ["Théo","Bernard","Audiovisuel","L3","Bordeaux","etudiant"],
    ["Jade","Lambert","Design graphique","M2","Lille","etudiant"],
    ["Lucas","Moreau","Développement web","L3","Nantes","etudiant"],
    ["Sofia","Marchand","Photographe indépendante","","Paris","intervenant"],
    ["Marc","Durand","Directeur de production","","Lyon","intervenant"]
  ]$j$;
  emails text[] := array['lea.martin','sam.dubois','ines.benali','hugo.lefevre','camille.roux','yanis.morel','chloe.girard',
                         'noah.petit','manon.faure','theo.bernard','jade.lambert','lucas.moreau','sofia.marchand','marc.durand'];
  comps jsonb := $j$[
    ["Community management","Canva","Rédaction web"],
    ["Montage vidéo","Photo de soirée","DaVinci Resolve"],
    ["Python","Statistiques","Power BI","Maths M1"],
    ["React","HTML/CSS","Aide en JavaScript"],
    ["Identité visuelle","Figma","Illustrator"],
    ["SEO","Réseaux sociaux","Copywriting"],
    ["Organisation d'événements","Budget de soirée"],
    ["SQL","Python","Tableaux de bord"],
    ["Instagram","Création de contenu"],
    ["Cadrage vidéo","Étalonnage","Drone"],
    ["Direction artistique","Motion design","Figma"],
    ["Node.js","Git","Aide en algorithmique"],
    ["Portrait","Photo de mariage","Retouche Lightroom"],
    ["Production audiovisuelle","Gestion de projet"]
  ]$j$;
  annonces jsonb := $j$[
    {"a":2,"t":"propose","c":"Photo","ti":"Photos pour vos soirées et événements","d":"Je couvre vos événements avec mon reflex : portraits, ambiance, groupe. Retouche incluse, livraison sous 3 jours.","co":"Un café ou un coup de main","q":"Week-ends","j":3},
    {"a":1,"t":"propose","c":"Réseaux sociaux","ti":"Je gère l'Instagram de ton asso","d":"Planning de posts, visuels sur Canva et légendes qui donnent envie. Je t'aide à lancer ou relancer un compte.","co":"","q":"Soirs de semaine","j":5},
    {"a":3,"t":"propose","c":"Cours et soutien","ti":"Aide en stats et Python avant les partiels","d":"Révisions de statistiques, régression, pandas. Je prends 1 h par séance, en visio ou sur le campus.","co":"Gratuit","q":"Avant les partiels","j":2},
    {"a":4,"t":"cherche","c":"Design","ti":"Cherche quelqu'un pour un logo","d":"Je lance un projet de site perso et il me faut un logo simple. Je peux t'aider en retour sur le code de ton site.","co":"Aide en code","q":"Cette semaine","j":1},
    {"a":5,"t":"propose","c":"Design","ti":"Identité visuelle pour ton projet étudiant","d":"Logo, couleurs, typo et mini charte graphique pour ton asso ou ton projet. Je livre les fichiers sources.","co":"Un café","q":"","j":6},
    {"a":6,"t":"cherche","c":"Photo","ti":"Photographe pour notre soirée d'intégration","d":"On cherche quelqu'un pour prendre des photos de la soirée d'intégration, vendredi prochain. Une quinzaine de photos suffisent.","co":"Entrée offerte","q":"Vendredi soir","j":2},
    {"a":7,"t":"propose","c":"Événementiel","ti":"Je t'aide à organiser ta soirée","d":"Budget, lieu, playlist, sécurité : je te guide pas à pas pour monter une soirée étudiante propre et qui se passe bien.","co":"","q":"","j":8},
    {"a":8,"t":"propose","c":"Développement","ti":"Cours de SQL pour débutants","d":"Jointures, agrégations, sous-requêtes : on pratique sur des cas réels. Séances d'1 h, matériel fourni.","co":"Gratuit","q":"Soirs de semaine","j":4},
    {"a":9,"t":"cherche","c":"Vidéo","ti":"Besoin d'aide pour monter une vidéo de 2 minutes","d":"J'ai les rushs d'une vidéo de présentation mais je ne sais pas monter. Je peux t'aider sur Instagram en échange.","co":"Aide Instagram","q":"Avant le 20","j":3},
    {"a":10,"t":"propose","c":"Vidéo","ti":"Tournage et montage de clips","d":"Cadrage, étalonnage, drone : je tourne et je monte tes clips et vidéos de présentation. Voir mes compétences sur mon profil.","co":"Matériel pris en charge","q":"Sur rendez-vous","j":9},
    {"a":11,"t":"propose","c":"Design","ti":"Motion design pour tes réseaux","d":"Animations courtes pour tes stories et tes présentations. Je travaille sur After Effects et Figma.","co":"","q":"","j":7},
    {"a":12,"t":"propose","c":"Développement","ti":"Aide en JavaScript et Node.js","d":"Un bug qui résiste ? Un projet à structurer ? Je t'aide à débloquer ton code et à utiliser Git proprement.","co":"Un café","q":"Soirs de semaine","j":2},
    {"a":13,"t":"propose","c":"Photo","ti":"Shooting portrait pour ton CV et LinkedIn","d":"Photographe professionnelle, je réalise des portraits soignés pour étudiants : studio léger, retouche incluse.","co":"Tarif étudiant sur demande","q":"Mercredi après-midi","j":6},
    {"a":14,"t":"propose","c":"Autre","ti":"Conseils de pro pour ton premier tournage","d":"Je dirige des productions audiovisuelles depuis 10 ans. Je réponds à tes questions et je relis ton plan de tournage.","co":"Gratuit","q":"Visio, sur rendez-vous","j":10},
    {"a":1,"t":"cherche","c":"Covoiturage","ti":"Trajet Paris vers Lyon vendredi soir","d":"Je cherche une place pour rentrer à Lyon vendredi soir après les cours. Je participe aux frais d'essence.","co":"Frais partagés","q":"Vendredi","j":1},
    {"a":3,"t":"propose","c":"Covoiturage","ti":"Trajets Paris vers Bordeaux","d":"Je fais Paris-Bordeaux une fois par mois en voiture et il me reste 3 places. Frais partagés, départ le matin.","co":"Frais partagés","q":"Un week-end par mois","j":11},
    {"a":8,"t":"cherche","c":"Logement","ti":"Coloc à Paris pour la rentrée de janvier","d":"Je cherche une chambre en coloc près d'une ligne directe vers le campus pour janvier. Calme, non-fumeur.","co":"","q":"Janvier","j":4},
    {"a":12,"t":"propose","c":"Logement","ti":"Chambre dans une coloc à Nantes","d":"Une chambre se libère dans notre coloc de 3, à 10 minutes du campus en tram. Loyer partagé, charges comprises.","co":"","q":"Dès décembre","j":5},
    {"a":9,"t":"cherche","c":"Cours et soutien","ti":"Aide en marketing digital","d":"Je prépare un partiel de marketing digital et j'aimerais relire mes fiches avec quelqu'un de plus avancé.","co":"Un café","q":"Avant le partiel","j":2},
    {"a":6,"t":"propose","c":"Réseaux sociaux","ti":"SEO et copywriting pour ton site","d":"Je t'aide à écrire des textes qui se lisent et à améliorer le référencement de ton site ou de ton blog.","co":"","q":"","j":12},
    {"a":7,"t":"cherche","c":"Événementiel","ti":"Cherche DJ pour la soirée de fin de semestre","d":"On organise la soirée de fin de semestre et il nous faut un DJ ou quelqu'un avec du matériel de son pour la soirée.","co":"Rémunéré symboliquement","q":"12 décembre","j":3},
    {"a":5,"t":"cherche","c":"Développement","ti":"Quelqu'un pour intégrer mon site Figma en code","d":"J'ai maquetté un site portfolio sous Figma, il me faut de l'aide pour l'intégrer en HTML et CSS propres.","co":"Je fais ton logo","q":"Ce mois-ci","j":4},
    {"a":10,"t":"cherche","c":"Photo","ti":"Photographe pour un shooting de mode","d":"Je prépare un projet de mode pour mon portfolio : il me faut un regard photo. Tenues et lieu déjà prêts.","co":"Visibilité","q":"Samedi","j":7},
    {"a":11,"t":"cherche","c":"Cours et soutien","ti":"Aide en maths pour mon M2","d":"Je reprends des maths après plusieurs années et j'aimerais de l'aide sur les probabilités pour un module de M2.","co":"","q":"","j":14},
    {"a":2,"t":"cherche","c":"Design","ti":"Affiche pour un court métrage","d":"Je termine un court métrage et il me faut une affiche. J'ai des photos de tournage, je cherche un œil de graphiste.","co":"Crédit au générique","q":"Avant le 5","j":6}
  ]$j$;
  -- Demandes : an = n° d'annonce, de = n° du demandeur, s = statut final, j = il y a combien de jours
  demandes jsonb := $j$[
    {"an":1,"de":1,"m":"Salut Sam, super pour la soirée d'intégration de ma promo, tu serais dispo vendredi ?","s":"acceptee","j":3},
    {"an":3,"de":9,"m":"Bonjour, j'ai un partiel de stats lundi, je peux te demander de l'aide ?","s":"acceptee","j":2},
    {"an":4,"de":5,"m":"Je peux te faire un logo, et tu m'aides sur le code de mon portfolio ?","s":"acceptee","j":1},
    {"an":6,"de":2,"m":"Je suis photographe, je peux couvrir votre soirée d'intégration.","s":"acceptee","j":2},
    {"an":7,"de":8,"m":"Je viens de lire ton annonce, j'aimerais des conseils pour ma soirée de fin de semestre.","s":"en_attente","j":1},
    {"an":8,"de":4,"m":"Je débute en SQL, ton cours m'intéresse.","s":"acceptee","j":3},
    {"an":9,"de":10,"m":"Je peux monter ta vidéo, j'ai l'habitude de DaVinci.","s":"acceptee","j":3},
    {"an":10,"de":9,"m":"Ton travail est top ! Tu peux tourner une courte vidéo pour mon asso ?","s":"acceptee","j":5},
    {"an":11,"de":6,"m":"Des animations pour une présentation de projet, c'est possible ?","s":"en_attente","j":2},
    {"an":12,"de":8,"m":"J'ai un bug sur une API Node, tu peux me dépanner ?","s":"acceptee","j":2},
    {"an":13,"de":3,"m":"Bonjour, je voudrais un portrait pour LinkedIn, quels créneaux ?","s":"acceptee","j":5},
    {"an":13,"de":6,"m":"Intéressé par un shooting portrait, c'est quel tarif ?","s":"refusee","j":4},
    {"an":14,"de":10,"m":"Bonjour, je prépare mon premier tournage, vos conseils m'intéressent.","s":"acceptee","j":8},
    {"an":15,"de":2,"m":"Je fais Paris-Lyon vendredi, je peux te prendre.","s":"en_attente","j":1},
    {"an":16,"de":1,"m":"Une place pour Bordeaux début décembre ?","s":"acceptee","j":9},
    {"an":17,"de":3,"m":"Je cherche aussi une coloc pour janvier, on en parle ?","s":"refusee","j":3},
    {"an":18,"de":8,"m":"La chambre est-elle toujours disponible ?","s":"en_attente","j":2},
    {"an":19,"de":6,"m":"Je peux relire tes fiches de marketing, j'ai eu 16 au partiel.","s":"acceptee","j":1},
    {"an":21,"de":9,"m":"Je mixe depuis 3 ans, j'ai mon propre matos.","s":"en_attente","j":2},
    {"an":22,"de":11,"m":"Je peux intégrer ton site Figma, envoie-moi la maquette.","s":"acceptee","j":3},
    {"an":23,"de":13,"m":"Bonjour, ça m'intéresse pour un shooting de mode.","s":"acceptee","j":6},
    {"an":25,"de":5,"m":"Je peux te faire une affiche, on regarde tes photos ?","s":"en_attente","j":4}
  ]$j$;
  avis jsonb := $j$[
    {"dm":1,"au":"demandeur","n":5,"c":"Photos au top, Sam a été ponctuel et très pro. Je recommande !","comp":"Photo de soirée"},
    {"dm":2,"au":"demandeur","n":5,"c":"Inès explique très clairement, j'ai tout compris avant mon partiel.","comp":"Statistiques"},
    {"dm":3,"au":"auteur","n":4,"c":"Super logo, livré rapidement.","comp":"Identité visuelle"},
    {"dm":3,"au":"demandeur","n":5,"c":"Hugo est très à l'écoute, merci pour le coup de main sur mon code.","comp":"HTML/CSS"},
    {"dm":6,"au":"demandeur","n":5,"c":"Noah est très pédagogue, SQL n'a plus de secret pour moi.","comp":"SQL"},
    {"dm":7,"au":"auteur","n":4,"c":"Montage propre et dans les temps.","comp":"Étalonnage"},
    {"dm":8,"au":"demandeur","n":5,"c":"Un vrai pro du tournage, ma vidéo est superbe.","comp":"Cadrage vidéo"},
    {"dm":10,"au":"demandeur","n":5,"c":"Lucas a débloqué mon API en 20 minutes, merci !","comp":"Node.js"},
    {"dm":11,"au":"demandeur","n":5,"c":"Portrait magnifique, Sofia met à l'aise tout de suite.","comp":"Portrait"},
    {"dm":13,"au":"demandeur","n":5,"c":"Marc m'a évité plein d'erreurs de débutant.","comp":"Production audiovisuelle"},
    {"dm":15,"au":"demandeur","n":4,"c":"Trajet agréable, départ à l'heure.","comp":""},
    {"dm":18,"au":"auteur","n":5,"c":"Yanis a relu mes fiches avec beaucoup de soin.","comp":""},
    {"dm":4,"au":"auteur","n":5,"c":"Super ambiance et photos au rendez-vous, merci Sam.","comp":""},
    {"dm":2,"au":"auteur","n":4,"c":"Manon a bien travaillé, très motivée.","comp":""}
  ]$j$;
  -- Messages : dm = n° de demande acceptée, de = qui écrit (demandeur ou auteur), h = il y a combien d'heures
  messages jsonb := $j$[
    {"dm":1,"de":"auteur","t":"Salut Léa ! Oui je suis dispo vendredi, on se retrouve à quelle heure ?","h":50},
    {"dm":1,"de":"demandeur","t":"Parfait, 20 h devant la salle, on a prévu un buffet.","h":48},
    {"dm":1,"de":"auteur","t":"Super, j'apporte le matériel. Tu veux les photos en HD ou allégées ?","h":47},
    {"dm":2,"de":"demandeur","t":"Merci d'avoir accepté ! Je bloque sur la régression linéaire.","h":30},
    {"dm":2,"de":"auteur","t":"Pas de souci, on commence par les bases. Dispo demain à 18 h ?","h":29},
    {"dm":3,"de":"demandeur","t":"Salut Hugo, voici mes premières idées de logo, dis-moi ce que tu en penses.","h":10},
    {"dm":3,"de":"auteur","t":"J'adore la deuxième, on part dessus ! Je t'envoie mon code ce soir.","h":9},
    {"dm":6,"de":"demandeur","t":"Merci pour le cours, je vais refaire les exercices.","h":40},
    {"dm":8,"de":"auteur","t":"Salut Manon, tu veux un tournage plutôt ambiance ou interview ?","h":60},
    {"dm":10,"de":"demandeur","t":"Ça a marché, merci beaucoup Lucas !","h":20},
    {"dm":13,"de":"demandeur","t":"Bonjour Marc, pouvez-vous relire mon plan de tournage ?","h":120},
    {"dm":13,"de":"auteur","t":"Avec plaisir, envoyez-le moi et on en parle en visio jeudi.","h":118},
    {"dm":18,"de":"demandeur","t":"Salut Manon, j'ai relu tes fiches, on peut s'appeler 20 minutes ?","h":5},
    {"dm":20,"de":"demandeur","t":"Peux-tu m'envoyer la maquette Figma ?","h":15}
  ]$j$;
begin
  -- 1. Les faux comptes (le profil se crée tout seul par le déclencheur)
  for r in select value, ord from jsonb_array_elements(pers) with ordinality as t(value, ord) loop
    id_ := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', id_, 'authenticated', 'authenticated',
      emails[r.ord] || '@demo.coupdepouce.test', extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('prenom', r.value ->> 0, 'nom', r.value ->> 1, 'filiere', r.value ->> 2,
                         'annee', r.value ->> 3, 'campus', r.value ->> 4, 'role', r.value ->> 5),
      now() - ((30 - r.ord * 2) || ' days')::interval, now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), id_, id_::text,
      jsonb_build_object('sub', id_::text, 'email', emails[r.ord] || '@demo.coupdepouce.test', 'email_verified', true),
      'email', now(), now(), now());
    u := u || id_;
    update public.profils set cree_le = now() - ((30 - r.ord * 2) || ' days')::interval where id = id_;
  end loop;

  -- 2. Compétences
  for r in select value, ord from jsonb_array_elements(comps) with ordinality as t(value, ord) loop
    for i in 0 .. jsonb_array_length(r.value) - 1 loop
      insert into public.competences (personne, nom) values (u[r.ord], r.value ->> i);
    end loop;
  end loop;

  -- 3. Annonces (les déclencheurs fixent la date : on l'étale ensuite sur les derniers jours)
  for r in select value from jsonb_array_elements(annonces) loop
    insert into public.annonces (auteur, type, categorie, titre, description, contrepartie, quand)
    values (u[(r.value ->> 'a')::int], r.value ->> 't', r.value ->> 'c', r.value ->> 'ti', r.value ->> 'd', r.value ->> 'co', r.value ->> 'q')
    returning id into id_;
    a := a || id_;
    update public.annonces set cree_le = now() - ((r.value ->> 'j')::int || ' days')::interval - (random() * interval '10 hours'),
                               expire_le = now() + interval '30 days' - ((r.value ->> 'j')::int || ' days')::interval
    where id = id_;
  end loop;

  -- 4. Demandes, puis réponses
  for r in select value from jsonb_array_elements(demandes) loop
    insert into public.demandes (annonce, demandeur, message)
    values (a[(r.value ->> 'an')::int], u[(r.value ->> 'de')::int], r.value ->> 'm') returning id into id_;
    d := d || id_;
    if r.value ->> 's' <> 'en_attente' then
      update public.demandes set statut = r.value ->> 's' where id = id_;
    end if;
    update public.demandes set cree_le = now() - ((r.value ->> 'j')::int || ' days')::interval - interval '3 hours',
      repondu_le = case when statut = 'en_attente' then null else now() - ((r.value ->> 'j')::int || ' days')::interval + interval '2 hours' end
    where id = id_;
  end loop;

  -- 5. Avis, messages, favoris, rendez-vous, activité, journal, bulletin : chaque bloc est isolé pour ne pas faire échouer le reste
  begin
    for r in select value from jsonb_array_elements(avis) loop
      declare dm record; auteur_ uuid; cible_ uuid; comp_ uuid;
      begin
        select demandeur, auteur into dm from public.demandes where id = d[(r.value ->> 'dm')::int];
        auteur_ := case when r.value ->> 'au' = 'demandeur' then dm.demandeur else dm.auteur end;
        cible_  := case when r.value ->> 'au' = 'demandeur' then dm.auteur else dm.demandeur end;
        select id into comp_ from public.competences where personne = cible_ and nom = nullif(r.value ->> 'comp', '');
        insert into public.avis (demande, auteur, note, commentaire, competence)
        values (d[(r.value ->> 'dm')::int], auteur_, (r.value ->> 'n')::int, r.value ->> 'c', comp_);
      end;
    end loop;
    update public.avis set cree_le = now() - (random() * interval '6 days') where demande = any (d);
  exception when others then raise notice 'Avis ignorés : %', sqlerrm; end;

  begin
    for r in select value from jsonb_array_elements(messages) loop
      declare dm record; qui uuid;
      begin
        select demandeur, auteur into dm from public.demandes where id = d[(r.value ->> 'dm')::int];
        qui := case when r.value ->> 'de' = 'demandeur' then dm.demandeur else dm.auteur end;
        insert into public.messages (demande, auteur, texte) values (d[(r.value ->> 'dm')::int], qui, r.value ->> 't') returning id into id_;
        update public.messages set cree_le = now() - ((r.value ->> 'h')::int || ' hours')::interval,
          lu_le = case when (r.value ->> 'h')::int > 24 then now() - ((r.value ->> 'h')::int - 1 || ' hours')::interval end
        where id = id_;
      end;
    end loop;
  exception when others then raise notice 'Messages ignorés : %', sqlerrm; end;

  begin
    for i in 1 .. 14 loop
      insert into public.favoris (personne, annonce) values (u[1 + (i * 3) % 14], a[1 + (i * 5) % array_length(a, 1)]) on conflict do nothing;
      insert into public.favoris (personne, annonce) values (u[1 + (i * 7) % 14], a[1 + (i * 3) % array_length(a, 1)]) on conflict do nothing;
    end loop;
  exception when others then raise notice 'Favoris ignorés : %', sqlerrm; end;

  begin
    insert into public.rendez_vous (demande, quand, lieu, propose_par)
    select d[1], now() + interval '2 days', 'Salle B12, campus Paris', demandeur from public.demandes where id = d[1];
    insert into public.rendez_vous (demande, quand, lieu, propose_par)
    select d[2], now() + interval '1 day 3 hours', 'En visio', auteur from public.demandes where id = d[2];
    insert into public.rendez_vous (demande, quand, lieu, propose_par)
    select d[10], now() + interval '4 days', 'Café du campus', auteur from public.demandes where id = d[10];
  exception when others then raise notice 'Rendez-vous ignorés : %', sqlerrm; end;

  begin
    -- Quelques annonces réglées (les demandes en attente de celles-ci disparaissent, c'est normal)
    update public.annonces set statut = 'reglee' where id in (a[10], a[16]);
  exception when others then raise notice 'Annonces réglées ignorées : %', sqlerrm; end;

  begin
    -- Activité : 3 personnes « connectées » maintenant, les autres dans les dernières heures et derniers jours
    for i in 1 .. 14 loop
      insert into public.activite (personne, vu_le) values (u[i],
        now() - case when i <= 3 then (i || ' minutes')::interval
                     when i <= 7 then (i * 40 || ' minutes')::interval
                     when i <= 11 then (i * 5 || ' hours')::interval
                     else (i - 8 || ' days')::interval end)
      on conflict (personne) do update set vu_le = excluded.vu_le;
    end loop;
  exception when others then raise notice 'Activité ignorée : %', sqlerrm; end;

  begin
    insert into public.journal (niveau, source, message, chemin, personne, cree_le) values
      ('erreur', 'écran', '[démo] Cannot read properties of undefined (reading ''prenom'')', '/annonces', u[4], now() - interval '20 minutes'),
      ('erreur', 'cv', '[démo] new row violates row-level security policy for table "cvs"', '/profil', u[9], now() - interval '3 hours'),
      ('erreur', 'demande', '[démo] canceling statement due to statement timeout', '/annonces/demo', u[6], now() - interval '7 hours'),
      ('erreur', 'écran', '[démo] Failed to fetch', '/messages', u[2], now() - interval '1 day 2 hours'),
      ('erreur', 'écran', '[démo] Hydration failed because the server rendered HTML didn''t match the client', '/', u[7], now() - interval '2 days'),
      ('alerte', 'demande', '[démo] 9 demandes en attente pour la même personne', '/demandes', u[1], now() - interval '5 hours'),
      ('alerte', 'cv', '[démo] Fichier refusé : 8 Mo (maximum 5 Mo)', '/profil', u[5], now() - interval '1 day'),
      ('alerte', 'écran', '[démo] Temps de chargement supérieur à 4 s', '/annonces', u[12], now() - interval '3 days'),
      ('info', 'système', '[démo] Migration super_admin appliquée', '', null, now() - interval '4 days'),
      ('info', 'système', '[démo] Bulletin météo publié', '/meteo', null, now() - interval '2 days'),
      ('erreur', 'cv', '[démo] The object exceeded the maximum allowed size', '/profil', u[11], now() - interval '4 days'),
      ('erreur', 'écran', '[démo] Network request failed', '/calendrier', u[8], now() - interval '5 days');
  exception when others then raise notice 'Journal ignoré : %', sqlerrm; end;

  begin
    insert into public.bulletins (semaine, titre, texte, besoins, statut)
    select (date_trunc('week', now() at time zone 'Europe/Paris'))::date,
           'Le campus cherche : Photo',
           'Cette semaine, les étudiants cherchent surtout de l''aide en Photo, Design et Cours et soutien. Si tu sais faire, touche « Je peux aider » : ça peut changer la semaine de quelqu''un.',
           coalesce((select jsonb_agg(jsonb_build_object('categorie', categorie, 'nombre', n))
                     from (select categorie, count(*) n from public.annonces where type = 'cherche' and cree_le > now() - interval '7 days'
                           group by categorie order by n desc, categorie limit 3) t), '[]'::jsonb),
           'publie'
    on conflict (semaine) do nothing;
  exception when others then raise notice 'Bulletin ignoré : %', sqlerrm; end;

  raise notice 'Démo prête : % comptes, % annonces, % demandes.', array_length(u, 1), array_length(a, 1), array_length(d, 1);
end
$demo$;

select 'comptes' as quoi, count(*) from auth.users where email like '%@demo.coupdepouce.test'
union all select 'annonces', count(*) from public.annonces where auteur in (select id from auth.users where email like '%@demo.coupdepouce.test')
union all select 'demandes', count(*) from public.demandes where annonce in (select id from public.annonces)
union all select 'avis', count(*) from public.avis
union all select 'messages', count(*) from public.messages
union all select 'notifications', count(*) from public.notifications
union all select 'connectés (5 min)', count(*) from public.activite where vu_le > now() - interval '5 minutes';
