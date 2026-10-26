// Valeurs et règles des compétences, des avis et du CV, partagées entre les formulaires, les actions et les écrans.
export const MAX_COMPETENCES = 12;
export const NOM_COMPETENCE_MAX = 40;
export const COMMENTAIRE_MAX = 300;
export const CV_POIDS_MAX = 5 * 1024 * 1024;

export const NOTES = [
  { valeur: 1, texte: "Décevant" },
  { valeur: 2, texte: "Moyen" },
  { valeur: 3, texte: "Bien" },
  { valeur: 4, texte: "Très bien" },
  { valeur: 5, texte: "Excellent" },
];

export const nettoyerNom = (texte) => String(texte ?? "").replace(/\s+/g, " ").trim();

export function erreurNomCompetence(nom) {
  if (nom.length < 2) return "Indique une compétence (2 lettres au moins).";
  if (nom.length > NOM_COMPETENCE_MAX) return `${NOM_COMPETENCE_MAX} caractères maximum.`;
  return null;
}

// Moyenne des notes, arrondie à une décimale, ou null s'il n'y a pas d'avis.
export function moyenne(avis) {
  if (!avis.length) return null;
  return Math.round((avis.reduce((somme, a) => somme + a.note, 0) / avis.length) * 10) / 10;
}

// « 1 avis », « 3 avis ».
export const texteAvis = (n) => `${n} avis`;
