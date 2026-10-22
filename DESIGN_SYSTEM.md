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
| Étiquette | `Etiquette.js` | `propose` (rouge), `cherche` (contour), `categorie`, `attente`, `acceptee`, `refusee` |
| Carte d'annonce | `CarteAnnonce.js` | ombre noire ou rouge, inclinaison alternée |
| Champ | `Champ.js` | normal, avec erreur |
| Bandeau météo | `BandeauMeteo.js` | fond noir, ombre rouge |
| Menu du bas | `MenuBas.js` | 5 onglets : Annonces, Météo, Publier (centre), Demandes, Profil |
| Bandeau du haut | `BandeauHaut.js` | rouge, texte en majuscules |
| Mot manuscrit | `MotManuscrit.js` | un par écran maximum |

La page `/design` montre tous les composants : c'est la référence visuelle.

## Ton

On tutoie, phrases courtes, verbes d'action : « Contacter », « Je peux aider », « Publier ». Les titres sont des questions ou des exclamations courtes en majuscules.

## Ce qu'on ne fait pas

- Pas de nom ni de logo de l'école.
- Pas d'emoji dans l'interface, des icônes à trait.
- Pas de nouvelle couleur sans mettre à jour ce fichier et `globals.css`.
