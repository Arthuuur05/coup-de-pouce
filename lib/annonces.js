// Valeurs et règles des annonces, partagées entre les formulaires, les actions serveur et les écrans.
export const TYPES = { propose: "Je propose", cherche: "Je cherche" };
export const CATEGORIES = [
  "Photo",
  "Vidéo",
  "Développement",
  "Design",
  "Réseaux sociaux",
  "Cours et soutien",
  "Logement",
  "Covoiturage",
  "Événementiel",
  "Autre",
];
// Nom court de chaque catégorie, pour sa couleur dans globals.css (--cat-photo, --cat-video…).
export const CLASSE_CATEGORIE = {
  Photo: "photo",
  Vidéo: "video",
  Développement: "dev",
  Design: "design",
  "Réseaux sociaux": "reseaux",
  "Cours et soutien": "cours",
  Logement: "logement",
  Covoiturage: "covoit",
  Événementiel: "evenementiel",
  Autre: "autre",
};
export const LIMITES = { titre: 60, description: 500, contrepartie: 60, quand: 60 };
export const MIN = { titre: 3, description: 10 };
export const MAX_EN_LIGNE = 5;
export const DUREE_JOURS = 30;
export const PAR_PAGE = 30;
export const PREVENIR_JOURS = 3;

// Vérifie les champs d'une annonce. Mêmes règles que la base, avec des messages en français.
export function verifierAnnonce(v) {
  const erreurs = {};
  if (!TYPES[v.type]) erreurs.type = "Choisis : tu proposes ou tu cherches ?";
  if (!CATEGORIES.includes(v.categorie)) erreurs.categorie = "Choisis une catégorie.";
  if (v.titre.length < MIN.titre) erreurs.titre = "Donne un titre à ton annonce (3 caractères minimum).";
  else if (v.titre.length > LIMITES.titre) erreurs.titre = `${LIMITES.titre} caractères maximum.`;
  if (v.description.length < MIN.description) erreurs.description = "Explique en une phrase ou deux (10 caractères minimum).";
  else if (v.description.length > LIMITES.description) erreurs.description = `${LIMITES.description} caractères maximum.`;
  if (v.contrepartie.length > LIMITES.contrepartie) erreurs.contrepartie = `${LIMITES.contrepartie} caractères maximum.`;
  if (v.quand.length > LIMITES.quand) erreurs.quand = `${LIMITES.quand} caractères maximum.`;
  return erreurs;
}

export const estEnLigne = (a) => a.statut === "active" && new Date(a.expire_le) > new Date();

// En ligne mais plus que 3 jours ou moins : on propose de la prolonger.
export const expireBientot = (a) => estEnLigne(a) && joursRestants(a.expire_le) <= PREVENIR_JOURS;

// « En ligne », « Expire dans 2 j », « Réglée » ou « Expirée », avec la variante d'étiquette qui va avec.
export function etatAnnonce(a) {
  if (a.statut === "reglee") return { texte: "C'est réglé", variante: "categorie" };
  if (!estEnLigne(a)) return { texte: "Expirée", variante: "refusee" };
  if (expireBientot(a)) return { texte: `Expire dans ${joursRestants(a.expire_le)} j`, variante: "attente" };
  return { texte: "En ligne", variante: "acceptee" };
}

// Même règle que la fonction sans_accents de la base : « Événement » → « evenement ».
export const sansAccents = (texte) =>
  String(texte ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// « Léa · Design M1 » : jamais le nom de famille.
export function signature(auteur) {
  if (!auteur) return "Un étudiant";
  const detail = [auteur.filiere, auteur.annee].filter(Boolean).join(" ");
  return [auteur.prenom || "Un étudiant", detail].filter(Boolean).join(" · ");
}

// « à l'instant », « il y a 3 h », « hier », « il y a 4 j », puis la date.
export function dateRelative(iso, maintenant = new Date()) {
  const minutes = Math.floor((maintenant - new Date(iso)) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  if (jours === 1) return "hier";
  if (jours < 7) return `il y a ${jours} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });
}

// Nombre de jours avant expiration (0 si déjà expirée).
export function joursRestants(iso, maintenant = new Date()) {
  return Math.max(0, Math.ceil((new Date(iso) - maintenant) / 86400000));
}
