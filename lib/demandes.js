// Valeurs et règles de la mise en relation, partagées entre les formulaires, les actions et les écrans.
export const MESSAGE_MAX = 300;
export const MAX_EN_ATTENTE = 10; // demandes envoyées en attente de réponse, à la fois

export const STATUTS = {
  en_attente: { texte: "En attente", variante: "attente" },
  acceptee: { texte: "Acceptée", variante: "acceptee" },
  refusee: { texte: "Refusée", variante: "refusee" },
  retiree: { texte: "Accord retiré", variante: "refusee" },
};

// Côté demandeur, un refus s'affiche « Sans suite ».
export const statutAffiche = (statut, sens) =>
  sens === "envoyee" && statut === "refusee" ? { texte: "Sans suite", variante: "refusee" } : STATUTS[statut] ?? STATUTS.en_attente;

// « Je peux t'aider » sur une annonce Je cherche, « Demander le contact » sur une annonce Je propose.
export const texteBoutonContact = (type) => (type === "cherche" ? "Je peux t'aider" : "Demander le contact");

export const LIMITES_COORDONNEES = { email: 120, telephone: 30, instagram: 30 };

// « @lea.data » ou « instagram.com/lea.data » → « lea.data ».
export const nettoyerInstagram = (texte) =>
  String(texte ?? "")
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");

// Vérifie les coordonnées. Toutes sont facultatives, mais chacune doit être valable.
export function verifierCoordonnees(v) {
  const erreurs = {};
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) erreurs.email = "Cet e-mail n'est pas valide.";
  if (v.email.length > LIMITES_COORDONNEES.email) erreurs.email = `${LIMITES_COORDONNEES.email} caractères maximum.`;
  if (v.telephone && !/^\+?[0-9 .-]{6,20}$/.test(v.telephone)) erreurs.telephone = "Chiffres seulement (ex. 06 12 34 56 78).";
  if (v.instagram && !/^[A-Za-z0-9._]{1,30}$/.test(v.instagram)) erreurs.instagram = "Ton pseudo seulement (ex. lea.data).";
  return erreurs;
}

export const aDesCoordonnees = (c) => Boolean(c && (c.email || c.telephone || c.instagram));
