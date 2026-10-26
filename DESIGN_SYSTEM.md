# Coup de Pouce — design system

Direction artistique validée le 22 octobre 2026 : **« Affiche de campus, rouge et noir »** (proposition A3).
L'appli doit ressembler à une affiche collée dans un couloir d'école : titres énormes en majuscules, contrastes francs, un mot manuscrit rouge posé en biais. Inspirée des codes de l'école, sans reprendre son nom ni son logo.

À relire avant de créer ou modifier un écran. Toute valeur vient de `app/globals.css` : on n'écrit jamais une couleur, une police ou un arrondi « en dur » dans un composant.

## Couleurs

| Rôle | Variable CSS | Valeur | Usage |
| --- | --- | --- | --- |
| Accent | `--rouge` | `#C62828` | bandeau du haut, onglet actif, étiquette « Je propose », mot manuscrit, ombre des cartes |
| Encre | `--noir` | `#111111` | texte, contours, boutons principaux, menu du bas |
| Fond | `--creme` | `#F5F1EA` | fond de toutes les pages |
| Surface | `--blanc` | `#FFFFFF` | cartes, champs, boutons secondaires |
| Texte doux | `--gris` | `#55524A` | dates, légendes |
| Rouge clair | `--rouge-clair` | `#FFB4B4` | petit texte sur fond noir |
| Succès | `--vert` / `--vert-fond` | `#1F6B3A` / `#DCEFD9` | statut « Acceptée » |
| Attente | `--ambre` / `--ambre-fond` | `#7A4D00` / `#FBE7C2` | statut « En attente » |

Couleurs des catégories (`--cat-photo`, `--cat-video`…) : dix teintes douces « papier d'affiche » (pêche, mauve, bleu ciel, rose, jaune, vert tilleul, kraft, menthe, pervenche, gris). Elles ne servent **que** au fond de l'étiquette de catégorie et au liseré de 8 px en haut de la carte : jamais pour un texte, un bouton ou un fond de page.

Règles : une seule couleur d'accent (le rouge). Pas de dégradé, pas de néon, pas de fond sombre plein écran.

## Typographie

| Rôle | Police | Variable | Réglages |
| --- | --- | --- | --- |
| Titres, boutons, étiquettes | Barlow Condensed | `--font-titre` | 700–800, MAJUSCULES, interligne 0,9 |
| Texte courant | DM Sans | `--font-texte` | 400–700, 15 px |
| Mot manuscrit | Caveat Brush | `--font-main` | rouge, rotation −12°, un seul par écran maximum |

Tailles : titre d'écran 54 px · titre de carte 26 px · texte 15 px · légende 12–13 px.

## Formes

- **Angles nets** : boutons, étiquettes, champs et cartes ont un arrondi de 0 à 2 px.
- **Contour** : 2 px noir sur cartes, boutons et champs.
- **Ombre d'affiche** : décalée et pleine, jamais floue (`5px 5px 0` noir ou rouge).
- **Cartes « affiche »** : légèrement de travers (−1° ou +0,8°), une sur deux dans l'autre sens.
- **Espacements** : multiples de 4 px ; marge des écrans 20 px ; zone de clic ≥ 44 px.

## Composants (`components/ui/`)

| Composant | Fichier | Variantes |
| --- | --- | --- |
| Bouton | `Bouton.js` | `principal` (noir), `secondaire` (blanc contouré), `accent` (rouge), `danger` |
| Étiquette | `Etiquette.js` | `propose` (rouge), `cherche` (contour), `categorie`, `attente`, `acceptee`, `refusee` ; `couleur` donne le fond d'une catégorie |
| Carte d'annonce | `CarteAnnonce.js` | ombre noire ou rouge, inclinaison alternée ; `href` rend toute la carte cliquable, `extrait` ajoute le début de la description, `etat` remplace la date par « En ligne » (vert), « Expire dans 2 j » (ambre), « C'est réglé » (neutre) ou « Expirée » (rouge) ; `photo` en haut de la carte ; `avatar` (photo ou initiale de 24 px) ; `favori` + `actionFavori` pour le cœur ; `eteinte` grise une annonce plus disponible |
| Champ | `Champ.js` | texte, menu déroulant (`options`), zone de texte (`multiligne`), compteur « 12/60 » (`compteur`), avec aide ou erreur |
| Bandeau météo | `BandeauMeteo.js` | fond noir, ombre rouge |
| Menu du bas | `MenuBas.js` | téléphone : 5 onglets : Annonces, Météo, Publier (centre), Demandes, Profil ; `enAttente` ajoute la pastille |
| Menu du haut | `MenuHaut.js` | ordinateur : barre noire, onglets en toutes lettres, bouton rouge « Publier », initiale ; `enAttente` ajoute la pastille |
| Pastille | classe `.pastille` | rond rouge avec un chiffre blanc : demandes reçues en attente (menu, onglet Reçues) ; s'inverse en blanc sur un fond rouge |
| Bandeau du haut | `BandeauHaut.js` | rouge, texte en majuscules |
| Mot manuscrit | `MotManuscrit.js` | un par écran maximum |
| Message | `Message.js` | `erreur` (contour et ombre rouges), `ok` (vert) |
| Puce de filtre | classe `.puce` (dans `components/annonces/Filtres.js`) | blanche contourée, noire quand elle est active |
| Choix du type | classe `.choix-type` (dans `FormAnnonce.js`) | deux gros boutons, le choisi passe en rouge avec une ombre noire |
| Initiale | `Initiale.js` | photo de profil carrée, ou carré noir avec l'initiale ; 40 px (en-tête), grand 72 px avec ombre rouge (profil), petit 24 px (cartes) |
| Choix de photo | `ChampPhoto.js` | aperçu, « Choisir / Changer / Retirer » ; réduit la photo dans le navigateur (1 600 px, ou carré 512 px pour le profil) |
| Cœur | classe `.coeur` (dans `CarteAnnonce.js`) | contour noir, plein rouge quand l'annonce est en favori |

### Mise en relation (`components/demandes/`)

| Composant | Fichier | Variantes |
| --- | --- | --- |
| Carte de demande | `CarteDemande.js` | l'autre personne (photo, prénom, filière), statut en étiquette, annonce dans un cadre pointillé, message en citation à filet rouge ; ombre rouge quand elle attend une réponse, sans ombre une fois refusée |
| Coordonnées | `Coordonnees.js` | encadré vert (la seule surface verte pleine) : e-mail, téléphone, Instagram en liens cliquables, visible seulement après un accord |
| Demander le contact | `FormDemande.js` | message facultatif de 300 caractères avec compteur, bouton rouge |
| Mes coordonnées | `FormCoordonnees.js` | carte blanche à bord pointillé (« privé »), trois champs facultatifs |

La page `/design` montre tous les composants : c'est la référence visuelle.

## Téléphone et ordinateur

Le téléphone passe en premier : chaque écran est d'abord pensé à 375 px. À partir de 960 px de large :

- le menu passe en haut (`MenuHaut`), le menu du bas disparaît ;
- le contenu s'élargit jusqu'à 1120 px, titres d'écran à 96 px ;
- les formulaires mettent deux champs côte à côte (`champs-duo`) ;
- Inscription et Connexion deviennent une affiche : panneau noir à gauche, formulaire à droite ;
- le fil d'annonces passe sur 3 colonnes (2 dans le profil) ;
- Publier : formulaire à gauche, aperçu de la carte à droite qui suit le défilement ;
- détail d'une annonce : texte à gauche, auteur et boutons à droite (`deux-colonnes--annonce`) ;
- Demandes : les cartes passent sur 2 colonnes, Accepter et Refuser côte à côte à leur taille ;
- classes utiles : `seulement-telephone`, `seulement-ordi`, `deux-colonnes`.

## Ton

On tutoie, phrases courtes, verbes d'action : « Contacter », « Je peux aider », « Publier ». Les titres sont des questions ou des exclamations courtes en majuscules.

## Ce qu'on ne fait pas

- Pas de nom ni de logo de l'école.
- Pas d'emoji dans l'interface, des icônes à trait.
- Pas de nouvelle couleur sans mettre à jour ce fichier et `globals.css`.
