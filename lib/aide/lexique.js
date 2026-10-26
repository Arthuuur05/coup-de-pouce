// Le vocabulaire que comprennent l'aide à la rédaction et l'assistant. Tout est écrit sans accents ni majuscules :
// les textes sont passés par `plat` (lib/aide/texte.js) avant d'être comparés. Une entrée de plus de 3 lettres
// reconnaît aussi ses dérivés (« photograph » reconnaît « photographe », « photographie »…).

// Mots qui font reconnaître une catégorie. L'ordre sert à départager deux catégories à égalité.
export const MOTS_CATEGORIES = {
  "Cours et soutien": [
    "cours", "soutien", "maths", "math", "mathematiques", "physique", "chimie", "biologie", "anglais", "espagnol", "allemand",
    "italien", "francais", "philo", "histoire", "geographie", "economie", "compta", "comptabilite", "droit", "statistiques",
    "stats", "algebre", "analyse", "probabilites", "reviser", "revision", "revisions", "partiel", "partiels", "examen", "exam",
    "tuteur", "tutorat", "devoirs", "dissertation", "memoire", "relecture", "correction", "td", "tp", "expose", "oral", "prof",
    "professeur", "apprendre", "expliquer", "exercices", "concours", "toeic", "toefl", "marketing", "gestion",
  ],
  Développement: [
    "dev", "developpement", "developper", "developpeur", "code", "coder", "coding", "programmation", "programmer", "python",
    "javascript", "java", "react", "node", "php", "html", "css", "sql", "site", "web", "application", "appli", "app", "bug",
    "github", "git", "algo", "algorithme", "script", "api", "wordpress", "flutter", "swift", "kotlin", "excel", "data",
  ],
  Design: [
    "design", "logo", "affiche", "flyer", "graphisme", "graphiste", "graphique", "figma", "photoshop", "illustrator", "canva",
    "maquette", "illustration", "identite", "visuel", "poster", "typographie", "charte", "brochure", "plaquette",
  ],
  Vidéo: [
    "video", "videos", "montage", "film", "clip", "tournage", "youtube", "premiere", "davinci", "drone", "camera",
    "cameraman", "court-metrage", "reportage", "interview", "after-movie", "aftermovie", "sous-titres",
  ],
  Photo: [
    "photo", "photos", "photographe", "photographie", "portrait", "portraits", "shooting", "reflex", "retouche", "lightroom",
    "cliche", "argentique", "studio-photo",
  ],
  "Réseaux sociaux": [
    "instagram", "tiktok", "reseaux", "community", "linkedin", "snapchat", "twitter", "facebook", "influence", "influenceur",
    "abonnes", "contenu", "reels", "stories", "newsletter", "communication",
  ],
  Logement: [
    "logement", "chambre", "colloc", "colocation", "coloc", "studio", "appartement", "appart", "louer", "location", "sous-louer",
    "sous-location", "hebergement", "canape", "meuble", "loyer", "residence", "cohabitation",
  ],
  Covoiturage: [
    "covoiturage", "covoit", "voiture", "trajet", "train", "route", "navette", "conduire", "deplacement", "aeroport", "gare",
    "autoroute", "retour", "aller-retour",
  ],
  Événementiel: [
    "soiree", "evenement", "event", "asso", "association", "bde", "gala", "festival", "concert", "anniversaire", "bar", "dj",
    "musique", "organisation", "organiser", "benevole", "stand", "tombola", "integration", "weekend-integration", "buffet",
    "traiteur", "sono", "decoration", "decorations", "mariage", "fete",
  ],
};

// Les matières, pour dire « cours de maths » et non « cours de mathématiques » (le libellé suit l'usage des étudiants).
export const MATIERES = [
  ["maths", ["maths", "math", "mathematiques", "algebre", "analyse", "probabilites", "statistiques", "stats"]],
  ["physique", ["physique"]],
  ["chimie", ["chimie"]],
  ["biologie", ["biologie", "bio"]],
  ["anglais", ["anglais", "toeic", "toefl"]],
  ["espagnol", ["espagnol"]],
  ["allemand", ["allemand"]],
  ["italien", ["italien"]],
  ["français", ["francais", "dissertation", "orthographe"]],
  ["philo", ["philo", "philosophie"]],
  ["histoire", ["histoire"]],
  ["géographie", ["geographie", "geo"]],
  ["économie", ["economie", "eco"]],
  ["comptabilité", ["compta", "comptabilite"]],
  ["droit", ["droit"]],
  ["marketing", ["marketing"]],
  ["gestion", ["gestion"]],
  ["programmation", ["programmation", "algo", "algorithmique"]],
  ["Excel", ["excel"]],
];

// Technologies, pour dire « aide en Python ».
export const TECHNOS = [
  ["Python", ["python"]], ["JavaScript", ["javascript", "js"]], ["Java", ["java"]], ["React", ["react"]], ["PHP", ["php"]],
  ["HTML/CSS", ["html", "css"]], ["SQL", ["sql"]], ["Excel", ["excel"]], ["WordPress", ["wordpress"]], ["Figma", ["figma"]],
  ["Photoshop", ["photoshop"]], ["Canva", ["canva"]], ["Illustrator", ["illustrator"]], ["Lightroom", ["lightroom"]],
  ["Instagram", ["instagram"]], ["TikTok", ["tiktok"]], ["LinkedIn", ["linkedin"]],
];

// Qui parle : je cherche / je propose. Chaque signal vaut 1 point (les plus nets valent 2).
export const SIGNAUX_CHERCHE = [
  [2, /\b(je\s+cherche|je\s+recherche|on\s+cherche|je\s+suis\s+a\s+la\s+recherche|cherche)\b/],
  [2, /\b(besoin\s+d|j'?ai\s+besoin|il\s+me\s+faut|je\s+voudrais|j'?aimerais|je\s+souhaite)\b/],
  [2, /\b(qui\s+(peut|pourrait|pourrais|saurait|sait|connait|aurait|a\s+un|a\s+une)|quelqu'?un\s+(pour|qui|pourrait|peut))\b/],
  [1, /\b(aidez[\s-]?moi|aide[\s-]?moi|svp|s'?il\s+vous\s+plait|s'?il\s+te\s+plait|urgent)\b/],
  [1, /\?/],
];
export const SIGNAUX_PROPOSE = [
  [2, /\b(je\s+propose|je\s+vous\s+propose|je\s+te\s+propose|propose|je\s+donne|j'?offre|j'?aide)\b/],
  [2, /\b(je\s+peux|je\s+sais|je\s+suis\s+(pret|prete|dispo|disponible)|dispo|disponible|a\s+disposition|je\s+mets)\b/],
  [1, /\b(je\s+fais|je\s+prete|je\s+prends|gratuit|gratuitement|benevole|avec\s+plaisir)\b/],
];

export const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
export const MOMENTS = ["matin", "midi", "apres-midi", "soir", "soiree", "nuit"];

// Mots vides : ils ne portent pas le sujet d'une annonce ni d'une question.
export const MOTS_VIDES = new Set(
  `a au aux avec ce ces cet cette ca c d de des du elle en es est et eux il ils je j la le les leur leurs lui ma mais me meme mes moi mon
   ne nos notre nous on ou par pas pour qu que qui sa se ses si son sur ta te tes toi ton tu un une vos votre vous y l m n s t
   suis sommes etes sont ai as avons avez ont peux peut peuvent pourrait pourrais veux veut voudrais aimerais fais fait faire
   cherche cherchons recherche propose proposer donne offre besoin quelqu quelquun quelque quelques tout tous toute toutes plus moins
   tres bien bon bonne bonjour salut hello merci svp stp ici la-bas aussi comme dans entre vers chez sans sous apres avant pendant
   depuis jusqu ainsi alors donc car or ni soit etre avoir aider aide aidez aidant coup main pouce petit petite grand grande
   ce-week-end week-end weekend semaine prochaine prochain demain aujourd hui soir matin midi lundi mardi mercredi jeudi vendredi samedi dimanche
   dispo disponible gratuit gratuitement contre echange cafe quelqu'un quelqu'une projet`.split(/\s+/),
);

// Mots de la phrase qui annoncent la catégorie mais ne sont pas le sujet (« photos » dans « photos soirée asso »).
export const MOTS_DECLENCHEURS = new Set(Object.values(MOTS_CATEGORIES).flat());

export const VILLES_CAMPUS = ["bordeaux", "lille", "lyon", "nantes", "paris", "toulouse"];
